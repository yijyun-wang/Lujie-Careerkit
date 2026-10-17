import { describe, expect, it } from "vitest";

import {
  coerceResumeContent,
  normalizeResumeContent,
  preserveResumeInternalMetadata,
  resumeContentFromText,
  resumeContentInputSchema,
} from "./resume-content";
import type { ResumeContent } from "./types";

const emptyResume: ResumeContent = {
  basics: { name: "Alex", email: "", phone: "", city: "", links: [] },
  profile: { title: "", summary: "" },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: [],
  awards: [],
  selfReview: "",
};

describe("resume content normalization", () => {
  it("splits a phone-prefixed QQ email into phone and email fields", () => {
    const normalized = normalizeResumeContent({
      ...emptyResume,
      basics: {
        ...emptyResume.basics,
        email: "18379185091858653164@qq.com",
      },
    });

    expect(normalized.basics.phone).toBe("18379185091");
    expect(normalized.basics.email).toBe("858653164@qq.com");
  });

  it("keeps imported summaries separate from self evaluations", () => {
    const normalized = resumeContentFromText("resume.txt", [
      "張三",
      "後端工程師",
      "個人總結",
      "專注後端開發。",
      "自我評價",
      "工程基礎紮實。",
    ].join("\n"));

    expect(normalized.profile.summary).toBe("專注後端開發。");
    expect(normalized.selfReview).toBe("工程基礎紮實。");
  });

  it("leaves self evaluation empty when the imported resume does not contain one", () => {
    const normalized = resumeContentFromText("resume.txt", [
      "張三",
      "後端工程師",
      "教育經歷",
      "示例大學 | 學士 | 電腦科學 | 2022 - 2026",
    ].join("\n"));

    expect(normalized.selfReview).toBe("");
  });

  it("coerces model object awards into strings", () => {
    const normalized = coerceResumeContent({
      ...emptyResume,
      awards: [
        { name: "全國總決賽三等獎", issuer: "中國高校計算機大賽", date: "2025" },
        { title: "華東賽區二等獎" },
      ],
    });

    expect(normalized.awards).toEqual(["全國總決賽三等獎 中國高校計算機大賽 2025", "華東賽區二等獎"]);
  });

  it("removes layout bullets and list numbers without dropping real years", () => {
    const normalized = normalizeResumeContent({
      ...emptyResume,
      projects: [
        {
          name: "醫療 AI 專案",
          role: "",
          highlights: ["9. AIGC全端創作者", "🟥模型落地與迭代", "華為 HCIA工程師認證 ●軟著/實用新型專利"],
        },
      ],
      awards: ["2025中國高校計算機大賽三等獎"],
      customSections: [{ title: "主要優勢與技能認證", content: "10. 技術驅動藝術\n■高產出與獎項驗證" }],
    });

    expect(normalized.projects[0]?.highlights).toEqual([
      "AIGC全端創作者",
      "模型落地與迭代",
      "華為 HCIA工程師認證 軟著/實用新型專利",
    ]);
    expect(normalized.awards).toEqual(["2025中國高校計算機大賽三等獎"]);
    expect(normalized.customSections?.[0]?.content).toBe("技術驅動藝術\n高產出與獎項驗證");
  });

  it("does not mistake decimal values for numbered-list prefixes", () => {
    const normalized = normalizeResumeContent({
      ...emptyResume,
      education: [{
        school: "示例大學",
        degree: "學士",
        major: "電腦科學",
        start: "2022",
        end: "2026",
        highlights: ["GPA 3.8/4.0", "3.8/4.0"],
      }],
    });

    expect(normalized.education[0]?.highlights).toEqual(["GPA 3.8/4.0", "3.8/4.0"]);
  });

  it("keeps safe uploaded logos and built-in icon references", () => {
    const normalized = normalizeResumeContent({
      ...emptyResume,
      experiences: [
        { company: "示例公司", role: "開發", logo: "icon:building", start: "", end: "", highlights: [] },
        { company: "示例團隊", role: "演算法", logo: "icon:cpu", start: "", end: "", highlights: [] },
      ],
      projects: [
        { name: "示例專案", role: "", logo: "data:image/png;base64,logo", highlights: [] },
        { name: "無效圖示", role: "", logo: "icon:not-allowed", highlights: [] },
      ],
    });

    expect(normalized.experiences[0].logo).toBe("icon:building");
    expect(normalized.experiences[1].logo).toBe("icon:cpu");
    expect(normalized.projects[0].logo).toBe("data:image/png;base64,logo");
    expect(normalized.projects[1].logo).toBeUndefined();
  });

  it("normalizes editor settings without dropping optimization metadata", () => {
    const metadata = { ...emptyResume, basics: { ...emptyResume.basics, name: "原始履歷" } };
    const stages = {
      analysis: {
        company: "示例公司",
        title: "示例職缺",
        deadline: null,
        requirements: ["溝通能力"],
        keywords: ["溝通"],
        bonusPoints: [],
        risks: [],
        suggestions: ["突出協作經歷"],
      },
      draft: metadata,
      acceptedChangeIds: ["profile.summary"],
      editedValues: { "profile.summary": "人工調整後的內容" },
    };
    const normalized = resumeContentInputSchema.parse({
      ...emptyResume,
      editor: {
        displayName: "測試履歷",
        themeConfig: { fontFamily: "Inter;}</style><script>alert(1)</script>" },
      },
      _tailoringBaseResume: metadata,
      _optimizationStages: stages,
    }) as ResumeContent & {
      _tailoringBaseResume: ResumeContent;
      _optimizationStages: typeof stages;
    };

    expect(normalized.editor?.themeConfig?.fontFamily).toBe("Inter");
    expect(normalized._tailoringBaseResume.basics.name).toBe("原始履歷");
    expect(normalized._optimizationStages).toEqual(stages);
  });

  it("preserves optimization stages when the editor rebuilds visible resume fields", () => {
    const source = {
      ...emptyResume,
      _tailoringBaseResume: { ...emptyResume, basics: { ...emptyResume.basics, name: "原始履歷" } },
      _optimizationMeta: { summary: "優化說明" },
      _optimizationStages: { acceptedChangeIds: ["education.0.highlights.0"] },
    } as ResumeContent;
    const rebuilt = { ...emptyResume, basics: { ...emptyResume.basics, name: "編輯後的履歷" } };

    const result = preserveResumeInternalMetadata(rebuilt, source) as ResumeContent & Record<string, unknown>;
    const sourceRecord = source as ResumeContent & Record<string, unknown>;

    expect(result.basics.name).toBe("編輯後的履歷");
    expect(result._tailoringBaseResume).toEqual(sourceRecord._tailoringBaseResume);
    expect(result._optimizationMeta).toEqual(sourceRecord._optimizationMeta);
    expect(result._optimizationStages).toEqual(sourceRecord._optimizationStages);
  });

  it("drops malformed serialized editor sections before reopening the editor", () => {
    const normalized = normalizeResumeContent({
      ...emptyResume,
      editor: {
        sections: [
          { type: "skills", content: "not-an-object" },
          { type: "summary", content: { text: "保留" }, sortOrder: Number.NaN },
        ] as never,
      },
    });

    expect(normalized.editor?.sections).toEqual([
      expect.objectContaining({ type: "summary", sortOrder: 1, content: { text: "保留" } }),
    ]);
  });
});
