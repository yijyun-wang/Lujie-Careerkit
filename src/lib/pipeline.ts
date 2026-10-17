import type { ApplicationStatus } from "./types";

export const applicationStatusDateLabels: Record<ApplicationStatus, string> = {
  APPLIED: "投遞日期",
  ASSESSMENT: "筆試 / 線上測驗日期",
  INTERVIEW: "面試日期",
  OFFER: "Offer 日期",
  REJECTED: "拒絕日期",
  ARCHIVED: "歸檔日期",
};

export const visiblePipelineStatuses = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ARCHIVED",
] as const satisfies ApplicationStatus[];

export const pipelineStatusLabels: Record<(typeof visiblePipelineStatuses)[number], string> = {
  APPLIED: "已投遞",
  ASSESSMENT: "筆試 / 線上測驗",
  INTERVIEW: "面試中",
  OFFER: "Offer",
  REJECTED: "拒絕",
  ARCHIVED: "歸檔",
};

export const companySuggestions = [
  "台積電",
  "聯發科",
  "鴻海",
  "廣達",
  "緯創",
  "英業達",
  "華碩",
  "宏碁",
  "瑞昱",
  "聯詠",
  "研華",
  "台達電",
  "趨勢科技",
  "中華電信",
  "Google 台灣",
  "Microsoft 台灣",
  "NVIDIA 台灣",
  "AMD 台灣",
  "LINE 台灣",
  "Appier",
  "蝦皮購物",
  "91APP",
];

export const applicationSourceOptions = [
  "104人力銀行",
  "1111人力銀行",
  "CakeResume",
  "Yourator",
  "LinkedIn",
  "獵頭",
  "企業官網",
  "內部推薦",
  "電子郵件",
  "其他",
];

type VisiblePipelineStatus = (typeof visiblePipelineStatuses)[number];

type PipelineApplicationInput = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  nextFollowUpAt: string | null;
  appliedAt?: string | null;
  stageDate?: string | null;
};

type PipelineJobInput = {
  id: string;
  source: string;
  deadline: string | null;
};

type ApplicationTimelineInput = {
  status: ApplicationStatus;
  appliedAt: string | null;
  updatedAt?: string;
};

export type ApplicationTimelineItem = {
  key: string;
  status: ApplicationStatus;
  date: string | null;
  label: string;
  tone: "done" | "current" | "future" | "win" | "terminal";
};

export const interviewPipelineStatuses = ["INTERVIEW"] as const satisfies ApplicationStatus[];
export const activePipelineStatuses = ["APPLIED", "ASSESSMENT", ...interviewPipelineStatuses] as const satisfies ApplicationStatus[];

const applicationJourneyStatuses = ["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER"] as const satisfies ApplicationStatus[];

export function chunkPipelineStatuses(size = 3): VisiblePipelineStatus[][] {
  const rows: VisiblePipelineStatus[][] = [];
  for (let index = 0; index < visiblePipelineStatuses.length; index += size) {
    rows.push(visiblePipelineStatuses.slice(index, index + size));
  }
  return rows;
}

export function isVisiblePipelineStatus(status: ApplicationStatus): status is VisiblePipelineStatus {
  return visiblePipelineStatuses.includes(status as VisiblePipelineStatus);
}

export function isActivePipelineStatus(status: ApplicationStatus) {
  return activePipelineStatuses.includes(status as (typeof activePipelineStatuses)[number]);
}

export function getApplicationDueDate(
  application: Pick<PipelineApplicationInput, "status" | "nextFollowUpAt" | "appliedAt" | "stageDate">,
  today = new Date(),
) {
  if (!isActivePipelineStatus(application.status)) return null;
  const dueDate = getApplicationActionDate(application);
  if (!dueDate) return null;
  return dateTime(dueDate) <= today.getTime() ? dueDate : null;
}

export function getApplicationActionDate(
  application: Pick<PipelineApplicationInput, "status" | "nextFollowUpAt" | "appliedAt" | "stageDate">,
) {
  if (!isActivePipelineStatus(application.status)) return null;
  if (application.nextFollowUpAt) return application.nextFollowUpAt;
  if (application.status === "APPLIED") {
    return defaultNextFollowUpDate(application.appliedAt ?? application.stageDate ?? "") || null;
  }
  return application.stageDate ?? (defaultNextFollowUpDate(application.appliedAt ?? "") || null);
}

