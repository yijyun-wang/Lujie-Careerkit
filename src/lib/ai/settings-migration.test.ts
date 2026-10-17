import { describe, expect, it } from "vitest";

import { getAiSettingsMaintenancePatch } from "./settings-migration";

describe("AI settings maintenance migration", () => {
  it("repairs the invalid Gemini text model without changing account credentials", () => {
    const patch = getAiSettingsMaintenancePatch({
      aiProvider: "gemini-via-openrouter",
      aiModel: "google/gemini-3.8-flash-lite",
      aiBaseUrl: "https://openrouter.ai/api/v1",
      aiApiKey: "encrypted-key",
      aiEnabled: true,
    });
    expect(patch).toMatchObject({ aiModel: "google/gemini-3.5-flash-lite", aiLastTestStatus: "untested" });
    expect(patch).not.toHaveProperty("aiApiKey");
    expect(patch).not.toHaveProperty("aiProvider");
  });

  it.each(["deepseek", "qwen", "minimax", "moonshot", "zhipu", "volcengine", "siliconflow"])(
    "moves removed China-hosted provider %s to the default provider and clears its key",
    (aiProvider) => {
      expect(
        getAiSettingsMaintenancePatch({
          aiProvider,
          aiModel: "some-model",
          aiBaseUrl: "https://example.cn/v1",
          aiApiKey: "encrypted-key",
          aiEnabled: true,
        }),
      ).toEqual({
        aiProvider: "openai",
        aiModel: "gpt-6-luna",
        aiBaseUrl: "https://api.openai.com/v1",
        aiApiKey: "",
        aiLastTestStatus: "untested",
      });
    },
  );

  it("only migrates old OpenAI placeholder defaults when no key has been configured", () => {
    expect(
      getAiSettingsMaintenancePatch({
        aiProvider: "openai",
        aiModel: "gpt-4o-mini",
        aiBaseUrl: "https://api.openai.com/v1",
        aiApiKey: "",
        aiEnabled: false,
      }),
    ).toMatchObject({
      aiModel: "gpt-6-luna",
      aiLastTestStatus: "untested",
    });
  });

  it("repairs a configured provider model id without dropping its key", () => {
    expect(
      getAiSettingsMaintenancePatch({
        aiProvider: "openrouter",
        aiModel: "openai/gpt-5.6",
        aiBaseUrl: "https://openrouter.ai/api/v1",
        aiApiKey: "encrypted-key",
        aiEnabled: true,
      }),
    ).toMatchObject({
      aiModel: "openai/gpt-5.6-sol",
      aiLastTestStatus: "untested",
    });
  });
});
