import { describe, expect, it } from "vitest";

import {
  createInterviewRetryInput,
  createInterviewSessionInputSchema,
  interviewReportSchema,
  interviewQuestionNavTitle,
  mergeInterviewAnswer,
  normalizeInterviewAnswers,
  normalizeInterviewQuestions,
  parseInterviewQuestionPack,
  questionCountForMode,
  saveInterviewProgressInputSchema,
  screenForInterviewSession,
} from "./interview";

describe("interview domain", () => {
  it("uses eight questions for comprehensive practice and six for focused modes", () => {
    expect(questionCountForMode("comprehensive")).toBe(8);
    expect(questionCountForMode("project")).toBe(6);
    expect(questionCountForMode("behavioral")).toBe(6);
    expect(questionCountForMode("hr")).toBe(6);
  });

  it("requires the generated question pack to match the selected mode count", () => {
    const questions = Array.from({ length: 8 }, (_, index) => ({
      id: `q-${index + 1}`,
      category: index === 0 ? "self-introduction" : "project",
      prompt: `問題 ${index + 1}`,
      focus: "驗證職缺比對與真實經歷",
      order: index,
    }));

    expect(parseInterviewQuestionPack("comprehensive", { questions })).toHaveLength(8);
    expect(() => parseInterviewQuestionPack("project", { questions })).toThrow("需要生成 6 道題");
  });

  it("rejects duplicate question ids and discontinuous ordering", () => {
    const questions = Array.from({ length: 8 }, (_, index) => ({
      id: index === 7 ? "q-1" : `q-${index + 1}`,
      category: index === 0 ? "self-introduction" : "project",
      prompt: `問題 ${index + 1}`,
      focus: "驗證職缺比對與真實經歷",
      order: index === 6 ? 9 : index,
    }));

    expect(() => parseInterviewQuestionPack("comprehensive", { questions })).toThrow("題目編號或順序無效");
  });

  it("requires focused modes to contain enough questions from their selected category", () => {
    const pack = (categories: Array<"self-introduction" | "motivation" | "project" | "professional" | "behavioral" | "failure" | "hr">) => ({
      questions: categories.map((category, index) => ({
        id: `q-${index + 1}`,
        category,
        prompt: `專項問題 ${index + 1}`,
        focus: "驗證專項面試能力與事實證據",
        order: index,
      })),
    });

    expect(() => parseInterviewQuestionPack("project", pack([
      "project", "project", "project", "professional", "self-introduction", "failure",
    ]))).toThrow("專案深挖至少需要 4 道專案題");
    expect(() => parseInterviewQuestionPack("behavioral", pack([
      "behavioral", "behavioral", "motivation", "professional", "self-introduction", "failure",
    ]))).toThrow("行為面試至少需要 3 道行為題");
    expect(() => parseInterviewQuestionPack("hr", pack([
      "hr", "motivation", "behavioral", "professional", "self-introduction", "failure",
    ]))).toThrow("人資面談至少需要 3 道人資或動機題");
  });

  it("merges one answer without dropping answers for other questions", () => {
    const next = mergeInterviewAnswer(
      {
        "q-1": {
          questionId: "q-1",
          content: "舊回答",
          skipped: false,
          updatedAt: "2026-06-22T10:00:00.000Z",
        },
      },
      {
        questionId: "q-2",
        content: "新回答",
        skipped: false,
        updatedAt: "2026-06-22T10:01:00.000Z",
      },
    );

    expect(Object.keys(next)).toEqual(["q-1", "q-2"]);
    expect(next["q-2"]?.content).toBe("新回答");
  });

  it("normalizes legacy string questions into stable question objects", () => {
    const questions = normalizeInterviewQuestions(["請介紹一下自己", "為什麼選擇這個職缺？"]);
    expect(questions).toEqual([
      {
        id: "legacy-1",
        category: "general",
        prompt: "請介紹一下自己",
        focus: "歷史面試題",
        order: 0,
      },
      {
        id: "legacy-2",
        category: "general",
        prompt: "為什麼選擇這個職缺？",
        focus: "歷史面試題",
        order: 1,
      },
    ]);
    expect(normalizeInterviewAnswers({ "請介紹一下自己": "我是產品方向的學生。" }, questions)).toMatchObject({
      "legacy-1": {
        questionId: "legacy-1",
        content: "我是產品方向的學生。",
        skipped: false,
      },
    });
  });

  it("accepts a complete report and rejects empty feedback arrays", () => {
    const report = {
      overallScore: 76,
      dimensions: { jobFit: 82, structure: 78, evidence: 65, star: 73 },
      strengths: ["職缺動機清晰"],
      improvements: ["補充個人動作和指標口徑"],
      questionReviews: [
        {
          questionId: "q-1",
          diagnosis: "背景和結果清楚，但個人貢獻不足。",
          suggestion: "補充關鍵判斷與具體動作。",
          improvedAnswer: "我負責使用者訪談與方案驗證，並根據資料調整流程。",
        },
      ],
      nextActions: ["重新練習專案深挖"],
    };

    expect(interviewReportSchema.parse(report)).toEqual(report);
    expect(() => interviewReportSchema.parse({ ...report, strengths: [] })).toThrow();
  });

  it("validates create and progress API payloads", () => {
    const createInput = {
      jobId: "job-1",
      resumeVersionId: null,
      mode: "comprehensive",
      context: {
        company: "騰訊",
        title: "產品營運實習生",
        jd: "負責使用者研究與資料分析",
        resumeName: "主履歷",
        resume: { basics: { name: "陳同學" } },
      },
    };
    expect(createInterviewSessionInputSchema.parse(createInput)).toEqual(createInput);
    expect(createInterviewSessionInputSchema.parse({
      ...createInput,
      context: { ...createInput.context, jd: "1" },
    }).context.jd).toBe("1");
    expect(createInterviewSessionInputSchema.parse({ ...createInput, jobId: undefined }).jobId).toBe("");
    expect(() => createInterviewSessionInputSchema.parse({ ...createInput, context: { ...createInput.context, jd: "" } })).toThrow();

    const progress = {
      currentQuestionIndex: 1,
      answer: {
        questionId: "q-1",
        content: "回答",
        skipped: false,
        updatedAt: "2026-06-22T10:00:00.000Z",
      },
    };
    expect(saveInterviewProgressInputSchema.parse(progress)).toEqual(progress);
    expect(saveInterviewProgressInputSchema.parse({ answer: progress.answer })).toEqual({ answer: progress.answer });
  });

  it("builds a new practice request from the completed session snapshot", () => {
    const input = createInterviewRetryInput({
      jobId: "job-1",
      resumeVersionId: "resume-1",
      mode: "project",
      context: {
        company: "美團",
        title: "後端開發實習生",
        jd: "負責 Java 服務開發與 SQL 優化",
        resumeName: "後端職缺客製版",
        resume: { basics: { name: "陳同學" }, projects: [{ name: "校園交易平台" }] },
      },
    });

    expect(input).toEqual({
      jobId: "job-1",
      resumeVersionId: "resume-1",
      mode: "project",
      context: expect.objectContaining({ company: "美團", title: "後端開發實習生" }),
    });
    expect(input.context).not.toBeUndefined();
  });

  it("opens completed sessions on the report screen", () => {
    expect(screenForInterviewSession({ status: "COMPLETED", feedback: { overallScore: 80 } })).toBe("report");
    expect(screenForInterviewSession({ status: "IN_PROGRESS", feedback: null })).toBe("session");
  });

  it("builds concise question navigation titles", () => {
    const prompts = [
      ["請用 1 分鐘介紹自己，並說明為什麼適合這個職缺。", "自我介紹"],
      ["你在專案裡承擔了什麼角色？", "專案職責"],
      ["這份 JD 裡提到的關鍵字，你最有把握的是哪一個？", "核心能力"],
      ["講一個你遇到過的困難。", "困難處理"],
      ["如果面試官讓你反問，你會問什麼？", "面試反問"],
      ["你如何看待端側 AI 和多模態模型的應用前景？", "技術趨勢"],
      [
        "你提到自己熟練使用AI工具並關注前沿技術動態，請以最近的一個大型語言模型或AI資料相關進展為例，說明它可能帶來什麼影響。",
        "技術趨勢",
      ],
    ] as const;
    for (const [prompt, expected] of prompts) {
      const title = interviewQuestionNavTitle({ prompt, category: "general" });
      expect(title).toBe(expected);
      expect(title.length).toBeLessThanOrEqual(10);
    }
  });
});