export function defaultNextFollowUpDate(appliedAt: string, days = 7) {
  if (!appliedAt) return "";
  const [year, month, day] = appliedAt.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function normalizeApplicationSource(source?: string) {
  const value = source?.trim();
  if (!value || value === "手動錄入" || value === "官網" || value === "企業官網") return "企業官網";
  if (applicationSourceOptions.includes(value)) return value;
  const lower = value.toLowerCase();
  if (lower === "104" || value === "104人力") return "104人力銀行";
  if (lower === "1111" || value === "1111人力") return "1111人力銀行";
  if (lower === "cake" || lower === "cakeresume") return "CakeResume";
  if (lower === "yourator") return "Yourator";
  if (lower === "linkedin" || value === "領英") return "LinkedIn";
  if (value === "獵人頭" || value === "人力仲介") return "獵頭";
  if (value === "郵件" || lower === "email") return "電子郵件";
  return "其他";
}

export function buildApplicationTimeline(input: ApplicationTimelineInput): ApplicationTimelineItem[] {
  const isTerminal = input.status === "REJECTED" || input.status === "ARCHIVED";
  const statuses: ApplicationStatus[] = isTerminal
    ? ["APPLIED", "ASSESSMENT", "INTERVIEW", input.status]
    : [...applicationJourneyStatuses];
  const currentIndex = applicationJourneyStatuses.indexOf(input.status as (typeof applicationJourneyStatuses)[number]);

  return statuses.map((status, index) => ({
    key: status,
    status,
    date: getTimelineStepDate(input, status),
    label: isVisiblePipelineStatus(status) ? pipelineStatusLabels[status] : "當前階段",
    tone: getTimelineStepTone({
      status,
      index,
      currentIndex,
      terminalStatus: isTerminal ? input.status : null,
      hasAppliedDate: Boolean(input.appliedAt),
    }),
  }));
}

export function buildPipelineOverview(
  input: {
    jobs: PipelineJobInput[];
    applications: PipelineApplicationInput[];
  },
  today = new Date(),
) {
  const visibleApplications = input.applications.filter((application) =>
    isVisiblePipelineStatus(application.status),
  );
  const jobById = new Map(input.jobs.map((job) => [job.id, job]));
  const terminalStatuses = new Set<ApplicationStatus>(["OFFER", "REJECTED", "ARCHIVED"]);
  const total = visibleApplications.length;

  const statusCounts = visiblePipelineStatuses.map((status) => ({
    status,
    label: pipelineStatusLabels[status],
    count: visibleApplications.filter((application) => application.status === status).length,
  }));

  const sourceCountMap = new Map<string, number>();
  for (const application of visibleApplications) {
    const source = normalizeApplicationSource(jobById.get(application.jobId)?.source);
    sourceCountMap.set(source, (sourceCountMap.get(source) ?? 0) + 1);
  }

  const sourceCounts = Array.from(sourceCountMap.entries()).map(([source, count]) => ({ source, count }));
  const active = visibleApplications.filter((application) => isActivePipelineStatus(application.status)).length;
  const terminal = visibleApplications.filter((application) => terminalStatuses.has(application.status)).length;
  const interviewReachedStatuses = new Set<ApplicationStatus>([...interviewPipelineStatuses, "OFFER"]);
  const interviewCount = visibleApplications.filter((application) =>
    interviewReachedStatuses.has(application.status),
  ).length;
  const offerCount = visibleApplications.filter((application) => application.status === "OFFER").length;
  const followUpsDue = visibleApplications.filter((application) => getApplicationDueDate(application, today)).length;

  return {
    total,
    active,
    terminal,
    followUpsDue,
    interviewRate: total > 0 ? Math.round((interviewCount / total) * 100) : 0,
    offerRate: total > 0 ? Math.round((offerCount / total) * 100) : 0,
    statusCounts,
    sourceCounts,
  };
}

function dateTime(value: string) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function getTimelineStepDate(input: ApplicationTimelineInput, status: ApplicationStatus) {
  if (status === "APPLIED") return input.appliedAt;
  if (status === input.status) return input.updatedAt ?? null;
  return null;
}

function getTimelineStepTone({
  status,
  index,
  currentIndex,
  terminalStatus,
  hasAppliedDate,
}: {
  status: ApplicationStatus;
  index: number;
  currentIndex: number;
  terminalStatus: ApplicationStatus | null;
  hasAppliedDate: boolean;
}): ApplicationTimelineItem["tone"] {
  if (terminalStatus && status === terminalStatus) return "terminal";
  if (currentIndex === -1) return status === "APPLIED" && hasAppliedDate ? "done" : "future";
  if (index < currentIndex) return "done";
  if (index === currentIndex) return status === "OFFER" ? "win" : "current";
  return "future";
}
