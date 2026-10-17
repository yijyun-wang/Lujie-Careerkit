import { afterEach, describe, expect, it, vi } from "vitest";

import { buildUploadedResumeDraft, getResumeUploadKind, RESUME_UPLOAD_ACCEPT } from "./resume-upload";
import type { ResumeContent } from "./types";

const aiParsedResume: ResumeContent = {
  basics: { name: "王小明", email: "wm@example.com", phone: "13800138000", city: "", links: [] },
  profile: { title: "產品營運", summary: "" },
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  skills: [],
  awards: [],
  selfReview: "",
};

describe("resume upload formats", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("routes supported resume files to the correct parser", () => {
    expect(getResumeUploadKind("resume.json")).toBe("json");
    expect(getResumeUploadKind("resume.txt")).toBe("text");
    expect(getResumeUploadKind("resume.md")).toBe("text");
    expect(getResumeUploadKind("resume.pdf")).toBe("pdf");
    expect(getResumeUploadKind("resume.doc")).toBe("word");
    expect(getResumeUploadKind("resume.docx")).toBe("word");
    expect(getResumeUploadKind("resume.png")).toBe("image");
    expect(getResumeUploadKind("resume.jpg")).toBe("image");
    expect(getResumeUploadKind("resume.pages")).toBe(null);
  });

  it("keeps the browser accept list aligned with supported formats", () => {
    expect(RESUME_UPLOAD_ACCEPT).toContain(".pdf");
    expect(RESUME_UPLOAD_ACCEPT).toContain(".doc");
    expect(RESUME_UPLOAD_ACCEPT).toContain(".docx");
    expect(RESUME_UPLOAD_ACCEPT).toContain(".png");
  });

  it("imports plain text resumes through the AI parser", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        fileName: "產品營運履歷.txt",
        content: aiParsedResume,
        characterCount: JSON.stringify(aiParsedResume).length,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const draft = await buildUploadedResumeDraft(
      new File(
        [
          [
            "王小明",
            "應徵職務：產品營運",
            "手機：13800138000 電子郵件：wm@example.com",
            "",
            "教育背景",
            "北京大學 ｜ 學士 ｜ 資訊管理 ｜ 2020.09-2024.06",
            "GPA 3.8/4.0",
            "",
            "專案經歷",
            "校園活動增長專案 ｜ 專案負責人",
            "- 使用 SQL 分析報名轉化",
            "",
            "技能",
            "SQL、Excel、使用者研究",
          ].join("\n"),
        ],
        "產品營運履歷.txt",
        { type: "text/plain" },
      ),
    );

    expect(draft.fileName).toBe("產品營運履歷.txt");
    expect(draft.content.basics.name).toBe("王小明");
    expect(draft.content.basics.email).toBe("wm@example.com");
    expect(fetch).toHaveBeenCalledWith("/api/ai/resume-import", expect.objectContaining({ method: "POST" }));
  });

  it("can ask the API to use the local fallback parser", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        fileName: "產品營運履歷.txt",
        content: aiParsedResume,
        characterCount: JSON.stringify(aiParsedResume).length,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    await buildUploadedResumeDraft(new File(["王小明"], "產品營運履歷.txt", { type: "text/plain" }), {
      preferLocalFallback: true,
    });

    const body = (fetch.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit | undefined] | undefined)?.[1]?.body;
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("preferLocalFallback")).toBe("true");
  });
});
