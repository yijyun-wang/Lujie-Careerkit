import { describe, expect, it } from "vitest";

import type { ResumeContent, ResumeOptimizationMeta } from "./types";
import {
  attachGeneralResumeOptimizationState,
  readGeneralResumeOptimizationStages,
} from "./resume-optimization-state";

const resume: ResumeContent = {
  basics: { name: "陳同學", email: "", phone: "", city: "", links: [] },
  profile: { title: "", summary: "" },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: [],
  awards: [],
  selfReview: "",
};

const optimization: ResumeOptimizationMeta = {
  company: "",
  title: "",
  keywords: [],
  summary: "通用優化",
  changes: [],
  versionName: "AI優化-陳同學",
};

describe("general resume optimization stages", () => {
  it("round-trips the analysis, draft, and review decisions", () => {
    const diagnosis = {
      summary: "整體結構清晰。",
      strengths: ["專案證據完整"],
      issues: [{
        id: "issue-1",
        section: "projects" as const,
        location: "專案經歷",
        severity: "medium" as const,
        action: "ai-edit" as const,
        category: "clarity" as const,
        title: "表達可以更清晰",
        evidence: "負責專案開發",
        explanation: "職責描述較泛。",
        suggestion: "補充方法與結果。",
      }],
    };
    const content = attachGeneralResumeOptimizationState(resume, resume, optimization, {
      diagnosis,
      draft: { ...resume, selfReview: "AI 草稿" },
      selectedIssueIds: ["issue-1"],
      preferences: ["clarity"],
      additionalDirection: "保持簡潔",
      acceptedChangeIds: ["selfReview"],
      editedValues: { selfReview: "人工修改" },
    });

    expect(readGeneralResumeOptimizationStages(content)).toEqual({
      diagnosis,
      draft: { ...resume, selfReview: "AI 草稿" },
      selectedIssueIds: ["issue-1"],
      preferences: ["clarity"],
      additionalDirection: "保持簡潔",
      acceptedChangeIds: ["selfReview"],
      editedValues: { selfReview: "人工修改" },
    });
  });
});
