import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import type { EffectiveAiSettings } from "./settings";

export function createAiModel(config: EffectiveAiSettings) {
  if (config.providerId === "openai") {
    return createOpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl })(config.model);
  }
  const provider = createOpenAICompatible({
    // The SDK only round-trips Gemini tool-call thought signatures under the "google" key;
    // without them Gemini rejects multi-step tool calls with a 400.
    name: config.providerId === "gemini" ? "google" : config.providerId,
    apiKey: config.apiKey || undefined,
    baseURL: config.baseUrl,
    supportsStructuredOutputs: supportsJsonSchemaOutput(config.providerId),
    ...(config.providerId === "gemini" ? { transformRequestBody: sendPdfAsImageUrl } : {}),
  });

  return provider(config.model);
}

export function getAiTemperature(config: EffectiveAiSettings) {
  // OpenAI reasoning models reject custom temperature; Responses handles their default sampling.
  return config.providerId === "openai" && /^gpt-[56](?:\.|-|$)/.test(config.model)
    ? undefined
    : config.temperature;
}

/** Providers whose API enforces a JSON Schema during decoding (response_format: json_schema). */
export function supportsJsonSchemaOutput(providerId: string) {
  return providerId === "gemini";
}

type ChatContentPart = { type?: string; file?: { file_data?: string } };

/** Gemini's OpenAI endpoint rejects "file" content parts but reads PDFs passed as image_url data URIs. */
export function sendPdfAsImageUrl(body: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(body.messages)) return body;
  return {
    ...body,
    messages: body.messages.map((message: { content?: unknown }) => {
      if (!Array.isArray(message.content)) return message;
      return {
        ...message,
        content: message.content.map((part: ChatContentPart) =>
          part.type === "file" && part.file?.file_data
            ? { type: "image_url", image_url: { url: part.file.file_data } }
            : part,
        ),
      };
    }),
  };
}
