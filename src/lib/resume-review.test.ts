import { describe, expect, it } from "vitest";

import {
  applyResumeReviewChanges,
  buildResumeReviewChanges,
  resumeReviewChangeAddressesIssue,
} from "./resume-review";
import type { ResumeContent } from "./types";

const original: ResumeContent = {
  basics: { name: "陳同學", email: "chen@example.com", phone: "13800000000", city: "北京", links: [] },
  profile: { title: "AI 產品經理", summary: "關注 AI 產品。" },
  education: [],
  experiences: [],
  internships: [],
  projects: [{
    name: "課程推薦系統",
    role: "產品負責人",
    highlights: ["參與需求分析。", "整理回顧材料。"],
  }],
  skills: ["Python", "產品設計"],
  awards: ["一等獎學金"],
  customSections: [{ title: "主要優勢", content: "學習能力強。" }],
  selfReview: "希望參與真實業務。",
};

describe("resume review changes", () => {
  it("builds granular changes only for editable resume copy", () => {
    const optimized: ResumeContent = {
      ...original,
      basics: { ...original.basics, name: "不應出現的姓名" },
      profile: { ...original.profile, summary: "具備 AI 產品規劃與落地經驗。" },
      projects: [{
        ...original.projects[0],
        highlights: ["完成需求拆解並推進方案驗證。", original.projects[0].highlights[1]],
      }],
      skills: ["產品設計", "Python"],
      customSections: [{ title: "主要優勢", content: "能夠快速學習並完成業務驗證。" }],
    };

    const changes = buildResumeReviewChanges(original, optimized);

    expect(changes.map((change) => change.id)).toEqual([
      "summary:profile",
      "projects:0:highlight:0",
      "skills:list",
      "customSections:0",
    ]);
    expect(changes.some((change) => change.before.includes("陳同學"))).toBe(false);
  });

  it("applies only accepted changes and preserves identity fields", () => {
    const optimized: ResumeContent = {
      ...original,
      profile: { ...original.profile, summary: "具備 AI 產品規劃與落地經驗。" },
      projects: [{
        ...original.projects[0],
        highlights: ["完成需求拆解並推進方案驗證。", original.projects[0].highlights[1]],
      }],
    };
    const changes = buildResumeReviewChanges(original, optimized);
    const reviewed = applyResumeReviewChanges(
      original,
      changes,
      new Set(["projects:0:highlight:0"]),
      { "projects:0:highlight:0": "拆解需求並推動 2 輪已有方案驗證。" },
    );

    expect(reviewed.profile.summary).toBe(original.profile.summary);
    expect(reviewed.projects[0].highlights[0]).toBe("拆解需求並推動 2 輪已有方案驗證。");
    expect(reviewed.basics).toEqual(original.basics);
  });

  it("keeps the original value when an accepted edit is blank", () => {
    const optimized = {
      ...original,
      skills: ["產品設計", "Python"],
    };
    const changes = buildResumeReviewChanges(original, optimized);
    const reviewed = applyResumeReviewChanges(
      original,
      changes,
      new Set(["skills:list"]),
      { "skills:list": " \n " },
    );

    expect(reviewed.skills).toEqual(original.skills);
  });

  it("matches diagnosis evidence to the actual changed text instead of only the section", () => {
    const optimized: ResumeContent = {
      ...original,
      projects: [{
        ...original.projects[0],
        highlights: ["完成需求拆解並推進方案驗證。", original.projects[0].highlights[1]],
      }],
    };
    const changes = buildResumeReviewChanges(original, optimized);
    const addressedIssue = {
      id: "issue-1",
      section: "projects" as const,
      location: "課程推薦系統",
      severity: "high" as const,
      category: "clarity" as const,
      title: "行動不清楚",
      evidence: "參與需求分析。",
      explanation: "沒有寫明行動。",
      suggestion: "明確具體行動。",
    };
    const untouchedIssue = {
      ...addressedIssue,
      id: "issue-2",
      title: "回顧結果不清楚",
      evidence: "整理回顧材料。",
    };

    expect(resumeReviewChangeAddressesIssue(changes[0], addressedIssue)).toBe(true);
    expect(resumeReviewChangeAddressesIssue(changes[0], untouchedIssue)).toBe(false);
  });

  it("matches quoted evidence after harmless punctuation normalization", () => {
    const optimized: ResumeContent = {
      ...original,
      projects: [{
        ...original.projects[0],
        highlights: ["獨立完成需求分析。", original.projects[0].highlights[1]],
      }],
    };
    const [change] = buildResumeReviewChanges(original, optimized);
    const issue = {
      id: "issue-quoted",
      section: "projects" as const,
      location: "課程推薦系統",
      severity: "medium" as const,
      category: "clarity" as const,
      title: "“參與”弱化個人角色",
      evidence: "“參與需求分析”",
      explanation: "個人行動不清楚。",
      suggestion: "明確個人行動。",
    };

    expect(resumeReviewChangeAddressesIssue(change, issue)).toBe(true);
  });

  it("does not report punctuation and spacing cleanup as a substantive change", () => {
    const optimized: ResumeContent = {
      ...original,
      projects: [{
        ...original.projects[0],
        highlights: ["參與需求分析：", "整理回顧材料。"],
      }],
    };

    expect(buildResumeReviewChanges(original, optimized)).toEqual([]);
  });

  it("uses the named resume item when quoted evidence is not exact", () => {
    const optimized: ResumeContent = {
      ...original,
      projects: [{
        ...original.projects[0],
        highlights: ["獨立完成需求分析並推進驗證。", original.projects[0].highlights[1]],
      }],
    };
    const [change] = buildResumeReviewChanges(original, optimized);
    const issue = {
      id: "issue-location",
      section: "projects" as const,
      location: "專案經歷 > 課程推薦系統 > 第 1 條",
      severity: "high" as const,
      category: "clarity" as const,
      title: "個人行動不清楚",
      evidence: "參與需求分析與方案規劃",
      explanation: "引用內容與實際原文略有差異。",
      suggestion: "明確個人行動。",
    };

    expect(resumeReviewChangeAddressesIssue(change, issue)).toBe(true);
  });
});
