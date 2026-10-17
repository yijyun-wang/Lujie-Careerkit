import type { JobAnalysis, ResumeContent } from "./types";

type BuildTailoredResumeVersionInput = {
  masterResume: ResumeContent;
  job: {
    id: string;
    company: string;
    title: string;
  };
  analysis: JobAnalysis;
};

const OPTIMIZED_RESUME_PREFIX = "JD比對優化-";

export function buildTailoredResumeVersion({
  masterResume,
  job,
  analysis,
}: BuildTailoredResumeVersionInput) {
  const content = structuredClone(masterResume);
  const keywords = analysis.keywords.slice(0, 5);
  const keywordText = keywords.join("、") || "職缺相關能力";
  const originalSummary = content.profile.summary.trim();

  content.profile.summary =
    originalSummary ||
    `本版本僅基於原履歷已有內容調整表達重點，面向 ${job.company}${job.title} 優先呈現 ${keywordText} 相關資訊。`;

  content.skills = reorderByKeywords(content.skills, keywords);

  return {
    id: `rv-${job.id}-${Date.now()}`,
    jobId: job.id,
    name: buildOptimizedResumeVersionName(masterResume, job.title),
    summary: `圍繞 ${keywordText} 調整了摘要和已有技能排序。${
      analysis.suggestions[0] ? ` ${analysis.suggestions[0]}` : ""
    }`,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function buildOptimizedResumeVersionName(resume: ResumeContent, jobTitle: string) {
  const displayName = resume.editor?.displayName?.trim().replace(/的履歷$/, "") ?? "";
  const resumeName = resume.basics.name.trim() || displayName;
  const cleanJobTitle = jobTitle.trim();
  const nameParts = [resumeName || "未命名履歷", cleanJobTitle || "未命名職缺"];
  return `${OPTIMIZED_RESUME_PREFIX}${nameParts.join("-")}`;
}

export function normalizeOptimizedResumeVersionName(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return `${OPTIMIZED_RESUME_PREFIX}未命名履歷-未命名職缺`;
  if (cleanName.startsWith(OPTIMIZED_RESUME_PREFIX)) return cleanName;
  return `${OPTIMIZED_RESUME_PREFIX}${cleanName.replace(/^JD比對優化：/, "").replace(/\s*客製版\s*$/, "").trim()}`;
}

function reorderByKeywords(skills: string[], keywords: string[]) {
  if (!keywords.length) return skills;
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  return [...skills].sort((left, right) => {
    const leftRank = getKeywordRank(left, normalizedKeywords);
    const rightRank = getKeywordRank(right, normalizedKeywords);
    return leftRank - rightRank;
  });
}

function getKeywordRank(skill: string, normalizedKeywords: string[]) {
  const normalizedSkill = skill.toLowerCase();
  const rank = normalizedKeywords.findIndex((keyword) => normalizedSkill.includes(keyword));
  return rank === -1 ? Number.POSITIVE_INFINITY : rank;
}
