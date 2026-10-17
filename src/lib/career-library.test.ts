import { describe, expect, it } from "vitest";

import type { InitialData } from "@/components/app/types";
import type { InterviewPreparationRecord } from "@/lib/interview-preparation";
import type { InterviewSessionRecord } from "@/lib/interview-service";
import type { ResumeContent } from "@/lib/types";

import {
  buildCareerArtifacts,
  buildCareerArtifactTree,
  buildCareerJobArchives,
  groupCareerJobArchivesByCompany,
  normalizeCompanyIdentity,
  parseCareerLibraryTarget,
  type CareerJobArchive,
} from "./career-library";

const baseResume: ResumeContent = {
  basics: { name: "李明", email: "", phone: "", city: "上海", links: [] },
  profile: { title: "產品經理", summary: "負責產品規劃。" },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: ["需求分析"],
  awards: [],
  selfReview: "",
};

function makeData(): InitialData {
  return {
    resume: null,
    versions: [
      {
        id: "plain",
        resumeId: "resume-plain",
        jobId: null,
        name: "普通副本",
        summary: "不屬於系統生成成果",
        content: baseResume,
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "general",
        resumeId: "resume-plain",
        jobId: null,
        name: "通用優化履歷",
        summary: "通用優化",
        content: {
          ...baseResume,
          profile: { ...baseResume.profile, summary: "負責從需求洞察到上線回顧的完整產品流程。" },
          _tailoringBaseResume: baseResume,
        } as ResumeContent,
        createdAt: "2026-08-02T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
      },
      {
        id: "tailored",
        resumeId: "resume-plain",
        jobId: "job-1",
        name: "AI 產品經理客製版",
        summary: "職缺客製",
        content: {
          ...baseResume,
          profile: { ...baseResume.profile, summary: "圍繞 AI 產品規劃補強職缺比對表達。" },
          _tailoringBaseResume: baseResume,
        } as ResumeContent,
        createdAt: "2026-08-03T00:00:00.000Z",
        updatedAt: "2026-08-03T00:00:00.000Z",
      },
    ],
    jobs: [
      {
        id: "job-1",
        company: "字節跳動",
        title: "AI 產品經理",
        city: "北京",
        source: "官網",
        jd: "負責 AI 產品規劃。",
        link: "",
        deadline: null,
        analysis: {
          company: "字節跳動",
          title: "AI 產品經理",
          deadline: null,
          requirements: ["產品規劃"],
          keywords: ["AI"],
          bonusPoints: [],
          risks: [],
          suggestions: [],
        },
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-04T00:00:00.000Z",
      },
    ],
    applications: [
      {
        id: "application-1",
        jobId: "job-1",
        status: "INTERVIEW",
        interviewRound: "FIRST",
        resumeVersionId: "tailored",
        appliedAt: null,
        stageDate: null,
        nextFollowUpAt: null,
        notes: "",
        updatedAt: "2026-08-05T00:00:00.000Z",
      },
    ],
    interviewPreparations: [makePreparation("prep-1", "interview-draft-job", "獨角獸科技", "增長產品經理")],
    interviews: [makeInterview("session-1", "interview-draft-job", "獨角獸科技", "增長產品經理")],
    settings: null,
  };
}

