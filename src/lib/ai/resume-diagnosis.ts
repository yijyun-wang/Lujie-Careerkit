import { z } from "zod";

import type { ResumeContent } from "../types";

export const resumeDiagnosisSectionSchema = z.enum([
  "summary",
  "education",
  "experiences",
  "internships",
  "projects",
  "skills",
  "awards",
  "customSections",
  "overall",
]);

export const resumeDiagnosisIssueSchema = z.object({
  id: z.string().trim().min(1).max(80),
  section: resumeDiagnosisSectionSchema,
  location: z.string().trim().min(1).max(120),
  severity: z.enum(["high", "medium", "low"]),
  action: z.enum(["ai-edit", "user-input", "user-confirm"]).optional(),
  category: z.enum(["action-result", "evidence", "clarity", "structure", "relevance"]),
  title: z.string().trim().min(1).max(120),
  evidence: z.string().trim().max(500),
  explanation: z.string().trim().min(1).max(600),
  suggestion: z.string().trim().min(1).max(600),
});

export const resumeDiagnosisSchema = z.object({
  summary: z.string().trim().min(1).max(800),
  strengths: z.array(z.string().trim().min(1).max(300)).max(6),
  issues: z.array(resumeDiagnosisIssueSchema).max(12),
}).refine(
  (diagnosis) => new Set(diagnosis.issues.map((issue) => issue.id)).size === diagnosis.issues.length,
  { message: "Diagnosis issue IDs must be unique.", path: ["issues"] },
);

export const resumeOptimizationPreferenceSchema = z.enum([
  "clarity",
  "impact",
  "concise",
  "ats",
]);

export type ResumeDiagnosis = z.infer<typeof resumeDiagnosisSchema>;
export type ResumeDiagnosisIssue = z.infer<typeof resumeDiagnosisIssueSchema>;
export type ResumeOptimizationPreference = z.infer<typeof resumeOptimizationPreferenceSchema>;

export function isAiEditableResumeIssue(issue: ResumeDiagnosisIssue) {
  return issue.action !== "user-confirm" && issue.action !== "user-input";
}

export function normalizeResumeDiagnosis(
  diagnosis: ResumeDiagnosis,
  resume: ResumeContent,
): ResumeDiagnosis {
  return {
    ...diagnosis,
    issues: diagnosis.issues
      .filter((issue) => !isFalseMissingSummaryIssue(issue, resume))
      .map((issue) => ({
        ...issue,
        action: issueNeedsUserConfirmation(issue)
          ? "user-confirm"
          : issueNeedsUserInput(issue)
            ? "user-input"
            : "ai-edit",
      })),
  };
}

function isFalseMissingSummaryIssue(issue: ResumeDiagnosisIssue, resume: ResumeContent) {
  if (issue.section !== "summary" || !resume.selfReview.trim()) return false;
  const text = `${issue.location} ${issue.title} ${issue.evidence} ${issue.explanation} ${issue.suggestion}`;
  return /(?:未提供|缺失|缺少|不存在|為空|missing|not provided|lacks?).{0,32}(?:profile\.summary|profile summary|個人總結|個人簡介|開篇簡介|求職摘要)|(?:profile\.summary|profile summary|個人總結|個人簡介|開篇簡介|求職摘要).{0,32}(?:未提供|缺失|缺少|不存在|為空|missing|not provided|lacks?)/i.test(text);
}

function issueNeedsUserConfirmation(issue: ResumeDiagnosisIssue) {
  const text = `${issue.title} ${issue.evidence} ${issue.explanation} ${issue.suggestion}`;
  const gpa = issue.evidence.match(/(?:GPA|績點)?\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/i);
  if (gpa && Number(gpa[1]) > Number(gpa[2])) return true;
  return issue.action === "user-confirm"
    && /GPA|績點|日期衝突|時間衝突|日期矛盾|時間矛盾|電子郵件有誤|電話有誤|畢業時間|date conflict|incorrect (?:email|phone)/i.test(text);
}

function issueNeedsUserInput(issue: ResumeDiagnosisIssue) {
  if (issue.evidence.trim()) return false;
  if (issue.action === "user-input") return true;
  const text = `${issue.title} ${issue.explanation} ${issue.suggestion}`;
  return /缺少|未填寫|未提供|為空|需要補充|missing|not provided|lacks?/i.test(text)
    && /課程|排名|技能|量化|資料|數字|指標|結果|技術細節|證書|獎項|個人總結|個人簡介|profile summary/i.test(text);
}
