import { describe, expect, it } from "vitest";

import {
  buildOptimizationDescription,
  buildOptimizationSummary,
  buildResumeDiffSections,
} from "./resume-optimization-result";
import type { ResumeContent } from "@/lib/types";

const baseResume: ResumeContent = {
  basics: { name: "陳同學", email: "", phone: "", city: "", links: [] },
  profile: { title: "AI 產品經理", summary: "關注 AI 產品。" },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: ["AI 產品"],
  awards: [],
  customSections: [{ title: "主要優勢與技能認證", content: "AIGC 全端創作者。" }],
  selfReview: "",
};

describe("resume optimization result helpers", () => {
  it("keeps personal summary and self-review labels distinct", () => {
    const personalSummary = {
      ...baseResume,
      profile: { ...baseResume.profile, summary: "突出 AI 產品規劃經驗。" },
    };
    const selfReview = {
      ...baseResume,
      selfReview: "關注真實業務中的產品落地。",
    };

    expect(buildResumeDiffSections(baseResume, personalSummary)[0]?.title).toBe("個人簡介");
    expect(buildResumeDiffSections(baseResume, selfReview)[0]?.title).toBe("自我評價");
  });

  it("reports custom section changes in diff and summary", () => {
    const optimized: ResumeContent = {
      ...baseResume,
      customSections: [{ title: "主要優勢與技能認證", content: "具備 AIGC 全鏈路創作經驗。" }],
    };

    expect(buildResumeDiffSections(baseResume, optimized)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "customSections",
          title: "自訂模組",
          previewTitles: ["主要優勢與技能認證"],
        }),
      ]),
    );
    expect(buildOptimizationSummary(baseResume, optimized, { mode: "general" })).toContainEqual({
      label: "調整範圍",
      value: "自訂模組",
    });
    expect(buildOptimizationDescription(baseResume, optimized, { mode: "general" })).toContain(
      "本次主要調整了自訂模組",
    );
  });

  it("ignores whitespace-only custom section differences", () => {
    const optimized: ResumeContent = {
      ...baseResume,
      customSections: [{ title: "主要優勢與技能認證", content: "  AIGC   全端創作者。\n" }],
    };

    expect(buildResumeDiffSections(baseResume, optimized)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "customSections" })]),
    );
    expect(buildOptimizationSummary(baseResume, optimized, { mode: "general" })).toContainEqual({
      label: "調整範圍",
      value: "保留原結構，僅調整表達重點。",
    });
  });

  it("does not repeat AI summary claims when there is no visible resume diff", () => {
    const meta = {
      company: "",
      title: "",
      keywords: ["AI 產品"],
      summary: "已精簡自訂模組與自我評價。",
      changes: ["自我評價", "自訂模組"],
      versionName: "AI優化-陳同學",
    };

    expect(buildOptimizationDescription(baseResume, baseResume, { mode: "general", meta })).toBe(
      "已完成 AI 優化檢查，本次未發現明顯結構變化。右側履歷沒有明顯高亮模組，可以進入編輯器繼續複核。",
    );
  });

  it("prefers AI-provided summary metadata for result copy", () => {
    const optimized: ResumeContent = {
      ...baseResume,
      profile: { ...baseResume.profile, summary: "突出 AI 產品規劃與落地經驗。" },
    };
    const meta = {
      company: "騰訊",
      title: "產品經理實習生",
      keywords: ["AI 產品", "使用者研究"],
      summary: "已圍繞騰訊產品經理實習生職缺強化 AI 產品規劃、使用者研究和專案落地證據。",
      changes: ["自我評價", "專案經歷"],
      versionName: "JD比對優化-陳同學-騰訊產品經理實習生",
    };

    expect(buildOptimizationDescription(baseResume, optimized, { mode: "jd", meta })).toContain(meta.summary);
    expect(buildOptimizationSummary(baseResume, optimized, { mode: "jd", meta })).toEqual(
      expect.arrayContaining([
        { label: "職缺關鍵字", value: "AI 產品、使用者研究" },
        { label: "調整範圍", value: "自我評價、專案經歷" },
      ]),
    );
  });

  it("keeps general AI optimization copy away from JD wording and internal field names", () => {
    const optimized: ResumeContent = {
      ...baseResume,
      profile: { ...baseResume.profile, summary: "聚焦 AI 產品規劃與核心能力。" },
      customSections: [{ title: "主要優勢與技能認證", content: "具備 AIGC 全鏈路創作與落地經驗。" }],
    };
    const meta = {
      company: "",
      title: "",
      keywords: ["AI Agent開發", "知識圖譜", "大型語言模型應用"],
      summary: "profile.summary增加技術棧與核心能力定位、projects.highlights採用動作方法結果結構、customSections拆分為技術棧模組。",
      changes: [
        "profile.summary增加技術棧與核心能力定位",
        "projects.highlights採用動作+方法+結果的三段式結構",
        "customSections拆分為技術棧與智慧財產權雙模組",
      ],
      versionName: "AI優化-陳同學-核心能力",
    };

    const summaryItems = buildOptimizationSummary(baseResume, optimized, { mode: "general", meta });
    const description = buildOptimizationDescription(baseResume, optimized, { mode: "general", meta });

    expect(summaryItems).toEqual(
      expect.arrayContaining([
        { label: "能力關鍵字", value: "AI Agent開發、知識圖譜、大型語言模型應用" },
        { label: "調整範圍", value: "個人簡介、自訂模組" },
      ]),
    );
    expect(JSON.stringify(summaryItems)).not.toContain("職缺關鍵字");
    expect(JSON.stringify(summaryItems)).not.toContain("profile.summary");
    expect(JSON.stringify(summaryItems)).not.toContain("projects.highlights");
    expect(JSON.stringify(summaryItems)).not.toContain("customSections");
    expect(description).not.toContain("profile.summary");
    expect(description).not.toContain("projects.highlights");
    expect(description).not.toContain("customSections");
  });
});