describe("career library", () => {
  it("only includes generated outcomes and keeps general optimization outside job archives", () => {
    const data = makeData();
    const artifacts = buildCareerArtifacts(data);
    const archives = buildCareerJobArchives(data, artifacts);

    expect(artifacts.map((artifact) => artifact.id)).not.toContain("plain");
    expect(artifacts.find((artifact) => artifact.id === "general")).toMatchObject({
      kind: "general-resume",
      jobArchiveId: null,
    });
    expect(artifacts.find((artifact) => artifact.id === "tailored")).toMatchObject({
      kind: "tailored-resume",
      jobId: "job-1",
      jobArchiveId: "job-1",
    });
    expect(archives.find((archive) => archive.jobId === "job-1")).toMatchObject({
      status: "INTERVIEW",
      counts: { analyses: 1, tailoredResumes: 1, preparations: 0, interviews: 0 },
    });
  });

  it("groups preparation and interview records by their real company and role instead of a shared draft job", () => {
    const data = makeData();
    const artifacts = buildCareerArtifacts(data);
    const archives = buildCareerJobArchives(data, artifacts);
    const virtual = archives.find((archive) => archive.jobId === null);

    expect(virtual).toMatchObject({
      company: "獨角獸科技",
      role: "增長產品經理",
      counts: { analyses: 0, tailoredResumes: 0, preparations: 1, interviews: 1 },
    });
    expect(virtual?.id).toMatch(/^virtual-/);
  });

  it("binds interview outcomes through a tailored resume first and the exact JD second", () => {
    const data = makeData();
    const preparation = makePreparation("prep-linked", "interview-draft-job", "不同展示名", "不同職缺名");
    preparation.resumeVersionId = "tailored";
    const interview = makeInterview("session-linked", "interview-draft-job", "另一展示名", "另一職缺名");
    interview.resumeVersionId = null;
    interview.context.jd = data.jobs[0].jd;
    interview.createdAt = "2026-08-05T00:00:00.000Z";
    data.interviewPreparations = [preparation];
    data.interviews = [interview];

    const artifacts = buildCareerArtifacts(data);

    expect(artifacts.find((artifact) => artifact.id === preparation.id)).toMatchObject({
      jobArchiveId: "job-1",
      company: "字節跳動",
      role: "AI 產品經理",
    });
    expect(artifacts.find((artifact) => artifact.id === interview.id)).toMatchObject({
      jobArchiveId: "job-1",
      company: "字節跳動",
      role: "AI 產品經理",
    });
  });

  it("only exposes tree nodes backed by data and parses deep links", () => {
    const artifacts = buildCareerArtifacts(makeData());
    const artifact = artifacts.find((item) => item.id === "general");
    const jobArtifact = artifacts.find((item) => item.kind === "job-analysis");

    expect(artifact).toBeDefined();
    expect(buildCareerArtifactTree(artifact!)).toEqual([{ id: "overview" }]);
    expect(jobArtifact).toBeDefined();
    expect(buildCareerArtifactTree(jobArtifact!)).toEqual([{ id: "original-jd" }]);
    expect(buildCareerArtifactTree(artifacts.find((item) => item.id === "tailored")!)).toEqual([{ id: "overview" }]);
    expect(parseCareerLibraryTarget("/library/jobs/job-1")).toEqual({ type: "job", id: "job-1" });
    expect(parseCareerLibraryTarget("/library/artifacts/general-resume/general")).toEqual({
      type: "artifact",
      kind: "general-resume",
      id: "general",
    });
    expect(parseCareerLibraryTarget("/library/artifacts/unknown/general")).toBeNull();
  });

  it("archives a job with an original JD even when no derived analysis was saved", () => {
    const data = makeData();
    data.jobs[0].analysis = null;

    expect(buildCareerArtifacts(data).find((item) => item.kind === "job-analysis")).toMatchObject({
      id: data.jobs[0].id,
      metrics: [1],
    });
  });

  it("groups high-confidence company name variants without merging their job archives", () => {
    const archive = (id: string, company: string, role: string): CareerJobArchive => ({
      id,
      jobId: id,
      isSample: false,
      company,
      role,
      city: "北京",
      status: null,
      updatedAt: "2026-08-06T00:00:00.000Z",
      artifacts: [],
      counts: { analyses: 0, tailoredResumes: 0, preparations: 0, interviews: 0 },
    });
    const groups = groupCareerJobArchivesByCompany([
      archive("job-ai", "字節跳動有限公司", "AI 產品經理"),
      archive("job-growth", "字節跳動", "增長產品經理"),
      archive("job-cloud", "阿里雲", "產品經理"),
    ]);

    expect(normalizeCompanyIdentity("ByteDance Co., Ltd.")).toBe("bytedance");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ name: "字節跳動" });
    expect(groups[0].archives.map((item) => item.id)).toEqual(["job-ai", "job-growth"]);
  });
});

function makePreparation(
  id: string,
  jobId: string,
  company: string,
  title: string,
): InterviewPreparationRecord {
  return {
    id,
    jobId,
    resumeVersionId: null,
    mode: "comprehensive",
    context: { jd: "JD", resumeName: "主履歷", resume: baseResume, focus: "comprehensive", locale: "zh-TW" },
    content: {
      meta: { company, title, roleFamily: "產品", roleSummary: "負責增長產品", assumptions: [] },
      capabilityProfile: { overview: "能力概覽", dimensions: [] },
      evidenceMatrix: [],
      knowledgeTopics: [],
      deepDives: [],
      targetedQuestions: [],
      preparationPlan: { mustPrepare: [], shouldPrepare: [], optional: [] },
      selfIntroduction: "",
      reverseQuestions: [],
    },
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
  } as InterviewPreparationRecord;
}

function makeInterview(
  id: string,
  jobId: string,
  company: string,
  title: string,
): InterviewSessionRecord {
  return {
    id,
    jobId,
    resumeVersionId: null,
    mode: "comprehensive",
    status: "IN_PROGRESS",
    context: { company, title, jd: "JD", resumeName: "主履歷", resume: baseResume },
    questions: [{ id: "question-1", prompt: "請介紹專案", category: "project", focus: "驗證經歷", order: 0 }],
    answers: { "question-1": { questionId: "question-1", content: "我的回答", skipped: false, updatedAt: "2026-08-06T00:00:00.000Z" } },
    feedback: null,
    currentQuestionIndex: 0,
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
    completedAt: null,
  };
}
