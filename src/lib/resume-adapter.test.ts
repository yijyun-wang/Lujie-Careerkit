import { describe, expect, it } from "vitest";

import { contentToJadeResume, jadeResumeToContent } from "./resume-adapter";
import type { ResumeContent } from "./types";
import type { PersonalInfoContent, SkillsContent, WorkExperienceContent } from "@/types/resume";

const baseResume: ResumeContent = {
  basics: {
    name: "林澤宇",
    email: "linzeyu@example.com",
    phone: "139 0000 0000",
    city: "杭州",
    links: ["github.com/linzeyu"],
  },
  profile: {
    title: "後端開發實習生",
    summary: "",
  },
  education: [
    {
      school: "浙江某大學",
      degree: "學士",
      major: "軟體工程",
      start: "2022",
      end: "2026",
      highlights: ["GPA 3.8/4.0"],
    },
  ],
  experiences: [
    {
      company: "校內雲端計算實驗室",
      role: "研發助理",
      start: "2024-09",
      end: "2025-01",
      highlights: ["維護 Spring Boot 課程平台介面。"],
    },
  ],
  internships: [
    {
      company: "網易",
      role: "後端開發實習生",
      start: "2025-06",
      end: "2025-09",
      highlights: ["參與訂單查詢介面改造，將慢查詢比例降低 23%。"],
    },
  ],
  projects: [
    {
      name: "校園二手交易平台",
      role: "後端負責人",
      highlights: ["設計使用者、商品、訂單和訊息模組。"],
    },
  ],
  skills: [],
  awards: ["CET-6"],
  selfReview: "工程基礎紮實，習慣用資料回顧問題。",
};

