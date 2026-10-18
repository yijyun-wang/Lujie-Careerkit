import { expect, it } from "vitest";

import { getAiProvider } from "./provider-registry";
import type { EffectiveAiSettings } from "./settings";
import { createAiModel, getAiTemperature, sendPdfAsImageUrl, supportsJsonSchemaOutput } from "./client";

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

it("names the Gemini provider google so tool-call thought signatures round-trip", () => {
  const model = createAiModel({
    provider: getAiProvider("gemini"),
    providerId: "gemini",
    model: "gemini-3.8-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: "test-key",
    enabled: true,
    temperature: 0.3,
    requiresApiKey: true,
  });
  expect(model.provider).toMatch(/^google\./);
});

it("rewrites PDF file parts as image_url data URIs for Gemini", () => {
  const body = sendPdfAsImageUrl({
    model: "gemini-3.8-flash",
    messages: [
      { role: "system", content: "sys" },
      {
        role: "user",
        content: [
          { type: "text", text: "parse" },
          { type: "file", file: { filename: "a.pdf", file_data: "data:application/pdf;base64,AAA" } },
        ],
      },
    ],
  });
  expect(body.messages).toEqual([
    { role: "system", content: "sys" },
    {
      role: "user",
      content: [
        { type: "text", text: "parse" },
        { type: "image_url", image_url: { url: "data:application/pdf;base64,AAA" } },
      ],
    },
  ]);
});
