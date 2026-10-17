import { describe, expect, it } from "vitest";

import {
  buildInterviewQuestionFallback,
  buildInterviewQuestionPrompt,
  buildInterviewReportPrompt,
} from "./interview-tasks";

describe("interview AI tasks", () => {
  it("builds a balanced eight-question comprehensive fallback", () => {
    const questions = buildInterviewQuestionFallback({
      mode: "comprehensive",
      company: "騰訊",
      title: "產品營運實習生",
      jd: "負責使用者研究、活動回顧和 SQL 分析",
      resume: { projects: [{ name: "校園自習室預約體驗優化" }] },
    });

    expect(questions).toHaveLength(8);
    expect(new Set(questions.map((question) => question.category))).toEqual(
      new Set([
        "self-introduction",
        "motivation",
        "project",
        "professional",
        "behavioral",
        "failure",
        "reverse-question",
      ]),
    );
  });

  it("includes the selected resume and JD in the question prompt", () => {
    const prompt = buildInterviewQuestionPrompt({
      mode: "project",
      company: "美團",
      title: "後端開發實習生",
      jd: "美團｜後端開發實習生\n要求 Java、SQL 和介面設計",
      resume: { projects: [{ name: "校園二手交易平台" }] },
    });

    expect(prompt).toContain("美團");
    expect(prompt).toContain("Java、SQL 和介面設計");
    expect(prompt).toContain("校園二手交易平台");
    expect(prompt).toContain("6 道");
    expect(prompt).toContain("完整職缺名稱");
    expect(prompt).toContain("括號內限定詞");
  });

  it("removes contact details and editor settings from interview prompts", () => {
    const prompt = buildInterviewQuestionPrompt({
      mode: "project",
      company: "美團",
      title: "後端開發實習生",
      jd: "要求 Java、SQL 和介面設計",
      resume: {
        editor: { template: "campus" },
        basics: {
          name: "陳同學",
          email: "private@example.com",
          phone: "13800000000",
          city: "上海",
          links: ["https://example.com/private"],
        },
        profile: { title: "後端開發", summary: "關注服務端開發" },
        projects: [{ name: "校園二手交易平台", role: "負責人", highlights: ["完成介面設計"] }],
      },
    });

    expect(prompt).toContain("校園二手交易平台");
    expect(prompt).toContain("上海");
    expect(prompt).not.toContain("private@example.com");
    expect(prompt).not.toContain("13800000000");
    expect(prompt).not.toContain("example.com/private");
    expect(prompt).not.toContain("template");
  });

  it("builds the final report prompt from answered questions and marks skipped ones", () => {
    const prompt = buildInterviewReportPrompt({
      context: {
        company: "騰訊",
        title: "產品營運實習生",
        jd: "負責使用者研究與資料分析",
        resumeName: "騰訊產品營運客製版",
        resume: { basics: { name: "陳同學" } },
      },
      questions: [
        { id: "q-1", category: "project", prompt: "介紹專案貢獻", focus: "個人貢獻", order: 0 },
        { id: "q-2", category: "behavioral", prompt: "介紹一次衝突", focus: "STAR", order: 1 },
      ],
      answers: {
        "q-1": {
          questionId: "q-1",
          content: "我負責使用者訪談和資料分析。",
          skipped: false,
          updatedAt: "2026-06-22T10:00:00.000Z",
        },
        "q-2": {
          questionId: "q-2",
          content: "",
          skipped: true,
          updatedAt: "2026-06-22T10:01:00.000Z",
        },
      },
    });

    expect(prompt).toContain("我負責使用者訪談和資料分析");
    expect(prompt).toContain("未回答 / 跳過");
    expect(prompt).toContain("事實證據");
  });
});
