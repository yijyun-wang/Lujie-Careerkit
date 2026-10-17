import { z } from "zod";

export type InterviewMode = "comprehensive" | "project" | "behavioral" | "hr";

export const interviewModeSchema = z.enum(["comprehensive", "project", "behavioral", "hr"]);

export const interviewQuestionSchema = z.object({
  id: z.string().trim().min(1),
  category: z.enum([
    "general",
    "self-introduction",
    "motivation",
    "project",
    "professional",
    "behavioral",
    "failure",
    "reverse-question",
    "hr",
  ]),
  prompt: z.string().trim().min(2),
  focus: z.string().trim().min(2),
  order: z.number().int().min(0),
});

export const interviewQuestionPackSchema = z.object({
  company: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(100),
  questions: z.array(interviewQuestionSchema),
});

export const interviewAnswerSchema = z.object({
  questionId: z.string().trim().min(1),
  content: z.string(),
  skipped: z.boolean(),
  updatedAt: z.string().datetime(),
});

export const interviewContextSchema = z.object({
  company: z.string().trim().min(1),
  title: z.string().trim().min(1),
  jd: z.string().trim().min(1),
  resumeName: z.string().trim().min(1),
  resume: z.unknown(),
});

export const createInterviewSessionInputSchema = z.object({
  jobId: z.string().trim().optional().default(""),
  resumeVersionId: z.string().trim().min(1).nullable(),
  mode: interviewModeSchema,
  context: interviewContextSchema,
});

export const saveInterviewProgressInputSchema = z.object({
  answer: interviewAnswerSchema.optional(),
  currentQuestionIndex: z.number().int().min(0).optional(),
}).refine((input) => input.answer || input.currentQuestionIndex !== undefined, {
  message: "回答或題目位置至少需要提供一項。",
});

export const interviewReportSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  dimensions: z.object({
    jobFit: z.number().int().min(0).max(100),
    structure: z.number().int().min(0).max(100),
    evidence: z.number().int().min(0).max(100),
    star: z.number().int().min(0).max(100),
  }),
  strengths: z.array(z.string().trim().min(2)).min(1),
  improvements: z.array(z.string().trim().min(2)).min(1),
  questionReviews: z
    .array(
      z.object({
        questionId: z.string().trim().min(1),
        diagnosis: z.string().trim().min(2),
        suggestion: z.string().trim().min(2),
        improvedAnswer: z.string().trim().min(2),
      }),
    )
    .min(1),
  nextActions: z.array(z.string().trim().min(2)).min(1),
});

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewQuestionPack = z.infer<typeof interviewQuestionPackSchema>;
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;
export type InterviewContext = z.infer<typeof interviewContextSchema>;
export type InterviewReport = z.infer<typeof interviewReportSchema>;
export type InterviewAnswers = Record<string, InterviewAnswer>;

export function questionCountForMode(mode: InterviewMode) {
  return mode === "comprehensive" ? 8 : 6;
}

export function parseInterviewQuestionPack(mode: InterviewMode, input: unknown) {
  const { questions } = z.object({ questions: z.array(interviewQuestionSchema) }).parse(input);
  const expectedCount = questionCountForMode(mode);
  if (questions.length !== expectedCount) {
    throw new Error(`${mode === "comprehensive" ? "綜合模擬" : "專項模擬"}需要生成 ${expectedCount} 道題。`);
  }
  const hasInvalidIdentity = questions.some(
    (question, index) => question.id !== `q-${index + 1}` || question.order !== index,
  );
  if (hasInvalidIdentity) throw new Error("題目編號或順序無效，請重新生成。");
  assertModeCategoryCoverage(mode, questions);
  return questions;
}

