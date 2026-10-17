import { describe, expect, it, vi } from "vitest";

import type { InterviewAnswer, InterviewQuestion, InterviewReport } from "./interview";
import { createInterviewService, type InterviewSessionRecord } from "./interview-service";

const questions: InterviewQuestion[] = Array.from({ length: 8 }, (_, index) => ({
  id: `q-${index + 1}`,
  category: index === 0 ? "self-introduction" : "project",
  prompt: `問題 ${index + 1}`,
  focus: "驗證職缺比對與真實經歷",
  order: index,
}));

const report: InterviewReport = {
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

describe("interview service", () => {
  it("creates a persisted session only after generating a valid question pack", async () => {
    const created: InterviewSessionRecord[] = [];
    const service = createInterviewService({
      generateQuestions: async () => questions,
      generateReport: async () => report,
      repository: createRepository(created),
    });

    const session = await service.createSession({
      jobId: "job-1",
      resumeVersionId: "resume-1",
      mode: "comprehensive",
      context: {
        company: "騰訊",
        title: "產品營運實習生",
        jd: "負責使用者研究與資料分析",
        resumeName: "騰訊產品營運客製版",
        resume: { basics: { name: "陳同學" } },
      },
    });

    expect(session.questions).toHaveLength(8);
    expect(created).toHaveLength(1);
    expect(created[0]?.status).toBe("IN_PROGRESS");
  });

  it("uses the company and full role name identified by AI", async () => {
    const created: InterviewSessionRecord[] = [];
    const service = createInterviewService({
      generateQuestions: async () => ({
        company: "字節跳動",
        title: "AI產品實習生（AI資料與安全）",
        questions,
      }),
      generateReport: async () => report,
      repository: createRepository(created),
    });

    const session = await service.createSession({
      jobId: "",
      resumeVersionId: null,
      mode: "comprehensive",
      context: {
        company: "目標公司",
        title: "目標職缺",
        jd: "字節跳動 AI產品實習生（AI資料與安全）完整 JD",
        resumeName: "姜禾的履歷",
        resume: { basics: { name: "姜禾" } },
      },
    });

    expect(session.context.company).toBe("字節跳動");
    expect(session.context.title).toBe("AI產品實習生（AI資料與安全）");
  });

  it("saves one answer while preserving existing answers", async () => {
    const sessions = [baseSession()];
    sessions[0].answers["q-1"] = {
      questionId: "q-1",
      content: "第一個回答",
      skipped: false,
      updatedAt: "2026-06-22T10:00:00.000Z",
    };
    const service = createInterviewService({
      generateQuestions: async () => questions,
      generateReport: async () => report,
      repository: createRepository(sessions),
    });

    const session = await service.saveProgress("session-1", {
      answer: {
        questionId: "q-2",
        content: "第二個回答",
        skipped: false,
        updatedAt: "2026-06-22T10:01:00.000Z",
      },
      currentQuestionIndex: 2,
    });

    expect(Object.keys(session.answers)).toEqual(["q-1", "q-2"]);
    expect(session.currentQuestionIndex).toBe(2);
  });

  it("autosaves an answer without moving the current question", async () => {
    const sessions = [baseSession()];
    sessions[0].currentQuestionIndex = 4;
    const service = createInterviewService({
      generateQuestions: async () => questions,
      generateReport: async () => report,
      repository: createRepository(sessions),
    });

    const session = await service.saveProgress("session-1", {
      answer: {
        questionId: "q-5",
        content: "自動儲存的回答",
        skipped: false,
        updatedAt: "2026-06-22T10:01:00.000Z",
      },
    });

    expect(session.answers["q-5"]?.content).toBe("自動儲存的回答");
    expect(session.currentQuestionIndex).toBe(4);
  });

  it("keeps the session in progress when there are no valid answers", async () => {
    const sessions = [baseSession()];
    const service = createInterviewService({
      generateQuestions: async () => questions,
      generateReport: async () => report,
      repository: createRepository(sessions),
    });

    await expect(service.finishSession("session-1")).rejects.toThrow("至少完成一道題");
    expect(sessions[0]?.status).toBe("IN_PROGRESS");
  });

  it("stores the report and completes the session after successful analysis", async () => {
    const sessions = [baseSession()];
    sessions[0].answers["q-1"] = {
      questionId: "q-1",
      content: "我負責使用者訪談和資料分析。",
      skipped: false,
      updatedAt: "2026-06-22T10:00:00.000Z",
    };
    const service = createInterviewService({
      generateQuestions: async () => questions,
      generateReport: async () => report,
      repository: createRepository(sessions),
    });

    const session = await service.finishSession("session-1");

    expect(session.status).toBe("COMPLETED");
    expect(session.feedback).toEqual(report);
    expect(session.completedAt).toBeTruthy();
  });

  it("regenerates and replaces an existing report when explicitly requested", async () => {
    const sessions = [baseSession()];
    sessions[0].status = "COMPLETED";
    sessions[0].feedback = { ...report, overallScore: 60 };
    sessions[0].answers["q-1"] = {
      questionId: "q-1",
      content: "修改後的回答",
      skipped: false,
      updatedAt: "2026-06-22T10:00:00.000Z",
    };
    const generateReport = vi.fn(async () => ({ ...report, overallScore: 88 }));
    const service = createInterviewService({
      generateQuestions: async () => questions,
      generateReport,
      repository: createRepository(sessions),
    });

    const session = await service.finishSession("session-1", true);

    expect(generateReport).toHaveBeenCalledOnce();
    expect(session.feedback?.overallScore).toBe(88);
  });
});

function baseSession(): InterviewSessionRecord {
  return {
    id: "session-1",
    jobId: "job-1",
    resumeVersionId: "resume-1",
    mode: "comprehensive",
    status: "IN_PROGRESS",
    context: {
      company: "騰訊",
      title: "產品營運實習生",
      jd: "負責使用者研究與資料分析",
      resumeName: "騰訊產品營運客製版",
      resume: { basics: { name: "陳同學" } },
    },
    questions,
    answers: {},
    feedback: null,
    currentQuestionIndex: 0,
    createdAt: "2026-06-22T10:00:00.000Z",
    updatedAt: "2026-06-22T10:00:00.000Z",
    completedAt: null,
  };
}

function createRepository(sessions: InterviewSessionRecord[]) {
  return {
    async create(input: Omit<InterviewSessionRecord, "id" | "createdAt" | "updatedAt">) {
      const session: InterviewSessionRecord = {
        ...input,
        id: `session-${sessions.length + 1}`,
        createdAt: "2026-06-22T10:00:00.000Z",
        updatedAt: "2026-06-22T10:00:00.000Z",
      };
      sessions.push(session);
      return session;
    },
    async findById(id: string) {
      return sessions.find((session) => session.id === id) ?? null;
    },
    async saveProgress(id: string, input: { answer?: InterviewAnswer; currentQuestionIndex?: number }) {
      const session = sessions.find((item) => item.id === id);
      if (!session) throw new Error("not found");
      if (input.answer) session.answers[input.answer.questionId] = input.answer;
      if (input.currentQuestionIndex !== undefined) session.currentQuestionIndex = input.currentQuestionIndex;
      session.updatedAt = "2026-06-22T10:01:00.000Z";
      return session;
    },
    async complete(id: string, feedback: InterviewReport) {
      const session = sessions.find((item) => item.id === id);
      if (!session) throw new Error("not found");
      Object.assign(session, {
        feedback,
        status: "COMPLETED" as const,
        completedAt: "2026-06-22T10:02:00.000Z",
        updatedAt: "2026-06-22T10:02:00.000Z",
      });
      return session;
    },
    async deleteSession(id: string) {
      const index = sessions.findIndex((session) => session.id === id);
      if (index >= 0) sessions.splice(index, 1);
    },
    async clearSessions() {
      const count = sessions.length;
      sessions.splice(0, sessions.length);
      return count;
    },
  };
}
