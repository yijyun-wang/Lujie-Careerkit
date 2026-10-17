import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  optimizeResumeWithAI: vi.fn(),
  getTailoringBaseResume: vi.fn(),
}));

vi.mock("@/lib/ai-service", () => ({
  optimizeResumeWithAI: mocks.optimizeResumeWithAI,
}));
vi.mock("@/lib/repository", () => ({
  getTailoringBaseResume: mocks.getTailoringBaseResume,
}));

import { GET, POST } from "./route";

const baseResume = {
  basics: { name: "陳同學", email: "", phone: "", city: "", links: [] },
  profile: { title: "產品經理", summary: "關注 AI 產品。" },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: ["AI 產品", "Prompt"],
  awards: [],
  selfReview: "",
};

describe("resume AI optimization route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTailoringBaseResume.mockResolvedValue(baseResume);
  });

  it("returns an error when AI falls back", async () => {
    mocks.optimizeResumeWithAI.mockResolvedValue({
      source: "fallback",
      message: "缺少 API Key",
      data: baseResume,
    });

    const response = await POST(jsonRequest({ resumeContent: baseResume }));

    expect(response.status).toBe(503);
  });

  it("returns a review draft without creating a resume version when AI succeeds", async () => {
    const optimizedResume = {
      ...baseResume,
      profile: { ...baseResume.profile, summary: "具備 AI 產品規劃與 Prompt 迭代經驗。" },
    };
    mocks.optimizeResumeWithAI.mockResolvedValue({
      source: "ai",
      message: "履歷優化完成",
      data: optimizedResume,
    });

    const response = await POST(jsonRequest({ resumeContent: baseResume }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.optimizeResumeWithAI).toHaveBeenCalledWith({
      resume: baseResume,
      diagnosis: undefined,
      selectedIssueIds: undefined,
      preferences: undefined,
      additionalDirection: undefined,
      locale: undefined,
    });
    expect(body).toEqual({
      draft: optimizedResume,
      optimization: {
        company: "",
        title: "",
        keywords: [],
        summary: "",
        changes: [],
        versionName: "",
      },
      source: "ai",
      message: "履歷優化完成",
    });
  });

  it("passes the selected diagnosis and optimization preferences to AI", async () => {
    const diagnosis = {
      summary: "需要加強成果表達。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "projects",
        location: "專案經歷",
        severity: "high",
        category: "action-result",
        title: "結果不清楚",
        evidence: "參與需求分析",
        explanation: "沒有說明行動帶來的結果。",
        suggestion: "使用已有事實補充行動與結果。",
      }],
    };
    mocks.optimizeResumeWithAI.mockResolvedValue({
      source: "ai",
      message: "履歷優化完成",
      data: baseResume,
    });

    const response = await POST(jsonRequest({
      resumeContent: baseResume,
      diagnosis,
      selectedIssueIds: ["issue-1"],
      additionalDirection: "GPA 寫法無需調整，優先優化專案經歷。",
      locale: "zh-TW",
    }));

    expect(response.status).toBe(200);
    expect(mocks.optimizeResumeWithAI).toHaveBeenCalledWith({
      resume: baseResume,
      diagnosis,
      selectedIssueIds: ["issue-1"],
      additionalDirection: "GPA 寫法無需調整，優先優化專案經歷。",
      locale: "zh-TW",
    });
  });

  it("rejects an oversized additional direction", async () => {
    const response = await POST(jsonRequest({
      resumeContent: baseResume,
      additionalDirection: "a".repeat(1_001),
    }));

    expect(response.status).toBe(400);
    expect(mocks.optimizeResumeWithAI).not.toHaveBeenCalled();
  });

  it("returns 404 when the selected resume version no longer exists", async () => {
    mocks.getTailoringBaseResume.mockRejectedValue(new Error("找不到所選履歷版本。"));

    const response = await POST(jsonRequest({ resumeVersionId: "missing-version" }));

    expect(response.status).toBe(404);
    expect(mocks.optimizeResumeWithAI).not.toHaveBeenCalled();
  });

  it("rejects automatic optimization for an issue requiring user confirmation", async () => {
    const diagnosis = {
      summary: "GPA 寫法需要核實。",
      strengths: [],
      issues: [{
        id: "issue-1",
        section: "education",
        location: "教育背景",
        severity: "high",
        action: "user-confirm",
        category: "clarity",
        title: "GPA 格式有誤",
        evidence: "GPA 8/4.0",
        explanation: "分子大於滿分。",
        suggestion: "請確認實際 GPA 和滿分制式。",
      }],
    };

    const response = await POST(jsonRequest({
      resumeContent: baseResume,
      diagnosis,
      selectedIssueIds: ["issue-1"],
    }));

    expect(response.status).toBe(400);
    expect(mocks.optimizeResumeWithAI).not.toHaveBeenCalled();
  });

  it("warms the route without calling the model", async () => {
    const response = await GET();

    expect(response.status).toBe(204);
    expect(mocks.getTailoringBaseResume).not.toHaveBeenCalled();
    expect(mocks.optimizeResumeWithAI).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/ai/resume-optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
