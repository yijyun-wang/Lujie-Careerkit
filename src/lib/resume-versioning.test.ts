import { describe, expect, it } from "vitest";

import { buildOptimizedResumeVersionName, buildTailoredResumeVersion } from "./resume-versioning";
import type { ResumeContent } from "./types";

const namedResume: ResumeContent = {
  basics: {
    name: "Alex Chen",
    email: "alex@example.com",
    phone: "138 0000 0000",
    city: "上海",
    links: ["github.com/alexchen"],
  },
  profile: {
    title: "資料分析方向學生",
    summary: "",
  },
  education: [
    {
      school: "上海交通大學",
      degree: "學士",
      major: "資訊管理",
      start: "2023",
      end: "2027",
      highlights: ["GPA 3.8/4.0"],
    },
  ],
  experiences: [],
  internships: [
    {
      company: "校園創新中心",
      role: "產品營運助理",
      start: "2025-03",
      end: "2025-06",
      highlights: ["整理使用者反饋並輸出回顧報告。"],
    },
  ],
  projects: [
    {
      name: "課程專案資料看板",
      role: "資料分析負責人",
      highlights: ["使用 SQL 處理資料並支援 A/B 測試回顧。"],
    },
  ],
  skills: ["使用者研究", "活動回顧", "SQL", "A/B 測試"],
  awards: [],
  selfReview: "關注資料分析和使用者增長。",
};

describe("buildTailoredResumeVersion", () => {
  it("creates a JD-specific resume version without mutating the master resume", () => {
    const master = structuredClone(namedResume);
    const before = JSON.stringify(master);

    const version = buildTailoredResumeVersion({
      masterResume: master,
      job: { id: "job-1", company: "騰訊", title: "產品營運實習生" },
      analysis: {
        company: "騰訊",
        title: "產品營運實習生",
        deadline: "2026-06-18",
        requirements: ["資料分析", "使用者研究", "活動回顧"],
        keywords: ["SQL", "使用者研究", "A/B 測試"],
        bonusPoints: ["有校園社群經驗"],
        risks: [],
        suggestions: ["把課程專案裡的資料分析經歷前置。"],
      },
    });

    expect(JSON.stringify(master)).toBe(before);
    expect(version.name).toBe("JD比對優化-Alex Chen-產品營運實習生");
    expect(version.summary).toContain("SQL");
    expect(version.content.skills[0]).toBe("SQL");
    expect(version.content.projects[0].highlights).toEqual(master.projects[0].highlights);
  });

  it("names optimized resumes from the resume owner and JD title", () => {
    expect(buildOptimizedResumeVersionName(namedResume, "資料分析實習生")).toBe(
      "JD比對優化-Alex Chen-資料分析實習生",
    );

    expect(
      buildOptimizedResumeVersionName(
        {
          ...namedResume,
          basics: { ...namedResume.basics, name: "" },
          editor: { ...namedResume.editor, displayName: "王梓涵的履歷" },
        },
        "大型語言模型演算法工程師",
      ),
    ).toBe("JD比對優化-王梓涵-大型語言模型演算法工程師");
  });
});
