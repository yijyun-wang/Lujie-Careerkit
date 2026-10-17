import { describe, expect, it, vi } from "vitest";

import { getAiProvider } from "./provider-registry";
import { parseResumeFileWithAi, parseResumeTextWithAi } from "./resume-import";
import type { EffectiveAiSettings } from "./settings";

const settings: EffectiveAiSettings = {
  providerId: "gemini",
  provider: getAiProvider("gemini"),
  model: "gemini-3.8-flash",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  apiKey: "test-key",
  enabled: true,
  temperature: 0.1,
  requiresApiKey: true,
};

describe("resume text import", () => {
  it("uses the configured model to structure extracted text", async () => {
    const result = await parseResumeTextWithAi(
      { fileName: "resume.pdf", text: "張三\n產品經理", settings },
      {
        generateObject: async () => ({
          object: {
            basics: { name: "張三", email: "", phone: "", city: "", links: [] },
            profile: { title: "產品經理", summary: "" },
            education: [], experiences: [], internships: [], projects: [], skills: [], awards: [], selfReview: "",
          } as never,
        }),
      },
    );

    expect(result.source).toBe("ai");
    expect(result.data.basics.name).toBe("張三");
    expect(result.data.profile.title).toBe("產品經理");
  });

  it("tells the model not to duplicate summaries into self evaluation", async () => {
    let prompt = "";
    await parseResumeTextWithAi(
      { fileName: "resume.pdf", text: "張三\n個人總結\n專注後端開發", settings },
      {
        generateObject: async (input) => {
          prompt = input.prompt;
          return {
            object: {
              basics: { name: "張三", email: "", phone: "", city: "", links: [] },
              profile: { title: "", summary: "專注後端開發" },
              education: [], experiences: [], internships: [], projects: [], skills: [], awards: [], selfReview: "",
            } as never,
          };
        },
      },
    );

    expect(prompt).toContain("profile.summary：只放原履歷明確標為個人總結");
    expect(prompt).toContain("不要放自我評價");
    expect(prompt).toContain("selfReview：只放原履歷明確標為自我評價");
    expect(prompt).toContain("不要與 profile.summary 重複");
  });
});

describe("multimodal file import", () => {
  const json = JSON.stringify({
    basics: { name: "張三", email: "", phone: "", city: "", links: [] },
    profile: { title: "", summary: "" },
    education: [], experiences: [], internships: [], projects: [], skills: [], awards: [], selfReview: "",
  });

  it("sends a scanned PDF to the configured model as a file part", async () => {
    const generate = vi.fn(async () => ({ text: json }));
    const resume = await parseResumeFileWithAi(
      { file: new File(["%PDF"], "resume.pdf", { type: "application/pdf" }), kind: "pdf", settings },
      { generate, model: {} as never },
    );
    expect(resume).toMatchObject({ basics: { name: "張三" } });
    const content = (generate.mock.calls[0] as unknown as [{ messages: Array<{ content: Array<{ type: string; mediaType?: string }> }> }])[0].messages[0].content;
    expect(content[1]).toMatchObject({ type: "file", mediaType: "application/pdf" });
  });

  it("sends an image as an image part", async () => {
    const generate = vi.fn(async () => ({ text: json }));
    await parseResumeFileWithAi(
      { file: new File(["png"], "resume.png", { type: "image/png" }), kind: "image", settings },
      { generate, model: {} as never },
    );
    const content = (generate.mock.calls[0] as unknown as [{ messages: Array<{ content: Array<{ type: string; mediaType?: string }> }> }])[0].messages[0].content;
    expect(content[1]).toMatchObject({ type: "image", mediaType: "image/png" });
  });

  it("refuses to send files when AI is disabled", async () => {
    const generate = vi.fn();
    await expect(parseResumeFileWithAi(
      { file: new File(["png"], "resume.png", { type: "image/png" }), kind: "image", settings: { ...settings, enabled: false } },
      { generate, model: {} as never },
    )).rejects.toThrow();
    expect(generate).not.toHaveBeenCalled();
  });
});
