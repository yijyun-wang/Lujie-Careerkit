import { generateText, jsonSchema, Output, type JSONSchema7, type LanguageModel } from "ai";
import { z } from "zod";

import { createAiModel, getAiTemperature, supportsJsonSchemaOutput } from "./client";
import { normalizeAiError } from "./errors";
import type { EffectiveAiSettings } from "./settings";

export type AiTaskResult<T> = {
  data: T;
  source: "ai" | "fallback";
  message: string;
};

export type AiObjectTaskInput<TSchema extends z.ZodType> = {
  settings: EffectiveAiSettings;
  schema: TSchema;
  system: string;
  prompt: string;
  fallback: z.infer<TSchema>;
  taskLabel: string;
};

export type AiObjectExecutor = <TSchema extends z.ZodType>(input: {
  model: LanguageModel;
  schema: TSchema;
  system: string;
  prompt: string;
  temperature?: number;
  structuredOutput?: boolean;
}) => Promise<{ object: z.infer<TSchema> }>;

const connectionTestSchema = z.object({
  ok: z.boolean(),
});

export async function runAiObjectTask<TSchema extends z.ZodType>(
  input: AiObjectTaskInput<TSchema>,
  dependencies: { generateObject?: AiObjectExecutor; model?: LanguageModel } = {},
): Promise<AiTaskResult<z.infer<TSchema>>> {
  if (input.settings.requiresApiKey && !input.settings.apiKey) {
    return fallbackResult(input, "缺少 API Key，請先在設定頁儲存對應模型服務的金鑰。");
  }

  if (!input.settings.enabled) {
    return fallbackResult(input, "當前使用本地規則結果。請在設定中連線 AI 後獲取模型分析。");
  }

  try {
    const model = dependencies.model ?? createAiModel(input.settings);
    const executor = dependencies.generateObject ?? defaultGenerateObject;
    const result = await executor({
      model,
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
      temperature: getAiTemperature(input.settings),
      structuredOutput: supportsJsonSchemaOutput(input.settings.providerId),
    });

    return {
      data: input.schema.parse(result.object),
      source: "ai",
      message: `${input.taskLabel}已由 ${input.settings.provider.label} · ${input.settings.model} 完成。`,
    };
  } catch (error) {
    return fallbackResult(input, normalizeAiError(error).message);
  }
}

export async function testAiConnection(
  settings: EffectiveAiSettings,
  dependencies: { generateObject?: AiObjectExecutor; model?: LanguageModel } = {},
) {
  return runAiObjectTask(
    {
      settings: { ...settings, enabled: true },
      schema: connectionTestSchema,
      system: "你是連線測試助手。請只返回 JSON，不要 Markdown。",
      prompt: '返回 {"ok": true} 表示連線可用。',
      fallback: { ok: false },
      taskLabel: "連線測試",
    },
    dependencies,
  );
}

async function defaultGenerateObject<TSchema extends z.ZodType>(input: {
  model: LanguageModel;
  schema: TSchema;
  system: string;
  prompt: string;
  temperature?: number;
  structuredOutput?: boolean;
}) {
  const schemaJson = z.toJSONSchema(input.schema);
  const schemaDescription = JSON.stringify(schemaJson);
  const result = await generateText({
    model: input.model,
    // Free-form JSON from long prompts occasionally drops a closing brace; a provider-enforced
    // schema prevents that. The full Zod schema still validates the result below.
    ...(input.structuredOutput
      ? { output: Output.object({ schema: jsonSchema(toProviderJsonSchema(schemaJson)) }) }
      : {}),
    system: `${input.system}\n必須僅返回一個 JSON 物件，不要使用 Markdown 程式碼塊。`,
    prompt: `JSON Schema：\n${schemaDescription}\n\n任務：\n${input.prompt}`,
    temperature: input.temperature,
  });

  return { object: input.schema.parse(clampToSchemaLimits(parseAiJsonResponse(result.text), schemaJson)) };
}

/** Drops array items beyond the schema's maxItems so one extra entry doesn't fail the whole task. */
export function clampToSchemaLimits(value: unknown, schema: unknown): unknown {
  if (!schema || typeof schema !== "object") return value;
  const node = schema as { maxItems?: number; items?: unknown; properties?: Record<string, unknown> };
  if (Array.isArray(value)) {
    const items = value.map((item) => clampToSchemaLimits(item, node.items));
    return typeof node.maxItems === "number" ? items.slice(0, node.maxItems) : items;
  }
  if (value && typeof value === "object" && node.properties) {
    const properties = node.properties;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, clampToSchemaLimits(item, properties[key])]),
    );
  }
  return value;
}

// Gemini rejects "$schema" and "maxItems" in response_format schemas.
const UNSUPPORTED_SCHEMA_KEYS = new Set(["$schema", "maxItems"]);

export function toProviderJsonSchema(schema: object): JSONSchema7 {
  return stripSchemaKeys(schema) as JSONSchema7;
}

function stripSchemaKeys(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripSchemaKeys);
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => !UNSUPPORTED_SCHEMA_KEYS.has(key))
      .map(([key, value]) => [key, stripSchemaKeys(value)]),
  );
}

export function parseAiJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidates = [trimmed, fenced].filter((candidate): candidate is string => Boolean(candidate));
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) candidates.push(trimmed.slice(objectStart, objectEnd + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next bounded JSON candidate.
    }
  }
  throw new Error("AI JSON parse failed: response did not contain a valid JSON object.");
}

function fallbackResult<TSchema extends z.ZodType>(
  input: AiObjectTaskInput<TSchema>,
  message: string,
): AiTaskResult<z.infer<TSchema>> {
  return {
    data: input.fallback,
    source: "fallback",
    message,
  };
}
