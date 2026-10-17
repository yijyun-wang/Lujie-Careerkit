import { describe, expect, it } from "vitest";

import { isAiEditableResumeIssue, normalizeResumeDiagnosis } from "./resume-diagnosis";
import type { ResumeContent } from "../types";

const resume: ResumeContent = {
  basics: { name: "姜禾", email: "", phone: "", city: "", links: [] },
  profile: { title: "", summary: "" },
  education: [{
    school: "北京郵電大學",
    degree: "學士",
    major: "人工智慧",
    start: "2023",
    end: "2027",
    highlights: ["GPA 8/4.0"],
  }],
  experiences: [],
  internships: [],
  projects: [],
  skills: [],
  awards: [],
  selfReview: "熟悉 Python、機器學習基礎和推薦系統實驗流程。",
};

describe("resume diagnosis normalization", () => {
  it("drops a false missing-summary issue when self-review already provides it", () => {
    const diagnosis = normalizeResumeDiagnosis({
      summary: "結構清晰。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "summary",
        location: "profile.summary",
        severity: "medium",
        category: "structure",
        title: "履歷未提供個人總結",
        evidence: "",
        explanation: "缺少 profile summary。",
        suggestion: "增加個人總結。",
      }],
    }, resume);

    expect(diagnosis.issues).toEqual([]);
  });

  it("drops alternate wording that falsely requires a second summary module", () => {
    const diagnosis = normalizeResumeDiagnosis({
      summary: "結構清晰。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "summary",
        location: "開篇",
        severity: "medium",
        category: "structure",
        title: "缺少清晰的開篇個人簡介",
        evidence: "",
        explanation: "建議增加個人簡介。",
        suggestion: "補充開篇總結。",
      }],
    }, resume);

    expect(diagnosis.issues).toEqual([]);
  });

  it("marks an impossible GPA as requiring the candidate's confirmation", () => {
    const diagnosis = normalizeResumeDiagnosis({
      summary: "GPA 寫法需要核實。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "education",
        location: "教育背景",
        severity: "high",
        category: "clarity",
        title: "GPA 格式有誤",
        evidence: "GPA 8/4.0",
        explanation: "分子大於滿分。",
        suggestion: "請確認實際 GPA 和滿分制式。",
      }],
    }, resume);

    expect(diagnosis.issues[0]?.action).toBe("user-confirm");
  });

  it("keeps vague experience bullets AI-editable even if the model overclassifies them", () => {
    const diagnosis = normalizeResumeDiagnosis({
      summary: "實習描述需要加強。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "internships",
        location: "百度實習經歷",
        severity: "medium",
        action: "user-confirm",
        category: "action-result",
        title: "實習描述偏重職責，個人貢獻不突出",
        evidence: "參與真實業務專案，負責資料整理、功能驗證和日報回顧",
        explanation: "沒有明確個人承擔的技術角色、工具或方法。",
        suggestion: "補充具體技術細節和實際用途；沒有更多資訊時先用現有事實明確行動。",
      }],
    }, resume);

    expect(diagnosis.issues[0]?.action).toBe("ai-edit");
  });

  it("keeps issues with quoted resume evidence AI-editable instead of requesting new facts", () => {
    const diagnosis = normalizeResumeDiagnosis({
      summary: "專案表達可以加強。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "projects",
        location: "課程推薦系統",
        severity: "medium",
        action: "user-input",
        category: "action-result",
        title: "缺少具體結果",
        evidence: "完成需求分析和方案設計",
        explanation: "現有文字沒有突出個人行動。",
        suggestion: "使用現有資訊明確個人貢獻。",
      }],
    }, resume);

    expect(diagnosis.issues[0]?.action).toBe("ai-edit");
    expect(isAiEditableResumeIssue(diagnosis.issues[0]!)).toBe(true);
  });

  it("routes absent factual content to the editor instead of automatic rewriting", () => {
    const diagnosis = normalizeResumeDiagnosis({
      summary: "需要補充事實。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "skills",
        location: "技能模組",
        severity: "medium",
        category: "evidence",
        title: "技能模組未填寫",
        evidence: "",
        explanation: "缺少真實技能資訊。",
        suggestion: "請補充實際掌握的技能。",
      }],
    }, resume);

    expect(diagnosis.issues[0]?.action).toBe("user-input");
    expect(isAiEditableResumeIssue(diagnosis.issues[0]!)).toBe(false);
  });

});
