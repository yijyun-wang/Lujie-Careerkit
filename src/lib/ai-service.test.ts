import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEffectiveAiRuntimeSettings: vi.fn(),
  runAiObjectTask: vi.fn(),
}));

vi.mock("./repository", () => ({
  getEffectiveAiRuntimeSettings: mocks.getEffectiveAiRuntimeSettings,
}));
vi.mock("./ai/tasks", () => ({
  runAiObjectTask: mocks.runAiObjectTask,
}));

import { analyzeResumeWithAI, optimizeResumeWithAI, tailorResumeWithAI } from "./ai-service";
import type { ResumeContent } from "./types";

const originalResume: ResumeContent = {
  basics: {
    name: "陳同學",
    email: "chen@example.com",
    phone: "13800000000",
    city: "上海",
    links: ["https://example.com"],
  },
  profile: { title: "AI 產品經理", summary: "關注 AI 產品。" },
  education: [],
  experiences: [],
  internships: [],
  projects: [
    {
      name: "AI 履歷工具",
      role: "產品負責人",
      highlights: ["完成從 0 到 1 的產品設計。"],
    },
  ],
  skills: ["AI 產品", "Prompt"],
  awards: ["校賽一等獎"],
  customSections: [{ title: "主要優勢與技能認證", content: "AIGC 全端創作者。" }],
  selfReview: "",
};

