import { TEMPLATES } from "@/lib/constants";
import { resolveResumeContentTitle } from "@/lib/resume-naming";
import { normalizeOptimizedResumeVersionName } from "@/lib/resume-versioning";
import type { ResumeContent } from "@/lib/types";

export type ResumeLibrarySortMode = "recent" | "recentOptimized";
export type ResumeLibraryCardKind = "原履歷" | "優化後履歷";
export type ResumeLibrarySaveTarget = { kind: "main" } | { kind: "version"; id: string };

export type ResumeLibraryVersion = {
  id: string;
  name: string;
  summary: string;
  content: ResumeContent;
  createdAt: string;
  updatedAt?: string;
  jobId?: string | null;
};

export type ResumeLibraryCard = {
  id: string;
  kind: ResumeLibraryCardKind;
  optimizationKind?: "job" | "general";
  title: string;
  detail: string;
  template: string;
  templateKey: string;
  updatedAt: string;
  updatedAtKind: "edited" | "created" | "editedUnknown" | "createdUnknown";
  updatedAtDate: string;
  timestamp: number;
  content: ResumeContent;
  target: ResumeLibrarySaveTarget;
};

export const resumeTemplateLabels: Record<string, string> = {
  classic: "經典",
  modern: "現代",
  minimal: "極簡",
  professional: "專業",
  "two-column": "雙欄",
  creative: "創意",
  ats: "ATS",
  academic: "學術",
  elegant: "優雅",
  executive: "高管",
  developer: "開發者",
  designer: "設計師",
  startup: "創業",
  formal: "正式",
  infographic: "資訊圖",
  compact: "緊湊",
  euro: "歐式",
  clean: "清爽",
  bold: "醒目",
  timeline: "時間線",
  nordic: "北歐",
  corporate: "企業",
  consultant: "諮詢",
  finance: "金融",
  medical: "醫療",
  gradient: "漸變",
  metro: "都市",
  material: "材料",
  coder: "程式碼",
  blocks: "塊面",
  magazine: "雜誌",
  artistic: "藝術",
  retro: "復古",
  neon: "霓虹",
  watercolor: "水彩",
  swiss: "瑞士",
  japanese: "日式",
  berlin: "柏林",
  luxe: "奢雅",
  rose: "玫瑰",
  architect: "建築",
  legal: "法律",
  teacher: "教師",
  scientist: "科研",
  engineer: "工程師",
  sidebar: "側欄",
  card: "卡片",
  zigzag: "折線",
  ribbon: "絲帶",
  mosaic: "馬賽克",
};

export function buildResumeLibraryCards({
  resume,
  mainResumeUpdatedAt,
  versions,
  search,
  sortMode,
}: {
  resume: ResumeContent;
  mainResumeUpdatedAt?: string;
  versions: ResumeLibraryVersion[];
  search: string;
  sortMode: ResumeLibrarySortMode;
}): ResumeLibraryCard[] {
  const mainTemplate = getValidResumeTemplate(resume.editor?.template);
  const mainCard: ResumeLibraryCard | null = hasResumeContent(resume)
    ? {
        id: "main",
        kind: "原履歷",
        title: buildResumeTitle(resume),
        detail: `${resume.profile.title || "目標職缺待填寫"} · 主履歷`,
        template: resumeTemplateLabels[mainTemplate] ?? "現代",
        templateKey: mainTemplate,
        updatedAt: formatResumeEditedAt(mainResumeUpdatedAt),
        ...formatResumeDateParts(mainResumeUpdatedAt, "edited"),
        timestamp: toTimestamp(mainResumeUpdatedAt),
        content: resume,
        target: { kind: "main" },
      }
    : null;

  const versionCards: ResumeLibraryCard[] = versions.map((version) => {
    const editedAt = version.updatedAt ?? version.createdAt;
    const optimizationKind = getResumeOptimizationKind(version);
    const isOptimized = Boolean(optimizationKind);
    const templateKey = getValidResumeTemplate(version.content.editor?.template);
    return {
      id: version.id,
      kind: isOptimized ? "優化後履歷" : "原履歷",
      optimizationKind,
      title: optimizationKind === "job"
        ? normalizeOptimizedResumeVersionName(version.name)
        : version.name || "未命名原履歷",
      detail: version.summary || (
        optimizationKind === "job"
          ? "基於 JD 生成的職缺優化履歷"
          : optimizationKind === "general"
            ? "經 AI 分析和逐條審閱生成的通用優化履歷"
            : "原履歷版本，可作為優化基準"
      ),
      template: resumeTemplateLabels[templateKey] ?? "現代",
      templateKey,
      updatedAt: version.updatedAt ? formatResumeEditedAt(editedAt) : formatResumeCreatedAt(editedAt),
      ...formatResumeDateParts(editedAt, version.updatedAt ? "edited" : "created"),
      timestamp: toTimestamp(editedAt),
      content: version.content,
      target: { kind: "version", id: version.id },
    };
  });

  const keyword = search.trim().toLowerCase();
  return [mainCard, ...versionCards]
    .filter((card): card is ResumeLibraryCard => Boolean(card))
    .filter((card) => {
      if (!keyword) return true;
      return `${card.title} ${card.detail} ${card.template} ${card.kind}`.toLowerCase().includes(keyword);
    })
    .sort((a, b) => {
      if (sortMode === "recentOptimized") {
        const aOptimized = Boolean(a.optimizationKind);
        const bOptimized = Boolean(b.optimizationKind);
        if (Boolean(aOptimized) !== Boolean(bOptimized)) return aOptimized ? -1 : 1;
      }
      return b.timestamp - a.timestamp;
    });
}