function assertModeCategoryCoverage(mode: InterviewMode, questions: InterviewQuestion[]) {
  if (mode === "comprehensive") return;
  const count = (category: InterviewQuestion["category"]) =>
    questions.filter((question) => question.category === category).length;

  if (mode === "project" && count("project") < 4) {
    throw new Error("專案深挖至少需要 4 道專案題，請重新生成。");
  }
  if (mode === "behavioral" && count("behavioral") < 3) {
    throw new Error("行為面試至少需要 3 道行為題，請重新生成。");
  }
  if (mode === "hr" && count("hr") + count("motivation") < 3) {
    throw new Error("人資面談至少需要 3 道人資或動機題，請重新生成。");
  }
}

export function createInterviewRetryInput(session: {
  jobId: string | null;
  resumeVersionId: string | null;
  mode: InterviewMode;
  context: InterviewContext;
}) {
  return {
    jobId: session.jobId ?? "",
    resumeVersionId: session.resumeVersionId,
    mode: session.mode,
    context: { ...session.context },
  };
}

export function mergeInterviewAnswer(answers: InterviewAnswers, answer: InterviewAnswer) {
  const parsed = interviewAnswerSchema.parse(answer);
  return { ...answers, [parsed.questionId]: parsed };
}

export function normalizeInterviewQuestions(input: unknown): InterviewQuestion[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item, index) => {
    if (typeof item === "string" && item.trim()) {
      return [
        {
          id: `legacy-${index + 1}`,
          category: "general" as const,
          prompt: item.trim(),
          focus: "歷史面試題",
          order: index,
        },
      ];
    }
    const parsed = interviewQuestionSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function normalizeInterviewAnswers(
  input: unknown,
  questions: InterviewQuestion[],
  fallbackUpdatedAt = "1970-01-01T00:00:00.000Z",
): InterviewAnswers {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const questionByPrompt = new Map(questions.map((question) => [question.prompt, question]));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const answers: InterviewAnswers = {};

  for (const [key, value] of Object.entries(input)) {
    const parsed = interviewAnswerSchema.safeParse(value);
    if (parsed.success) {
      answers[parsed.data.questionId] = parsed.data;
      continue;
    }
    if (typeof value !== "string") continue;
    const question = questionById.get(key) ?? questionByPrompt.get(key);
    if (!question) continue;
    answers[question.id] = {
      questionId: question.id,
      content: value,
      skipped: false,
      updatedAt: fallbackUpdatedAt,
    };
  }

  return answers;
}

export function screenForInterviewSession(session: { status: string; feedback: unknown }) {
  return session.status === "COMPLETED" && session.feedback ? "report" : "session";
}

export function interviewQuestionNavTitle(question: { prompt: string; category: string }) {
  const prompt = question.prompt;
  const rules: Array<[RegExp, string]> = [
    [/介紹自己|自我介紹/, "自我介紹"],
    [/承擔.*角色|負責.*部分|個人貢獻/, "專案職責"],
    [/關鍵字|最有把握|專業能力/, "核心能力"],
    [/困難|壓力|時間限制/, "困難處理"],
    [/反問|還有什麼問題/, "面試反問"],
    [/為什麼選擇|求職動機|職缺動機/, "職缺動機"],
    [/失敗|沒有達到預期/, "失敗回顧"],
    [/意見不一致|協作|團隊合作/, "團隊協作"],
    [/職業規劃|未來.*年/, "職業規劃"],
    [/如何看待|應用前景|發展趨勢|技術動態|前沿技術|大型語言模型|AI資料.*進展|模型效率/i, "技術趨勢"],
  ];
  const matched = rules.find(([pattern]) => pattern.test(prompt));
  if (matched) return matched[1];

  const categoryTitle: Record<string, string> = {
    "self-introduction": "自我介紹",
    motivation: "職缺動機",
    project: "專案深挖",
    professional: "專業能力",
    behavioral: "行為面試",
    failure: "失敗回顧",
    "reverse-question": "面試反問",
    hr: "人資面談",
  };
  if (categoryTitle[question.category]) return categoryTitle[question.category];
  return prompt.replace(/[，。？！：；、“”‘’「」【】\s]/g, "").slice(0, 10) || "面試問題";
}