describe("resume AI optimization", () => {
  it("preserves identity fields while accepting AI wording improvements", async () => {
    const aiResume: ResumeContent = {
      ...originalResume,
      basics: {
        ...originalResume.basics,
        name: "張三",
        email: "wrong@example.com",
      },
      profile: { title: "增長產品經理", summary: "具備 AI 產品規劃與 Prompt 迭代經驗。" },
      projects: [
        {
          ...originalResume.projects[0],
          name: "不存在的新專案",
          highlights: ["主導 AI 履歷工具的資訊架構與優化閉環。"],
        },
      ],
    };
    mocks.getEffectiveAiRuntimeSettings.mockResolvedValue({ enabled: true });
    mocks.runAiObjectTask.mockResolvedValue({
      source: "ai",
      message: "履歷優化完成",
      data: aiResume,
    });

    const result = await optimizeResumeWithAI({ resume: originalResume });

    expect(result.source).toBe("ai");
    expect(result.data.basics).toEqual(originalResume.basics);
    expect(result.data.profile).toEqual({
      title: originalResume.profile.title,
      summary: "具備 AI 產品規劃與 Prompt 迭代經驗。",
    });
    expect(result.data.projects[0]).toMatchObject({
      name: originalResume.projects[0].name,
      highlights: ["主導 AI 履歷工具的資訊架構與優化閉環。"],
    });
    expect(mocks.runAiObjectTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskLabel: "AI 履歷優化",
        prompt: expect.stringContaining("不要新增原履歷不存在的事實"),
      }),
    );
    expect(mocks.runAiObjectTask.mock.calls[0]?.[0].schema.safeParse(aiResume).success).toBe(true);
  });

  it("keeps original bullets when the model returns fewer highlights", async () => {
    const resumeWithTwoBullets: ResumeContent = {
      ...originalResume,
      projects: [
        {
          ...originalResume.projects[0],
          highlights: ["完成從 0 到 1 的產品設計。", "推動 3 輪使用者訪談並整理需求。"],
        },
      ],
    };
    mocks.getEffectiveAiRuntimeSettings.mockResolvedValue({ enabled: true });
    mocks.runAiObjectTask.mockResolvedValue({
      source: "ai",
      message: "履歷優化完成",
      data: {
        ...resumeWithTwoBullets,
        projects: [
          {
            ...resumeWithTwoBullets.projects[0],
            highlights: ["主導 AI 履歷工具的資訊架構與優化閉環。"],
          },
        ],
      },
    });

    const result = await optimizeResumeWithAI({ resume: resumeWithTwoBullets });

    expect(result.data.projects[0]?.highlights).toEqual([
      "主導 AI 履歷工具的資訊架構與優化閉環。",
      "推動 3 輪使用者訪談並整理需求。",
    ]);
  });

  it("does not create a personal summary when self-review already provides that content", async () => {
    const resumeWithoutPersonalSummary: ResumeContent = {
      ...originalResume,
      profile: { ...originalResume.profile, summary: "" },
      selfReview: "熟悉 AI 產品設計與 Prompt 迭代。",
    };
    mocks.getEffectiveAiRuntimeSettings.mockResolvedValue({ enabled: true });
    mocks.runAiObjectTask.mockResolvedValue({
      source: "ai",
      message: "履歷優化完成",
      data: {
        ...resumeWithoutPersonalSummary,
        profile: { ...resumeWithoutPersonalSummary.profile, summary: "AI 新增的個人簡介。" },
        selfReview: "熟悉 AI 產品設計、Prompt 迭代與落地驗證。",
      },
    });

    const result = await optimizeResumeWithAI({ resume: resumeWithoutPersonalSummary });

    expect(result.data.profile.summary).toBe("");
    expect(result.data.selfReview).toBe("熟悉 AI 產品設計、Prompt 迭代與落地驗證。");
  });

  it("limits general optimization to selected diagnosis issues and additional direction", async () => {
    mocks.getEffectiveAiRuntimeSettings.mockResolvedValue({ enabled: true });
    mocks.runAiObjectTask.mockResolvedValue({
      source: "ai",
      message: "履歷優化完成",
      data: originalResume,
    });
    const diagnosis = {
      summary: "專案表達需要加強。",
      strengths: [],
      issues: [
        {
          id: "issue-1",
          section: "projects" as const,
          location: "AI 履歷工具",
          severity: "high" as const,
          category: "action-result" as const,
          title: "缺少結果證據",
          evidence: "完成從 0 到 1 的產品設計。",
          explanation: "沒有說明設計帶來的結果。",
          suggestion: "使用已有事實補充結果。",
        },
        {
          id: "issue-2",
          section: "summary" as const,
          location: "求職摘要",
          severity: "low" as const,
          category: "clarity" as const,
          title: "摘要較短",
          evidence: "關注 AI 產品。",
          explanation: "能力重點不夠清楚。",
          suggestion: "補充核心能力。",
        },
        {
          id: "issue-3",
          section: "education" as const,
          location: "教育背景",
          severity: "high" as const,
          action: "user-confirm" as const,
          category: "clarity" as const,
          title: "GPA 格式有誤",
          evidence: "GPA 8/4.0",
          explanation: "分子大於滿分。",
          suggestion: "請確認實際 GPA 和滿分制式。",
        },
      ],
    };

    await optimizeResumeWithAI({
      resume: originalResume,
      diagnosis,
      selectedIssueIds: ["issue-1", "issue-3"],
      additionalDirection: "保留 GPA 原格式，優先優化專案經歷。",
    });

    const prompt = mocks.runAiObjectTask.mock.calls.at(-1)?.[0].prompt as string;
    expect(prompt).toContain("缺少結果證據");
    expect(prompt).not.toContain("摘要較短");
    expect(prompt).not.toContain("GPA 8/4.0");
    expect(prompt).not.toContain("使用者選擇的優化方向");
    expect(prompt).toContain("保留 GPA 原格式，優先優化專案經歷。");
    expect(prompt).toContain("不得覆蓋上述事實邊界");
  });

  it("analyzes the resume without requesting a score", async () => {
    mocks.getEffectiveAiRuntimeSettings.mockResolvedValue({ enabled: true });
    mocks.runAiObjectTask.mockResolvedValue({
      source: "ai",
      message: "履歷診斷完成",
      data: { summary: "專案經歷較完整。", strengths: ["專案目標明確"], issues: [] },
    });

    await analyzeResumeWithAI({ resume: originalResume, locale: "zh-TW" });

    expect(mocks.runAiObjectTask).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: expect.anything(),
        taskLabel: "履歷診斷",
        prompt: expect.stringMatching(/不輸出總分[\s\S]+evidence 為空且必須由使用者提供時才使用 user-input[\s\S]+不得診斷 profile\.summary 缺失[\s\S]+當前日期為 \d{4}-\d{2}-\d{2}[\s\S]+聯絡方式會在分析前因隱私保護被主動移除/),
      }),
    );

    await analyzeResumeWithAI({ resume: originalResume, locale: "en" });
    expect(mocks.runAiObjectTask.mock.calls.at(-1)?.[0].prompt).toMatch(
      /The current date is \d{4}-\d{2}-\d{2}[\s\S]+contact details are intentionally removed before analysis for privacy/,
    );
  });

  it("lets AI rewrite custom section content while preserving custom titles", async () => {
    const aiResume: ResumeContent = {
      ...originalResume,
      customSections: [{ title: "主要優勢與技能認證", content: "具備 AIGC 全鏈路創作與落地經驗。" }],
    };
    mocks.getEffectiveAiRuntimeSettings.mockResolvedValue({ enabled: true });
    mocks.runAiObjectTask.mockResolvedValue({
      source: "ai",
      message: "履歷優化完成",
      data: aiResume,
    });

    const result = await tailorResumeWithAI({
      resume: originalResume,
      jd: "需要 AIGC 產品經驗",
      job: { id: "job-1", company: "字節跳動", title: "AI 產品實習生" },
      analysis: {
        company: "字節跳動",
        title: "AI 產品實習生",
        deadline: null,
        requirements: ["AIGC"],
        keywords: ["AIGC"],
        bonusPoints: [],
        risks: [],
        suggestions: [],
      },
    });

    expect(result.data.customSections).toEqual([
      { title: "主要優勢與技能認證", content: "具備 AIGC 全鏈路創作與落地經驗。" },
    ]);
    expect(mocks.runAiObjectTask).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("主要優勢與技能認證"),
      }),
    );
  });

  it("returns AI-provided optimization metadata", async () => {
    const aiResume: ResumeContent = {
      ...originalResume,
      profile: { ...originalResume.profile, summary: "突出 AI 產品規劃與專案落地能力。" },
    };
    mocks.getEffectiveAiRuntimeSettings.mockResolvedValue({ enabled: true });
    mocks.runAiObjectTask.mockResolvedValue({
      source: "ai",
      message: "履歷比對優化完成",
      data: {
        resume: aiResume,
        meta: {
          company: "聯發科",
          title: "產品經理實習生",
          keywords: ["AI 產品", "使用者研究"],
          summary: "已圍繞聯發科產品經理實習生職缺強化 AI 產品規劃和使用者研究證據。",
          changes: ["自我評價", "專案經歷"],
          versionName: "JD比對優化-陳同學-聯發科產品經理實習生",
        },
      },
    });

    const result = await tailorResumeWithAI({
      resume: originalResume,
      jd: "聯發科 - 產品經理實習生\n需要 AI 產品和使用者研究經驗",
      job: { id: "job-1", company: "目標公司", title: "目標職缺" },
      analysis: {
        company: "待填寫公司",
        title: "待分析職缺",
        deadline: null,
        requirements: ["AI 產品"],
        keywords: [],
        bonusPoints: [],
        risks: [],
        suggestions: [],
      },
    });

    expect(result.meta).toMatchObject({
      company: "聯發科",
      title: "產品經理實習生",
      keywords: ["AI 產品", "使用者研究"],
      versionName: "JD比對優化-陳同學-聯發科產品經理實習生",
    });
  });
});
