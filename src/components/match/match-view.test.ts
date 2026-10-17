import { describe, expect, it } from "vitest";

import { buildMatchResultTitle, type MatchOptimizationResult } from "./match-view";

const result: MatchOptimizationResult = {
  job: {
    id: "version-resume-1",
    company: "本地優化版本",
    title: "AI應用開發工程師",
    city: "待填寫",
    source: "AI履歷優化",
    jd: "",
    link: "",
    deadline: null,
    analysis: null,
    createdAt: "2026-07-02T00:00:00.000Z",
  },
  version: {
    id: "resume-1",
    jobId: null,
    name: "AI優化-林舟-AI應用開發工程師",
    summary: "",
    content: {
      basics: { name: "林舟", email: "", phone: "", city: "", links: [] },
      profile: { title: "AI應用開發工程師", summary: "" },
      education: [],
      experiences: [],
      internships: [],
      projects: [],
      skills: [],
      awards: [],
      customSections: [],
      selfReview: "",
    },
    createdAt: "2026-07-02T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
  optimization: {
    company: "",
    title: "",
    keywords: ["AI Agent開發"],
    summary: "已優化履歷表達。",
    changes: ["自我評價"],
    versionName: "AI優化-林舟-AI應用開發工程師",
  },
};

describe("match result title", () => {
  it("uses general AI optimization title for non-JD optimized versions", () => {
    expect(buildMatchResultTitle(result)).toBe("AI優化履歷完成");
  });
});
