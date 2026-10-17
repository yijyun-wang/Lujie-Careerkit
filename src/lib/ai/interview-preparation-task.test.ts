import { describe, expect, it } from "vitest";

import { buildInterviewPreparationPrompt } from "./interview-preparation-task";
import { createInterviewPreparationInputSchema, normalizeInterviewPreparation } from "../interview-preparation";

describe("interview preparation AI task", () => {
  it("accepts any non-empty JD and keeps resume ownership metadata", () => {
    const input = {
      jobId: "",
      resumeVersionId: null,
      jd: "1",
      resumeName: "主履歷",
      resume: { basics: { name: "陳同學" } },
      focus: "comprehensive" as const,
      locale: "zh-TW" as const,
    };

    expect(createInterviewPreparationInputSchema.parse(input)).toEqual(input);
    expect(() => createInterviewPreparationInputSchema.parse({ ...input, jd: "" })).toThrow();
  });

  it("builds a cross-industry, evidence-first prompt without private contact details", () => {
    const prompt = buildInterviewPreparationPrompt({
      jd: "美團｜後端開發實習生\n負責 Java 服務端開發、介面設計、資料庫優化和系統穩定性",
      resumeName: "後端開發履歷",
      focus: "comprehensive",
      locale: "zh-TW",
      resume: {
        basics: {
          name: "陳同學",
          email: "private@example.com",
          phone: "13800000000",
          city: "上海",
          links: ["https://example.com/private"],
        },
        profile: { title: "後端開發", summary: "關注服務端工程" },
        projects: [{ name: "校園交易平台", role: "後端負責人", highlights: ["完成介面與資料庫設計"] }],
      },
    });

    expect(prompt).toContain("軟體工程");
    expect(prompt).toContain("完整職缺名稱");
    expect(prompt).toContain("括號內限定詞");
    expect(prompt).toContain("not-shown");
    expect(prompt).toContain("capabilityProfile");
    expect(prompt).toContain("履歷證據強弱");
    expect(prompt).toContain("校園交易平台");
    expect(prompt).toContain("不能自動判斷使用者不會");
    expect(prompt).not.toContain("private@example.com");
    expect(prompt).not.toContain("13800000000");
    expect(prompt).not.toContain("example.com/private");
  });

  it("adds a capability profile when opening a legacy saved guide", () => {
    const legacy = {
      meta: { company: "美團", title: "後端開發", roleFamily: "軟體工程", roleSummary: "負責服務端系統開發", assumptions: [] },
      evidenceMatrix: Array.from({ length: 5 }, (_, index) => ({
        requirement: `職缺條件 ${index + 1}`,
        resumeEvidence: [],
        state: index === 0 ? "direct" : "not-shown",
        assessment: "根據當前履歷整理",
        action: "準備對應案例",
      })),
      knowledgeTopics: Array.from({ length: 3 }, (_, index) => ({
        topic: `核心知識 ${index + 1}`,
        priority: "must",
        whyRelevant: "與職缺相關",
        explanation: "知識講解",
        currentEvidence: "當前證據",
        targetLevel: "準備目標",
        selfCheckQuestions: ["問題一", "問題二"],
      })),
      deepDives: Array.from({ length: 2 }, (_, index) => ({
        resumeItem: `專案 ${index + 1}`,
        whyRelevant: "與職缺相關",
        personalContributionFocus: "個人貢獻",
        likelyFollowUps: ["追問一", "追問二"],
        factsToConfirm: [],
      })),
      targetedQuestions: Array.from({ length: 6 }, (_, index) => ({
        question: `面試問題 ${index + 1}`,
        category: "專業能力",
        preparationDirection: "準備真實案例",
        priority: "must",
      })),
      preparationPlan: { mustPrepare: ["任務一", "任務二"], shouldPrepare: [], optional: [] },
      selfIntroduction: "我會結合真實經歷介紹自己的職缺比對能力與專案貢獻。",
      reverseQuestions: ["問題一", "問題二", "問題三"],
    };

    expect(normalizeInterviewPreparation(legacy).capabilityProfile.dimensions).toHaveLength(5);
  });

  it("does not force fabricated experience deep dives for a sparse resume", () => {
    const sparseGuide = {
      meta: { company: "目標公司", title: "目標職缺", roleFamily: "通用職缺", roleSummary: "根據現有材料準備", assumptions: [] },
      capabilityProfile: {
        overview: "根據 JD 整理職缺能力要求",
        dimensions: Array.from({ length: 5 }, (_, index) => ({
          label: `能力${index + 1}`,
          requirementLevel: "important" as const,
          evidenceLevel: "unknown" as const,
          evidenceSummary: "履歷暫未體現",
          nextStep: "結合真實經歷確認",
        })),
      },
      evidenceMatrix: Array.from({ length: 3 }, (_, index) => ({
        requirement: `職缺條件${index + 1}`,
        resumeEvidence: [],
        state: "not-shown" as const,
        assessment: "當前履歷未提供相關證據",
        action: "面試前確認真實經歷",
      })),
      knowledgeTopics: Array.from({ length: 3 }, (_, index) => ({
        topic: `核心知識${index + 1}`,
        priority: "must" as const,
        whyRelevant: "與職缺條件相關",
        explanation: "根據職缺條件學習",
        currentEvidence: "當前履歷未體現",
        targetLevel: "能夠解釋基本概念",
        selfCheckQuestions: ["問題一", "問題二"],
      })),
      deepDives: [],
      targetedQuestions: Array.from({ length: 6 }, (_, index) => ({
        question: `面試問題${index + 1}`,
        category: "職缺能力",
        preparationDirection: "只使用真實資訊回答",
        priority: "must" as const,
      })),
      preparationPlan: { mustPrepare: ["確認經歷", "複習基礎"], shouldPrepare: [], optional: [] },
      selfIntroduction: "請根據自己的真實教育與實踐經歷補充一段面試自我介紹。",
      reverseQuestions: ["團隊目標是什麼？", "職缺如何協作？", "新人如何成長？"],
    };

    expect(() => normalizeInterviewPreparation(sparseGuide)).not.toThrow();
  });
});
