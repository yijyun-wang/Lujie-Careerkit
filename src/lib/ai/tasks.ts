import { generateText, type LanguageModel } from "ai";
import { z } from "zod";

import { createAiModel, getAiTemperature } from "./client";
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
}) {
  const schemaDescription = JSON.stringify(z.toJSONSchema(input.schema));
  const result = await generateText({
    model: input.model,
    system: `${input.system}\n必須僅返回一個 JSON 物件，不要使用 Markdown 程式碼塊。`,
    prompt: `JSON Schema：\n${schemaDescription}\n\n任務：\n${input.prompt}`,
    temperature: input.temperature,
  });

  return { object: input.schema.parse(parseAiJsonResponse(result.text)) };
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
