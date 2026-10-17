import { describe, expect, it } from "vitest";

import { buildAiResumeSnapshot } from "./resume-snapshot";

describe("AI resume snapshot", () => {
  it("keeps custom sections while removing private contact and editor fields", () => {
    const snapshot = buildAiResumeSnapshot({
      editor: { template: "modern", displayName: "陳同學履歷" },
      basics: {
        name: "陳同學",
        email: "chen@example.com",
        phone: "13800000000",
        city: "上海",
        links: ["https://example.com"],
      },
      customSections: [{ title: "主要優勢與技能認證", content: "AIGC 全端創作者。" }],
      _tailoringBaseResume: {
        basics: { email: "base@example.com", phone: "13900000000" },
      },
      _optimizationMeta: { summary: "內部優化記錄" },
      _optimizationStages: {
        analysis: { suggestions: ["內部階段記錄"] },
        draft: { basics: { email: "stage@example.com" } },
      },
    });

    expect(snapshot).toMatchObject({
      basics: { name: "陳同學", city: "上海" },
      customSections: [{ title: "主要優勢與技能認證", content: "AIGC 全端創作者。" }],
    });
    expect(JSON.stringify(snapshot)).not.toContain("chen@example.com");
    expect(JSON.stringify(snapshot)).not.toContain("13800000000");
    expect(JSON.stringify(snapshot)).not.toContain("base@example.com");
    expect(JSON.stringify(snapshot)).not.toContain("13900000000");
    expect(JSON.stringify(snapshot)).not.toContain("內部優化記錄");
    expect(JSON.stringify(snapshot)).not.toContain("內部階段記錄");
    expect(JSON.stringify(snapshot)).not.toContain("stage@example.com");
    expect(JSON.stringify(snapshot)).not.toContain("template");
  });

  it("removes embedded logos before sending resume content to AI", () => {
    const snapshot = buildAiResumeSnapshot({
      basics: { name: "陳同學" },
      experiences: [{ company: "示例公司", logo: "data:image/png;base64,logo" }],
      internships: [{ company: "實習公司", logo: "data:image/png;base64,logo" }],
      projects: [{ name: "示例專案", logo: "data:image/png;base64,logo" }],
    });

    expect(JSON.stringify(snapshot)).not.toContain("data:image");
    expect(snapshot).toMatchObject({
      experiences: [{ company: "示例公司" }],
      internships: [{ company: "實習公司" }],
      projects: [{ name: "示例專案" }],
    });
  });
});
