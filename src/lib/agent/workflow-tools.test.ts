import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateInterviewPreparationWithAI } from "@/lib/ai/interview-preparation-task";
import { generateResumeDraftWithAI } from "@/lib/ai/resume-draft";
import { tailorResumeWithAI } from "@/lib/ai-service";
import { interviewService } from "@/lib/interview-runtime";
import {
  createInterviewPreparationRecord,
  createJob,
  createResumeVersion,
  createTailoredVersionForJob,
  getAppData,
  getTailoringBaseResume,
  updateResumeVersion,
} from "@/lib/repository";

import {
  createInterviewPreparation,
  createJdTailoredResume,
  createJdTailoredResumeSchema,
  createMockInterview,
  createResumeFromExperience,
  updateResumePresentation,
} from "./workflow-tools";
import { getPendingConfiguredWrite, hasRecentToolResult } from "./career-agent";

vi.mock("@/lib/ai/interview-preparation-task", () => ({ generateInterviewPreparationWithAI: vi.fn() }));
vi.mock("@/lib/ai/resume-draft", () => ({ generateResumeDraftWithAI: vi.fn() }));
vi.mock("@/lib/ai-service", () => ({ tailorResumeWithAI: vi.fn() }));
vi.mock("@/lib/interview-runtime", () => ({ interviewService: { createSession: vi.fn() } }));
vi.mock("@/lib/repository", () => ({
  createInterviewPreparationRecord: vi.fn(),
  createJob: vi.fn(),
  createResumeVersion: vi.fn(),
  createTailoredVersionForJob: vi.fn(),
  getAppData: vi.fn(),
  getTailoringBaseResume: vi.fn(),
  updateResumeVersion: vi.fn(),
}));

const settings = { enabled: true } as never;
const resume = {
  basics: { name: "張三", email: "", phone: "", city: "", links: [] },
  profile: { title: "後端工程師", summary: "" },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: ["TypeScript"],
  awards: [],
  selfReview: "",
};

beforeEach(() => vi.resetAllMocks());

