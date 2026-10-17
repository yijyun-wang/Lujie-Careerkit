import { describe, expect, it } from "vitest";

import {
  AI_PROVIDER_GROUPS,
  AI_PROVIDERS,
  getAiProvider,
  getCurrentAiModel,
  getDefaultAiModel,
  providerRequiresApiKey,
  REMOVED_AI_PROVIDER_IDS,
  requiresBaseUrl,
} from "./provider-registry";

describe("AI provider registry", () => {
  it("contains international, aggregator, local, and custom groups", () => {
    expect(AI_PROVIDER_GROUPS.map((group) => group.id)).toEqual([
      "international",
      "aggregator",
      "local",
      "custom",
    ]);
  });

  it("returns stable defaults for known providers", () => {
    expect(getDefaultAiModel("openai")).toBe("gpt-6-luna");
    expect(getDefaultAiModel("gemini")).toBe("gemini-3.8-flash");
    expect(getAiProvider("gemini").baseUrl).toBe("https://generativelanguage.googleapis.com/v1beta/openai");
    expect(getDefaultAiModel("anthropic")).toBe("claude-sonnet-5-5");
    expect(getAiProvider("anthropic").baseUrl).toBe("https://api.anthropic.com/v1");
    expect(getDefaultAiModel("gemini-via-openrouter")).toBe("google/gemini-3.8-flash");
    expect(getDefaultAiModel("anthropic-via-openrouter")).toBe("anthropic/claude-fable-5.1");
    expect(getAiProvider("gemini-via-openrouter").models).toContain("google/gemini-3.1-pro-preview");
    expect(getAiProvider("openrouter").models).toContain("anthropic/claude-fable-5.1");
    expect(getAiProvider("openai").models).toContain("gpt-6-astra");
    expect(getAiProvider("xai").models).toContain("grok-4.7");
    expect(getAiProvider("groq").models).toContain("openai/gpt-oss-120b");
    expect(getAiProvider("groq").models).not.toContain("groq/compound");
    expect(getAiProvider("ollama").models).toContain("gpt-oss:120b");
    expect(getDefaultAiModel("ollama")).toBe("gpt-oss:20b");
    expect(getDefaultAiModel("mistral")).toBe("mistral-medium-3-5");
    expect(getAiProvider("mistral").models).toContain("mistral-small-latest");
    expect(getDefaultAiModel("openrouter")).toBe("openai/gpt-6.1-sol");
    expect(getAiProvider("openrouter").models).toContain("mistralai/mistral-medium-3-5");
  });

  it("does not offer China-hosted providers or Chinese-vendor models", () => {
    const ids = AI_PROVIDERS.map((provider) => provider.id);
    for (const removed of REMOVED_AI_PROVIDER_IDS) expect(ids).not.toContain(removed);
    for (const provider of AI_PROVIDERS) {
      expect(provider.baseUrl, provider.id).not.toMatch(/\.cn\b|aliyuncs|volces|deepseek|moonshot|bigmodel|minimax|siliconflow/);
      for (const model of provider.models) {
        expect(model, provider.id).not.toMatch(/deepseek|qwen|kimi|moonshot|glm|minimax|doubao/i);
      }
    }
  });

  it("includes every provider default in its model list", () => {
    for (const provider of AI_PROVIDERS) {
      expect(provider.models, provider.id).toContain(provider.defaultModel);
    }
  });

  it("renames only known stale model ids for their provider", () => {
    expect(getCurrentAiModel("openrouter", "openai/gpt-5.6")).toBe("openai/gpt-5.6-sol");
    expect(getCurrentAiModel("groq", "groq/compound")).toBe("openai/gpt-oss-120b");
    expect(getCurrentAiModel("mistral", "mistral-medium-3.5")).toBe("mistral-medium-3-5");
    expect(getCurrentAiModel("custom-openai-compatible", "openai/gpt-5.6")).toBe("openai/gpt-5.6");
    for (const providerId of ["gemini-via-openrouter", "openrouter"]) {
      expect(getCurrentAiModel(providerId, "google/gemini-3.8-flash-lite")).toBe("google/gemini-3.5-flash-lite");
    }
    expect(getCurrentAiModel("openai", "gpt-6-sol")).toBe("gpt-6-sol");
    expect(getCurrentAiModel("openrouter", "openai/gpt-5.6-sol")).toBe("openai/gpt-5.6-sol");
    expect(getCurrentAiModel("custom-openai-compatible", "google/gemini-3.8-flash-lite")).toBe("google/gemini-3.8-flash-lite");
  });

  it("marks local and custom providers as requiring an editable base URL", () => {
    expect(requiresBaseUrl("ollama")).toBe(true);
    expect(requiresBaseUrl("custom-openai-compatible")).toBe(true);
    expect(requiresBaseUrl("openai")).toBe(false);
  });

  it("knows when an API key is optional", () => {
    expect(providerRequiresApiKey("ollama")).toBe(false);
    expect(providerRequiresApiKey("openai")).toBe(true);
  });

  it("falls back to custom OpenAI-compatible defaults for unknown provider ids", () => {
    expect(getAiProvider("not-real").id).toBe("custom-openai-compatible");
    expect(getDefaultAiModel("not-real")).toBe("gpt-5.6");
  });
});
