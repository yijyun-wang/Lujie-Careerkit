import { describe, expect, it } from "vitest";

import type { ResumeContent } from "./types";
import {
  buildAutomaticResumeTitle,
  resolveResumeContentTitle,
  shouldAutoRenameResumeTitle,
} from "./resume-naming";

function createResume(name: string, displayName?: string): ResumeContent {
  return {
    editor: displayName ? { displayName } : undefined,
    basics: { name, email: "", phone: "", city: "", links: [] },
    profile: { title: "", summary: "" },
    education: [],
    experiences: [],
    internships: [],
    projects: [],
    skills: [],
    awards: [],
    selfReview: "",
  };
}

describe("resume naming", () => {
  it("builds the default resume title from the person's name", () => {
    expect(buildAutomaticResumeTitle(" 林澤宇 ")).toBe("林澤宇的履歷");
    expect(buildAutomaticResumeTitle("")).toBe("未命名履歷");
  });

  it("replaces an untitled display name with the person's name", () => {
    expect(resolveResumeContentTitle(createResume("林澤宇", "未命名履歷"))).toBe("林澤宇的履歷");
  });

  it("continues automatic naming when the person's name changes", () => {
    expect(shouldAutoRenameResumeTitle("張三的履歷", "張三")).toBe(true);
  });

  it("does not overwrite a title the user renamed manually", () => {
    expect(shouldAutoRenameResumeTitle("校園徵才技術版", "張三")).toBe(false);
  });
});
