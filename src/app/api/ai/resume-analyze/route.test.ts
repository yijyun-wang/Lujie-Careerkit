import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeResumeWithAI: vi.fn(),
}));

vi.mock("@/lib/ai-service", () => ({
  analyzeResumeWithAI: mocks.analyzeResumeWithAI,
}));

import { GET, POST } from "./route";

const resume = {
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

describe("resume analysis route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns structured AI diagnosis without creating a version", async () => {
    const diagnosis = {
      summary: "專案表達需要補充行動與結果。",
      strengths: ["技能方向明確"],
      issues: [{
        id: "issue-1",
        section: "projects",
        location: "專案經歷",
        severity: "high",
        category: "action-result",
        title: "缺少個人行動",
        evidence: "參與專案開發",
        explanation: "沒有說明具體負責的工作。",
        suggestion: "補充本人採取的行動和可驗證結果。",
      }],
    };
    mocks.analyzeResumeWithAI.mockResolvedValue({
      source: "ai",
      message: "履歷診斷完成",
      data: diagnosis,
    });

    const response = await POST(jsonRequest({ resume, locale: "zh-TW" }));

    expect(response.status).toBe(200);
    expect(mocks.analyzeResumeWithAI).toHaveBeenCalledWith({
      resume: expect.objectContaining(resume),
      locale: "zh-TW",
    });
    await expect(response.json()).resolves.toEqual({
      diagnosis,
      message: "履歷診斷完成",
    });
  });

  it("returns 503 when AI analysis is unavailable", async () => {
    mocks.analyzeResumeWithAI.mockResolvedValue({
      source: "fallback",
      message: "缺少 API Key",
      data: { summary: "", strengths: [], issues: [] },
    });

    const response = await POST(jsonRequest({ resume }));

    expect(response.status).toBe(503);
  });

  it("warms the route without calling the model", async () => {
    const response = await GET();

    expect(response.status).toBe(204);
    expect(mocks.analyzeResumeWithAI).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/ai/resume-analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
