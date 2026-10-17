import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import type { EffectiveAiSettings } from "./settings";

export function createAiModel(config: EffectiveAiSettings) {
  if (config.providerId === "openai") {
    return createOpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl })(config.model);
  }
  const provider = createOpenAICompatible({
    name: config.providerId,
    apiKey: config.apiKey || undefined,
    baseURL: config.baseUrl,
  });

  return provider(config.model);
}

export function getAiTemperature(config: EffectiveAiSettings) {
  // OpenAI reasoning models reject custom temperature; Responses handles their default sampling.
  return config.providerId === "openai" && /^gpt-[56](?:\.|-|$)/.test(config.model)
    ? undefined
    : config.temperature;
}
