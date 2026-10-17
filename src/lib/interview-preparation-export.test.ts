import { describe, expect, it, vi } from "vitest";

import {
  buildInterviewPreparationFileName,
  buildInterviewPreparationPrintHtml,
  exportInterviewPreparationDocx,
  printInterviewPreparation,
  type InterviewPreparationExportLabels,
} from "@/lib/interview-preparation-export";
import type { InterviewPreparation } from "@/lib/interview-preparation";

const preparation: InterviewPreparation = {
  meta: {
    company: "A/B <公司>",
    title: "AI 工程師",
    roleFamily: "技術",
    roleSummary: "負責 <Agent> 開發",
    assumptions: ["職缺資訊待確認"],
  },
  capabilityProfile: {
    overview: "能力概覽",
    dimensions: [{
      label: "工程能力",
      requirementLevel: "core",
      evidenceLevel: "partial",
      evidenceSummary: "有專案證據",
      nextStep: "準備專案細節",
    }],
  },
  evidenceMatrix: [{
    requirement: "Agent 開發",
    resumeEvidence: ["專案 A"],
    state: "direct",
    assessment: "已有證據",
    action: "準備回顧",
  }],
  knowledgeTopics: [{
    topic: "RAG",
    priority: "must",
    whyRelevant: "職缺條件",
    explanation: "檢索增強生成",
    currentEvidence: "專案 A",
    targetLevel: "能夠說明取捨",
    selfCheckQuestions: ["為何使用 RAG？", "如何評估？"],
  }],
  deepDives: [{
    resumeItem: "專案 A",
    whyRelevant: "對應職缺條件",
    personalContributionFocus: "說明個人貢獻",
    likelyFollowUps: ["遇到什麼問題？", "如何解決？"],
    factsToConfirm: ["指標口徑"],
  }],
  targetedQuestions: [{
    question: "請介紹專案 A",
    category: "專案",
    preparationDirection: "按背景、行動、結果回答",
    priority: "must",
  }],
  preparationPlan: {
    mustPrepare: ["專案 A"],
    shouldPrepare: ["RAG"],
    optional: [],
  },
  selfIntroduction: "這是一段足夠長的面試自我介紹內容，用於匯出測試。",
  reverseQuestions: ["團隊當前的重點是什麼？", "職缺如何衡量成功？", "後續流程是什麼？"],
};

const labels: InterviewPreparationExportLabels = {
  documentTitle: "面試準備資料",
  basedOn: "基於目標 JD 與測試履歷生成",
  roleFamily: "職缺方向",
  assumptions: "資料假設",
  sections: {
    overview: "資料概覽",
    capability: "能力輪廓",
    evidence: "證據與差距",
    knowledge: "核心知識",
    deepDives: "經歷深挖",
    questions: "針對性問題",
    plan: "準備計畫",
  },
  requirementLevel: "要求級別",
  evidenceLevel: "證據水平",
  nextStep: "下一步",
  resumeEvidence: "履歷依據",
  action: "準備動作",
  explanation: "知識講解",
  currentEvidence: "現有基礎",
  targetLevel: "面試前目標",
  selfCheck: "自測問題",
  contribution: "個人貢獻",
  followUps: "可能追問",
  factsToConfirm: "需要確認",
  category: "問題類別",
  preparationDirection: "準備方向",
  introduction: "客製自我介紹",
  reverseQuestions: "反問建議",
  stateLabels: { direct: "直接證據", transferable: "可遷移經歷", "not-shown": "履歷未體現", gap: "當前缺口", confirm: "待確認" },
  priorityLabels: { must: "必須準備", should: "建議準備", optional: "有餘力再準備" },
  requirementLabels: { core: "核心要求", important: "重要要求", bonus: "加分項" },
  evidenceLabels: { strong: "證據充分", partial: "部分證據", limited: "證據有限", unknown: "尚未體現" },
};

describe("interview preparation export", () => {
  it("waits for print content to load without opening a popup, then cleans up", () => {
    const oldFrame = { remove: vi.fn() };
    const frameEvents = new Map<string, () => void>();
    const printEvents = new Map<string, () => void>();
    const printWindow = { focus: vi.fn(), print: vi.fn(), addEventListener: (event: string, fn: () => void) => printEvents.set(event, fn) };
    const frame = { style: {}, setAttribute: vi.fn(), remove: vi.fn(), contentWindow: printWindow, srcdoc: "", addEventListener: (event: string, fn: () => void) => frameEvents.set(event, fn) };
    const append = vi.fn(() => {
      expect(frame.srcdoc).toContain("負責 &lt;Agent&gt; 開發");
      expect(frameEvents.has("load")).toBe(true);
    });
    vi.stubGlobal("document", { getElementById: () => oldFrame, createElement: () => frame, body: { appendChild: append } });
    try {
      printInterviewPreparation(preparation, labels);
      expect(oldFrame.remove).toHaveBeenCalledOnce();
      expect(append).toHaveBeenCalledOnce();
      expect(printWindow.print).not.toHaveBeenCalled();
      frameEvents.get("load")!();
      expect(printWindow.print).toHaveBeenCalledOnce();
      expect(frame.remove).not.toHaveBeenCalled();
      printEvents.get("afterprint")!();
      expect(frame.remove).toHaveBeenCalledOnce();
    } finally { vi.unstubAllGlobals(); }
  });

  it("builds a filesystem-safe export name", () => {
    expect(buildInterviewPreparationFileName(preparation)).toBe("A-B-公司-AI 工程師-面試準備資料");
  });

  it("includes every section and escapes user-controlled HTML", () => {
    const html = buildInterviewPreparationPrintHtml(preparation, labels);

    expect(html).toContain("資料概覽");
    expect(html).toContain("反問建議");
    expect(html).toContain("負責 &lt;Agent&gt; 開發");
    expect(html).not.toContain("負責 <Agent> 開發");
  });

  it("generates a non-empty editable Word document", async () => {
    const click = vi.fn();
    vi.stubGlobal("document", {
      createElement: () => ({ href: "", download: "", click }),
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:interview-preparation",
      revokeObjectURL: vi.fn(),
    });

    const blob = await exportInterviewPreparationDocx(preparation, labels);

    expect(blob.size).toBeGreaterThan(1_000);
    expect(click).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