describe("Agent workflow tools", () => {
  it("requires a fresh preference card after each new user request", () => {
    const selected = [
      { role: "user", content: [{ type: "text", text: "優化這份履歷" }] },
      {
        role: "tool",
        content: [{
          type: "tool-result",
          toolCallId: "tool-1",
          toolName: "configure_jd_optimization",
          output: { type: "json", value: { preferences: {} } },
        }],
      },
    ] as never;
    expect(hasRecentToolResult(selected, "configure_jd_optimization")).toBe(true);
    expect(hasRecentToolResult([
      ...selected,
      { role: "user", content: [{ type: "text", text: "再優化另一份" }] },
    ] as never, "configure_jd_optimization")).toBe(false);
  });

  it("moves a completed JD configuration directly to the protected write", () => {
    const configured = [
      { role: "user", content: [{ type: "text", text: "優化這份履歷" }] },
      {
        role: "tool",
        content: [{
          type: "tool-result",
          toolCallId: "tool-1",
          toolName: "configure_jd_optimization",
          output: { type: "json", value: { preferences: {} } },
        }],
      },
    ] as never;

    expect(getPendingConfiguredWrite(configured)).toBe("create_jd_tailored_resume");
    expect(getPendingConfiguredWrite([
      ...configured,
      {
        role: "assistant",
        content: [{
          type: "tool-call",
          toolCallId: "tool-2",
          toolName: "create_jd_tailored_resume",
          input: {},
        }],
      },
    ] as never)).toBeNull();
  });

  it("routes interview configuration to the requested workflow", () => {
    const configured = [
      { role: "user", content: [{ type: "text", text: "開始模擬面試" }] },
      {
        role: "tool",
        content: [{
          type: "tool-result",
          toolCallId: "tool-1",
          toolName: "configure_interview",
          output: { type: "json", value: { task: "simulation", mode: "project" } },
        }],
      },
    ] as never;

    expect(getPendingConfiguredWrite(configured)).toBe("create_mock_interview");
  });

  it("requires an unambiguous Job identity when no jobId exists", () => {
    expect(createJdTailoredResumeSchema.safeParse({
      resumeVersionId: "resume-1",
      jd: "職缺描述",
    }).success).toBe(false);
  });

  it("creates an independent resume from user-stated experience", async () => {
    vi.mocked(generateResumeDraftWithAI).mockResolvedValue({ source: "ai", data: resume, message: "ok" } as never);
    vi.mocked(createResumeVersion).mockResolvedValue(version("resume-1", null) as never);

    const result = await createResumeFromExperience({
      sourceText: "我在示例公司負責 TypeScript 服務開發和介面維護。",
      resumeName: "後端求職履歷",
      targetRole: "後端工程師",
    }, settings, "zh-TW");

    expect(createResumeVersion).toHaveBeenCalledWith(expect.objectContaining({ name: "後端求職履歷", content: resume }));
    expect(result.href).toBe("/resume/edit?version=resume-1");
  });

  it("reuses an exact Job and saves a new tailored version", async () => {
    const job = sampleJob();
    vi.mocked(getAppData)
      .mockResolvedValueOnce(appData(job) as never)
      .mockResolvedValueOnce(appData(job) as never);
    vi.mocked(getTailoringBaseResume).mockResolvedValue(resume as never);
    vi.mocked(tailorResumeWithAI).mockResolvedValue({
      source: "ai",
      data: resume,
      meta: { company: "示例公司", title: "後端工程師", keywords: [], summary: "已優化", changes: [], versionName: "客製履歷" },
      message: "ok",
    } as never);
    vi.mocked(createTailoredVersionForJob).mockResolvedValue(version("tailored-1", job.id) as never);

    const result = await createJdTailoredResume({ resumeVersionId: "resume-1", jobId: job.id }, settings);

    expect(createJob).not.toHaveBeenCalled();
    expect(createTailoredVersionForJob).toHaveBeenCalledWith(expect.objectContaining({ jobId: job.id, resumeVersionId: "resume-1" }));
    expect(result.version.id).toBe("tailored-1");
    expect(result.href).toBe("/library/jobs/job-1");
  });

  it("generates interview preparation only for exact saved records", async () => {
    const job = sampleJob();
    vi.mocked(getAppData).mockResolvedValue(appData(job) as never);
    vi.mocked(generateInterviewPreparationWithAI).mockResolvedValue({ source: "ai", data: {}, message: "ok" } as never);
    vi.mocked(createInterviewPreparationRecord).mockResolvedValue({ id: "prep-1" } as never);

    const result = await createInterviewPreparation({
      jobId: job.id,
      resumeVersionId: "resume-1",
      focus: "comprehensive",
    }, settings, "zh-TW");

    expect(createInterviewPreparationRecord).toHaveBeenCalledOnce();
    expect(result.href).toBe("/library/jobs/job-1");
  });

  it("creates a mock-interview session and opens the interactive workspace", async () => {
    const job = sampleJob();
    vi.mocked(getAppData).mockResolvedValue(appData(job) as never);
    vi.mocked(interviewService.createSession).mockResolvedValue({ id: "session-1" } as never);

    const result = await createMockInterview({
      jobId: job.id,
      resumeVersionId: "resume-1",
      mode: "project",
    });

    expect(interviewService.createSession).toHaveBeenCalledWith(expect.objectContaining({
      jobId: job.id,
      resumeVersionId: "resume-1",
      mode: "project",
    }));
    expect(result.href).toBe("/interview?session=session-1");
  });

  it("changes only the selected resume template", async () => {
    const job = sampleJob();
    vi.mocked(getAppData).mockResolvedValue(appData(job) as never);
    vi.mocked(updateResumeVersion).mockResolvedValue(version("resume-1", null) as never);

    const result = await updateResumePresentation({ resumeVersionId: "resume-1", template: "ats" });

    expect(updateResumeVersion).toHaveBeenCalledWith({
      versionId: "resume-1",
      content: expect.objectContaining({ editor: { template: "ats" } }),
    });
    expect(result.href).toBe("/resume/edit?version=resume-1");
  });
});

function sampleJob() {
  return {
    id: "job-1",
    company: "示例公司",
    title: "後端工程師",
    city: "北京",
    source: "官網",
    jd: "負責 TypeScript 後端服務開發。",
    link: "",
    deadline: null,
    analysis: null,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  };
}

function appData(job: ReturnType<typeof sampleJob>) {
  return {
    resume: null,
    versions: [{
      ...version("resume-1", null),
      createdAt: "2026-08-26T00:00:00.000Z",
      updatedAt: "2026-08-26T00:00:00.000Z",
    }],
    jobs: [job],
    applications: [],
    interviews: [],
    interviewPreparations: [],
    settings: null,
  };
}

function version(id: string, jobId: string | null) {
  return {
    id,
    resumeId: "root-1",
    jobId,
    name: "後端履歷",
    summary: "摘要",
    content: resume,
    createdAt: new Date("2026-08-26T00:00:00.000Z"),
    updatedAt: new Date("2026-08-26T00:00:00.000Z"),
  };
}