export function buildResumeTitle(content: ResumeContent) {
  return resolveResumeContentTitle(content);
}

export function buildResumeEditorPath(target: ResumeLibrarySaveTarget) {
  return target.kind === "version" ? `/resume/edit?version=${encodeURIComponent(target.id)}` : "/resume/edit";
}

export function getResumeOptimizationKind(
  version: Pick<ResumeLibraryVersion, "jobId" | "content">,
): "job" | "general" | undefined {
  if (version.jobId) return "job";
  const base = (version.content as ResumeContent & { _tailoringBaseResume?: unknown })._tailoringBaseResume;
  return base && typeof base === "object" && !Array.isArray(base) ? "general" : undefined;
}

export function buildResumeCopy(
  content: ResumeContent,
  sourceTitle: string,
  existingTitles: string[],
  copyLabel: string,
) {
  const copy = structuredClone(content) as ResumeContent & {
    _tailoringBaseResume?: unknown;
    _optimizationMeta?: unknown;
    _optimizationStages?: unknown;
  };
  delete copy._tailoringBaseResume;
  delete copy._optimizationMeta;
  delete copy._optimizationStages;

  const suffix = ` - ${copyLabel.trim() || "副本"}`;
  const suffixPattern = new RegExp(`${escapeRegExp(suffix)}(?: \\d+)?$`, "i");
  const rootTitle = (sourceTitle.trim() || resolveResumeContentTitle(copy)).replace(suffixPattern, "");
  const baseTitle = `${rootTitle}${suffix}`;
  const usedTitles = new Set(existingTitles.map((title) => title.trim().toLowerCase()));
  let title = baseTitle;
  for (let index = 2; usedTitles.has(title.toLowerCase()); index += 1) {
    title = `${baseTitle} ${index}`;
  }

  copy.editor = { ...copy.editor, displayName: title };
  return { content: copy, title };
}

export function getValidResumeTemplate(template?: string) {
  return TEMPLATES.includes(template as (typeof TEMPLATES)[number]) ? template! : "modern";
}

export function formatResumeEditedAt(value?: string) {
  return formatResumeDate(value, "最近編輯於", "最近編輯時間未知");
}

function formatResumeCreatedAt(value?: string) {
  return formatResumeDate(value, "創建於", "建立時間未知");
}

function formatResumeDate(value: string | undefined, prefix: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return `${prefix} ${date.toLocaleDateString("zh-TW")}`;
}

function formatResumeDateParts(value: string | undefined, kind: "edited" | "created") {
  if (!value) return { updatedAtKind: `${kind}Unknown` as const, updatedAtDate: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { updatedAtKind: `${kind}Unknown` as const, updatedAtDate: "" };
  return { updatedAtKind: kind, updatedAtDate: date.toISOString() };
}

function toTimestamp(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function hasResumeContent(content: ResumeContent) {
  return Boolean(
    content.basics.name.trim() ||
      content.editor?.displayName?.trim() ||
      content.basics.email.trim() ||
      content.basics.phone.trim() ||
      content.basics.city.trim() ||
      content.profile.title.trim() ||
      content.profile.summary.trim() ||
      content.education.length ||
      content.experiences.length ||
      content.internships.length ||
      content.projects.length ||
      content.skills.length ||
      content.awards.length ||
      content.selfReview.trim(),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