describe("resume content adapter", () => {
  it("does not expose the target job title in the editor personal info", () => {
    const jadeResume = contentToJadeResume({
      ...baseResume,
      profile: { ...baseResume.profile, title: "Backend Intern" },
    });
    const personalInfo = jadeResume.sections.find((section) => section.type === "personal_info")?.content;

    expect(personalInfo).toMatchObject({ jobTitle: "" });
    expect(jadeResumeToContent(jadeResume).profile.title).toBe("");
  });

  it("builds core editor sections in the expected Chinese resume order", () => {
    const jadeResume = contentToJadeResume(baseResume);

    expect(jadeResume.sections.map((section) => [section.type, section.title])).toEqual([
      ["personal_info", "個人資訊"],
      ["education", "教育背景"],
      ["work_experience", "工作經歷"],
      ["internship_experience", "實習經歷"],
      ["projects", "專案經歷"],
      ["certifications", "資格證書"],
      ["self_evaluation", "自我評價"],
    ]);
  });

  it("round-trips internship experience and self evaluation", () => {
    const jadeResume = contentToJadeResume(baseResume);
    const content = jadeResumeToContent(jadeResume);

    expect(content.internships).toHaveLength(1);
    expect(content.internships[0]).toMatchObject({
      company: "網易",
      role: "後端開發實習生",
    });
    expect(content.selfReview).toBe("工程基礎紮實，習慣用資料回顧問題。");
  });

  it("keeps editor-only personal fields after saving and reopening", () => {
    const jadeResume = contentToJadeResume(baseResume);
    const personalInfo = jadeResume.sections.find((section) => section.type === "personal_info");
    personalInfo!.content = {
      ...(personalInfo!.content as PersonalInfoContent),
      age: "22",
      gender: "男",
      politicalStatus: "共青團員",
      wechat: "linzeyu",
      avatar: "data:image/jpeg;base64,avatar",
    };

    const reopened = contentToJadeResume(jadeResumeToContent(jadeResume));
    const reopenedPersonalInfo = reopened.sections.find((section) => section.type === "personal_info")?.content;

    expect(reopenedPersonalInfo).toMatchObject({
      age: "22",
      gender: "男",
      politicalStatus: "共青團員",
      wechat: "linzeyu",
      avatar: "data:image/jpeg;base64,avatar",
    });
  });

  it("keeps deleted sections and fields deleted after saving and reopening", () => {
    const jadeResume = contentToJadeResume(baseResume);
    const personalInfo = jadeResume.sections.find((section) => section.type === "personal_info");
    personalInfo!.content = {
      ...(personalInfo!.content as PersonalInfoContent),
      website: "",
      github: "github.com/linzeyu",
    };
    jadeResume.sections = jadeResume.sections.filter((section) => section.type !== "education");

    const reopened = contentToJadeResume(jadeResumeToContent(jadeResume));
    const reopenedPersonalInfo = reopened.sections.find((section) => section.type === "personal_info")?.content;

    expect(reopened.sections.some((section) => section.type === "education")).toBe(false);
    expect(reopenedPersonalInfo).toMatchObject({ website: "", github: "github.com/linzeyu" });

    jadeResume.sections = [];
    expect(contentToJadeResume(jadeResumeToContent(jadeResume)).sections).toEqual([]);

    const invalidSnapshot = jadeResumeToContent(contentToJadeResume(baseResume));
    invalidSnapshot.editor!.sections = [{} as never];
    expect(contentToJadeResume(invalidSnapshot).sections.map((section) => section.type)).toEqual([
      "personal_info",
      "education",
      "work_experience",
      "internship_experience",
      "projects",
      "certifications",
      "self_evaluation",
    ]);
  });

  it("keeps personal summary separate from self evaluation", () => {
    const reopened = contentToJadeResume({
      ...baseResume,
      profile: { ...baseResume.profile, summary: "專注後端開發。" },
      selfReview: "",
    });
    const summary = reopened.sections.find((section) => section.type === "summary")?.content as
      | { text: string }
      | undefined;
    const selfEvaluation = reopened.sections.find((section) => section.type === "self_evaluation")?.content as
      | { text: string }
      | undefined;

    expect(summary?.text).toBe("專注後端開發。");
    expect(selfEvaluation?.text).toBe("");

    const edited = contentToJadeResume(baseResume);
    const selfEvaluationSection = edited.sections.find((section) => section.type === "self_evaluation")!;
    edited.sections = [
      ...edited.sections.filter((section) => section.type !== "self_evaluation"),
      {
        ...selfEvaluationSection,
        id: "summary",
        type: "summary",
        title: "個人簡介",
        content: { text: "新增的個人簡介。" },
      },
    ];

    const reopenedEditor = contentToJadeResume(jadeResumeToContent(edited));
    expect(reopenedEditor.sections.find((section) => section.type === "summary")?.content).toEqual({
      text: "新增的個人簡介。",
    });
    expect(reopenedEditor.sections.some((section) => section.type === "self_evaluation")).toBe(false);
  });

  it("restores editor snapshots while applying newer resume content", () => {
    const savedContent = jadeResumeToContent(contentToJadeResume(baseResume));
    const optimizedContent: ResumeContent = {
      ...savedContent,
      experiences: [
        {
          ...savedContent.experiences[0],
          highlights: ["圍繞 JD 強化後的經歷表述。"],
        },
      ],
    };

    const reopened = contentToJadeResume(optimizedContent);
    const work = reopened.sections.find((section) => section.type === "work_experience")?.content as WorkExperienceContent;

    expect(work.items[0].highlights).toEqual(["圍繞 JD 強化後的經歷表述。"]);
  });

  it("recovers decimal text already damaged by the legacy list-prefix cleanup", () => {
    const savedContent = jadeResumeToContent(contentToJadeResume(baseResume));
    savedContent.education[0].highlights = ["GPA 8/4.0"];

    const reopened = contentToJadeResume(savedContent);
    const education = reopened.sections.find((section) => section.type === "education")?.content as {
      items: Array<{ highlights: string[] }>;
    };

    expect(education.items[0].highlights).toEqual(["GPA 3.8/4.0"]);
  });

  it("keeps work and project logos through the editor round-trip", () => {
    const logo = "data:image/png;base64,logo";
    const content = jadeResumeToContent(contentToJadeResume({
      ...baseResume,
      experiences: [{ ...baseResume.experiences[0], logo }],
      projects: [{ ...baseResume.projects[0], logo }],
    }));

    expect(content.experiences[0].logo).toBe(logo);
    expect(content.projects[0].logo).toBe(logo);
  });

  it("keeps skill category keywords isolated after saving and reopening", () => {
    const jadeResume = contentToJadeResume({ ...baseResume, skills: ["TypeScript"] });
    const skills = jadeResume.sections.find((section) => section.type === "skills")!;
    skills.content = {
      categories: [
        { id: "frontend", name: "前端", skills: ["TypeScript", "React"] },
        { id: "tools", name: "工具", skills: ["Git", "Docker"] },
      ],
    } satisfies SkillsContent;

    const reopened = contentToJadeResume(jadeResumeToContent(jadeResume));
    const reopenedSkills = reopened.sections.find((section) => section.type === "skills")?.content as SkillsContent;

    expect(reopenedSkills.categories).toEqual([
      { id: "frontend", name: "前端", skills: ["TypeScript", "React"] },
      { id: "tools", name: "工具", skills: ["Git", "Docker"] },
    ]);
  });

  it("keeps skill categories isolated when the flattened skills are reordered", () => {
    const jadeResume = contentToJadeResume({ ...baseResume, skills: ["TypeScript"] });
    const skills = jadeResume.sections.find((section) => section.type === "skills")!;
    skills.content = {
      categories: [
        { id: "frontend", name: "前端", skills: ["TypeScript", "React"] },
        { id: "tools", name: "工具", skills: ["Git", "Docker"] },
      ],
    } satisfies SkillsContent;
    const savedContent = jadeResumeToContent(jadeResume);
    savedContent.skills = ["Git", "Docker", "TypeScript", "React"];

    const reopened = contentToJadeResume(savedContent);
    const reopenedSkills = reopened.sections.find((section) => section.type === "skills")?.content as SkillsContent;

    expect(reopenedSkills.categories).toEqual([
      { id: "frontend", name: "前端", skills: ["TypeScript", "React"] },
      { id: "tools", name: "工具", skills: ["Git", "Docker"] },
    ]);
  });

  it("applies skill ordering changes inside existing categories", () => {
    const jadeResume = contentToJadeResume({ ...baseResume, skills: ["TypeScript", "React", "Git"] });
    const skills = jadeResume.sections.find((section) => section.type === "skills")!;
    skills.content = {
      categories: [
        { id: "frontend", name: "前端", skills: ["TypeScript", "React"] },
        { id: "tools", name: "工具", skills: ["Git"] },
      ],
    } satisfies SkillsContent;
    const savedContent = jadeResumeToContent(jadeResume);
    savedContent.skills = ["React", "TypeScript", "Git"];

    const reopened = contentToJadeResume(savedContent);
    const reopenedSkills = reopened.sections.find((section) => section.type === "skills")?.content as SkillsContent;

    expect(reopenedSkills.categories).toEqual([
      { id: "frontend", name: "前端", skills: ["React", "TypeScript"] },
      { id: "tools", name: "工具", skills: ["Git"] },
    ]);
  });

  it("maps imported custom titled sections into editor custom modules", () => {
    const jadeResume = contentToJadeResume({
      ...baseResume,
      customSections: [
        {
          title: "AIGC Strengths",
          content: "AIGC full-stack creator\nTechnical art workflow",
        },
      ],
    });
    const custom = jadeResume.sections.find((section) => section.type === "custom");

    expect(custom).toMatchObject({
      title: "AIGC Strengths",
      content: {
        items: [
          {
            title: "",
            description: "AIGC full-stack creator\nTechnical art workflow",
          },
        ],
      },
    });
    expect(jadeResumeToContent(jadeResume).customSections).toEqual([
      {
        title: "AIGC Strengths",
        content: "AIGC full-stack creator\nTechnical art workflow",
      },
    ]);
  });

  it("applies newer custom-section content over a stale editor snapshot", () => {
    const savedContent = jadeResumeToContent(contentToJadeResume({
      ...baseResume,
      customSections: [{ title: "主要優勢", content: "熟悉 Python。" }],
    }));
    savedContent.customSections = [{ title: "主要優勢", content: "熟悉 Python，並具備 AI 專案落地經驗。" }];

    const reopened = contentToJadeResume(savedContent);
    const custom = reopened.sections.find((section) => section.type === "custom");

    expect(jadeResumeToContent(reopened).customSections).toEqual([
      { title: "主要優勢", content: "熟悉 Python，並具備 AI 專案落地經驗。" },
    ]);
    expect(custom?.content).toMatchObject({
      items: [expect.objectContaining({ description: "熟悉 Python，並具備 AI 專案落地經驗。" })],
    });
  });

  it("keeps template and theme settings attached to the individual resume content", () => {
    const jadeResume = contentToJadeResume({
      ...baseResume,
      editor: {
        template: "classic",
        themeConfig: {
          primaryColor: "#111827",
          accentColor: "#b45309",
          fontFamily: "Inter",
          fontSize: "small",
          logoSize: "large",
          lineSpacing: 1.35,
          margin: { top: 18, right: 20, bottom: 18, left: 20 },
          sectionSpacing: 12,
          avatarStyle: "circle",
        },
      },
    });

    expect(jadeResume.template).toBe("classic");
    expect(jadeResume.themeConfig.accentColor).toBe("#b45309");
    expect(jadeResume.themeConfig.logoSize).toBe("large");

    jadeResume.template = "modern";
    jadeResume.themeConfig = { ...jadeResume.themeConfig, accentColor: "#315f92" };
    const content = jadeResumeToContent(jadeResume);

    expect(content.editor?.template).toBe("modern");
    expect(content.editor?.themeConfig?.accentColor).toBe("#315f92");
    expect(content.editor?.themeConfig?.logoSize).toBe("large");
  });
});
