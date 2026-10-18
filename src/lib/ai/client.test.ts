import { expect, it } from "vitest";

import { getAiProvider } from "./provider-registry";
import type { EffectiveAiSettings } from "./settings";
import { createAiModel, getAiTemperature, supportsJsonSchemaOutput } from "./client";

it("uses OpenAI Responses and omits unsupported temperature for GPT-6", () => {
  const settings: EffectiveAiSettings = {
    provider: getAiProvider("openai"),
    providerId: "openai",
    model: "gpt-6-luna",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "test-key",
    enabled: true,
    temperature: 0.3,
    requiresApiKey: true,
  };
  expect(createAiModel(settings).provider).toBe("openai.responses");
  expect(getAiTemperature(settings)).toBeUndefined();
  expect(createAiModel({ ...settings, model: "gpt-6.1-sol" }).modelId).toBe("gpt-6.1-sol");
  expect(getAiTemperature({ ...settings, model: "gpt-6.1-sol" })).toBeUndefined();
  expect(getAiTemperature({ ...settings, providerId: "gemini" })).toBe(0.3);
});

it("enforces JSON Schema output only for providers known to support it", () => {
  expect(supportsJsonSchemaOutput("gemini")).toBe(true);
  expect(supportsJsonSchemaOutput("openrouter")).toBe(false);
  expect(supportsJsonSchemaOutput("ollama")).toBe(false);
});
