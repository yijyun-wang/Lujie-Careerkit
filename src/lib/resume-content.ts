import { z } from "zod";

import { normalizeResumeMonth } from "./resume-date";
import { normalizeResumeTheme, type ResumeThemeInput } from "./resume-theme";
import type { JsonValue, ResumeContent, SerializedResumeSection } from "./types";

export const resumeContentSchema: z.ZodType<ResumeContent> = z.object({
  editor: z.unknown().optional() as z.ZodType<ResumeContent["editor"] | undefined>,
  basics: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    city: z.string(),
    links: z.array(z.string()),
  }),
  profile: z.object({
    title: z.string(),
    summary: z.string(),
  }),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      major: z.string(),
      start: z.string(),
      end: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      logo: z.string().optional(),
      start: z.string(),
      end: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  internships: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      logo: z.string().optional(),
      start: z.string(),
      end: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      logo: z.string().optional(),
      highlights: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  awards: z.array(z.string()),
  customSections: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
  selfReview: z.string(),
});

type SectionKey = "profile" | "selfReview" | "education" | "experiences" | "internships" | "projects" | "skills" | "awards";

const headingMatchers: Array<[SectionKey, RegExp]> = [
  ["profile", /^(個人總結|個人優勢|職業概述|應徵職務|profile|summary|objective)$/i],
  ["selfReview", /^(自我評價|self[- ]?(?:evaluation|review))$/i],
  ["education", /^(教育背景|教育經歷|教育|education)$/i],
  ["experiences", /^(工作經歷|工作經驗|全職經歷|professional experience|work experience|experience)$/i],
  ["internships", /^(實習經歷|實習經驗|internship|internships)$/i],
  ["projects", /^(專案經歷|專案經驗|專案|projects?)$/i],
  ["skills", /^(技能特長|專業技能|技能|技術棧|skills?|technical skills)$/i],
  ["awards", /^(榮譽獎項|獲獎經歷|證書|資格證書|獎項|awards?|certifications?)$/i],
];

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?86[-\s]?)?1[3-9]\d{9}|(?:\+\d{1,3}[-\s]?)?\d{3,4}[-\s]?\d{6,8}/;
const layoutNoisePattern = /[🟥🟧🟨🟩🟦🟪🟫⬛⬜🔴🔵⚫⚪■□▪▫●○◦◆◇▶▷►▸▹]/gu;

export function isResumeContentLike(value: unknown): value is ResumeContent {
  return resumeContentSchema.safeParse(value).success;
}

export const resumeContentInputSchema = z
  .custom<ResumeContent>(isResumeContentLike, { message: "Invalid resume content." })
  .transform((content) => normalizeResumeContent(content));

export function coerceResumeContent(value: unknown, fallbackName = "未命名履歷"): ResumeContent {
  const resume = toRecord(value);
  const basics = toRecord(resume.basics);
  const profile = toRecord(resume.profile);

  return resumeContentSchema.parse(
    normalizeResumeContent(
      {
        basics: {
          name: text(basics.name) || text(resume.name),
          email: text(basics.email) || text(resume.email),
          phone: text(basics.phone) || text(resume.phone),
          city: text(basics.city) || text(resume.city),
          links: textList(basics.links),
        },
        profile: {
          title: text(profile.title),
          summary: text(profile.summary),
        },
        education: itemList(resume.education).map((item) => ({
          school: text(item.school) || text(item.institution),
          degree: text(item.degree),
          major: text(item.major) || text(item.field),
          start: text(item.start) || text(item.startDate),
          end: text(item.end) || text(item.endDate),
          highlights: textList(item.highlights),
        })),
        experiences: workItemList(resume.experiences),
        internships: workItemList(resume.internships),
        projects: itemList(resume.projects).map((item) => ({
          name: text(item.name) || text(item.title),
          role: text(item.role) || text(item.description),
          logo: logo(item.logo),
          highlights: textList(item.highlights),
        })),
        skills: textList(resume.skills),
        awards: textList(resume.awards),
        customSections: itemList(resume.customSections).map((item) => ({
          title: text(item.title) || text(item.name),
          content: text(item.content) || text(item.description) || textList(item.items).join("\n"),
        })),
        selfReview: text(resume.selfReview),
      },
      fallbackName,
    ),
  );
}

export function resumeContentFromText(fileName: string, text: string): ResumeContent {
  const normalized = normalizeText(text);
  const sections = splitSections(normalized);
  const fallbackName = fileName.replace(/\.[^.]+$/, "");
  const contactLines = sections.general.filter(isContactLine);
  const identityLines = sections.general.filter((line) => line && !isContactLine(line));
  const profileText = compactLines(sections.profile.length ? sections.profile : identityLines.slice(1, 4));

  return normalizeResumeContent(
    {
      basics: {
        name: inferName(identityLines, fallbackName),
        email: firstMatch(normalized, emailPattern),
        phone: firstMatch(normalized, phonePattern),
        city: inferCity(contactLines.join(" ")),
        links: unique(cleanList(normalized.match(/https?:\/\/[^\s,，；;]+/g) ?? [])),
      },
      profile: {
        title: inferProfileTitle(identityLines),
        summary: profileText,
      },
      education: parseEducation(sections.education),
      experiences: parseWorkItems(sections.experiences),
      internships: parseWorkItems(sections.internships),
      projects: parseProjects(sections.projects),
      skills: parseSkills(sections.skills),
      awards: parseAwards(sections.awards),
      selfReview: compactLines(sections.selfReview),
    },
    fallbackName,
  );
}

export function normalizeResumeContent(content: ResumeContent, fallbackName = "未命名履歷"): ResumeContent {
  const contacts = normalizeContacts(content.basics.email, content.basics.phone);
  return {
    ...content,
    editor: normalizeEditorSettings(content.editor),
    basics: {
      name: clean(content.basics.name) || fallbackName,
      email: contacts.email,
      phone: contacts.phone,
      city: clean(content.basics.city),
      links: unique(cleanList(content.basics.links)),
    },
    profile: {
      title: clean(content.profile.title),
      summary: clean(content.profile.summary),
    },
    education: content.education.map((item) => ({
      school: clean(item.school),
      degree: clean(item.degree),
      major: clean(item.major),
      start: normalizeResumeMonth(clean(item.start)),
      end: normalizeResumeMonth(clean(item.end)),
      highlights: cleanList(item.highlights),
    })).filter((item) => item.school || item.major || item.highlights.length),
    experiences: normalizeWorkList(content.experiences),
    internships: normalizeWorkList(content.internships),
    projects: content.projects.map((item) => ({
      name: clean(item.name),
      role: clean(item.role),
      logo: logo(item.logo),
      highlights: cleanList(item.highlights),
    })).filter((item) => item.name || item.role || item.highlights.length),
    skills: unique(cleanList(content.skills)),
    awards: cleanList(content.awards),
    customSections: (content.customSections ?? [])
      .map((item) => ({
        title: clean(item.title),
        content: normalizeMultilineText(item.content),
      }))
      .filter((item) => item.title && item.content),
    selfReview: clean(content.selfReview),
  };
}

const RESUME_INTERNAL_METADATA_KEYS = [
  "_tailoringBaseResume",
  "_optimizationMeta",
  "_optimizationStages",
] as const;

export function preserveResumeInternalMetadata(content: ResumeContent, source: ResumeContent): ResumeContent {
  const next = { ...content } as ResumeContent & Record<string, unknown>;
  const sourceRecord = source as ResumeContent & Record<string, unknown>;
  for (const key of RESUME_INTERNAL_METADATA_KEYS) {
    if (sourceRecord[key] !== undefined) next[key] = sourceRecord[key];
  }
  return next;
}

function normalizeEditorSettings(value: unknown): ResumeContent["editor"] {
  const editor = toRecord(value);
  if (!Object.keys(editor).length) return undefined;
  const theme = toRecord(editor.themeConfig);
  const sections = normalizeEditorSections(editor.sections);
  return {
    ...(typeof editor.displayName === "string" ? { displayName: editor.displayName } : {}),
    ...(typeof editor.template === "string" ? { template: editor.template } : {}),
    ...(Object.keys(theme).length ? { themeConfig: normalizeResumeTheme(theme as ResumeThemeInput) } : {}),
    ...(sections ? { sections } : {}),
  };
}

function normalizeEditorSections(value: unknown): SerializedResumeSection[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const sections = value.flatMap((item, index) => {
    const section = toRecord(item);
    const type = typeof section.type === "string" ? section.type.trim() : "";
    if (!type || !isRecord(section.content)) return [];
    return [{
      id: typeof section.id === "string" ? section.id : "",
      resumeId: typeof section.resumeId === "string" ? section.resumeId : "",
      type,
      title: typeof section.title === "string" ? section.title : type,
      sortOrder: typeof section.sortOrder === "number" && Number.isFinite(section.sortOrder)
        ? section.sortOrder
        : index,
      visible: section.visible !== false,
      content: section.content as JsonValue,
      createdAt: typeof section.createdAt === "string" ? section.createdAt : "",
      updatedAt: typeof section.updatedAt === "string" ? section.updatedAt : "",
    }];
  });
  return sections.length || value.length === 0 ? sections : undefined;
}

function normalizeContacts(rawEmail: string, rawPhone: string) {
  const combined = `${rawPhone} ${rawEmail}`;
  const emailMatch = combined.match(emailPattern)?.[0] ?? "";
  const phoneMatch = combined.match(phonePattern)?.[0] ?? "";
  const splitQq = splitPhonePrefixedQqEmail(emailMatch);

  return {
    email: splitQq.email || emailMatch,
    phone: clean(rawPhone).replace(emailPattern, "").trim() || splitQq.phone || phoneMatch,
  };
}

function splitPhonePrefixedQqEmail(email: string) {
  const match = email.match(/^(1[3-9]\d{9})(\d{5,})@(qq\.com)$/i);
  if (!match) return { phone: "", email: "" };
  return { phone: match[1], email: `${match[2]}@${match[3]}` };
}

function normalizeWorkList(items: ResumeContent["experiences"]) {
  return items.map((item) => ({
    company: clean(item.company),
    role: clean(item.role),
    logo: logo(item.logo),
    start: normalizeResumeMonth(clean(item.start)),
    end: normalizeResumeMonth(clean(item.end)),
    highlights: cleanList(item.highlights),
  })).filter((item) => item.company || item.role || item.highlights.length);
}

function workItemList(value: unknown): ResumeContent["experiences"] {
  return itemList(value).map((item) => ({
    company: text(item.company),
    role: text(item.role) || text(item.position),
    logo: logo(item.logo),
    start: text(item.start) || text(item.startDate),
    end: text(item.end) || text(item.endDate),
    highlights: textList(item.highlights),
  }));
}

function itemList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map(toRecord).filter((item) => Object.keys(item).length > 0);
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const single = text(value);
  return single ? [single] : [];
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const orderedKeys = ["name", "title", "label", "text", "award", "certificate", "issuer", "organization", "date", "level", "content", "description", "summary"];
  const orderedText = orderedKeys.map((key) => text(record[key])).filter(Boolean);
  return (orderedText.length ? orderedText : Object.values(record).map(text).filter(Boolean)).join(" ");
}

function logo(value: unknown): string | undefined {
  const raw = text(value);
  return /^data:image\/(?:png|jpe?g|webp);base64,/i.test(raw) || /^icon:(?:building|briefcase|code|cpu|chart|palette|rocket|users|landmark|graduation-cap|book-open|trophy|shield-check|globe|mail|phone)$/i.test(raw) ? raw : undefined;
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function splitSections(text: string) {
  const sections: Record<SectionKey, string[]> = {
    profile: [],
    selfReview: [],
    education: [],
    experiences: [],
    internships: [],
    projects: [],
    skills: [],
    awards: [],
  };
  const general: string[] = [];
  let current: SectionKey | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const heading = getHeading(line);
    if (heading) {
      current = heading;
      continue;
    }
    if (current) sections[current].push(line);
    else general.push(line);
  }

  return { ...sections, general: general.filter(Boolean) };
}

function getHeading(line: string): SectionKey | null {
  const normalized = line.replace(/^#+\s*/, "").replace(/[:：\s]+$/, "").trim();
  if (!normalized || normalized.length > 40) return null;
  return headingMatchers.find(([, matcher]) => matcher.test(normalized))?.[0] ?? null;
}

function parseEducation(lines: string[]): ResumeContent["education"] {
  return splitBlocks(lines).map((block) => {
    const header = block[0] ?? "";
    const range = extractDateRange(header);
    const parts = splitHeader(header.replace(range.raw, ""));
    return {
      school: parts[0] ?? "",
      degree: parts.find((part) => /學士|碩士|博士|專科|大學部|master|bachelor|phd/i.test(part)) ?? "",
      major: parts.slice(1).filter((part) => !/學士|碩士|博士|專科|大學部|master|bachelor|phd/i.test(part)).join(" "),
      start: range.start,
      end: range.end,
      highlights: block.slice(1).map(cleanBullet).filter(Boolean),
    };
  }).filter((item) => item.school || item.highlights.length);
}

function parseWorkItems(lines: string[]): ResumeContent["experiences"] {
  return splitBlocks(lines).map((block) => {
    const header = block[0] ?? "";
    const range = extractDateRange(header);
    const parts = splitHeader(header.replace(range.raw, ""));
    return {
      company: parts[0] ?? "",
      role: parts.slice(1).join(" "),
      start: range.start,
      end: range.end,
      highlights: block.slice(1).map(cleanBullet).filter(Boolean),
    };
  }).filter((item) => item.company || item.role || item.highlights.length);
}

function parseProjects(lines: string[]): ResumeContent["projects"] {
  return splitBlocks(lines).map((block) => {
    const header = block[0] ?? "";
    const parts = splitHeader(header.replace(extractDateRange(header).raw, ""));
    return {
      name: parts[0] ?? "",
      role: parts.slice(1).join(" "),
      highlights: block.slice(1).map(cleanBullet).filter(Boolean),
    };
  }).filter((item) => item.name || item.role || item.highlights.length);
}

function parseSkills(lines: string[]) {
  return unique(
    lines
      .join("、")
      .split(/[、,，;；|]/)
      .map(cleanBullet)
      .filter((item) => item.length > 1),
  );
}

function parseAwards(lines: string[]) {
  return lines.flatMap((line) => line.split(/[;；]/)).map(cleanBullet).filter(Boolean);
}

function splitBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines.map((item) => item.trim())) {
    if (!line) {
      if (current.length) blocks.push(current);
      current = [];
      continue;
    }
    const startsNewBlock = current.length > 0 && !isBulletLine(line) && (extractDateRange(line).raw || splitHeader(line).length > 1);
    if (startsNewBlock) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);
  return blocks;
}

function extractDateRange(value: string) {
  const match = value.match(/((?:19|20)\d{2}(?:[./-]\d{1,2})?)\s*(?:-|~|—|–|至|到)\s*((?:19|20)\d{2}(?:[./-]\d{1,2})?|至今|現在|present|now)/i);
  return {
    raw: match?.[0] ?? "",
    start: match?.[1] ?? "",
    end: match?.[2] ?? "",
  };
}

function splitHeader(value: string) {
  return value
    .split(/\s{2,}|[|｜]/)
    .map(clean)
    .filter(Boolean);
}

function inferName(lines: string[], fallbackName: string) {
  return lines.find((line) => line.length <= 24 && !/[：:]/.test(line)) ?? fallbackName;
}

function inferProfileTitle(lines: string[]) {
  const titleLine = lines.find((line) => /(應徵職務|希望職稱|希望職務|求職意向|目標職缺|應聘職缺|求职意向)[:：]/.test(line)) ?? lines[1] ?? "";
  return titleLine.replace(/^(應徵職務|希望職稱|希望職務|求職意向|目標職缺|應聘職缺|求职意向)[:：]\s*/, "").trim();
}

function inferCity(text: string) {
  return firstMatch(text, /((?:台|臺)北|新北|桃園|新竹|苗栗|(?:台|臺)中|彰化|南投|雲林|嘉義|(?:台|臺)南|高雄|屏東|基隆|宜蘭|花蓮|(?:台|臺)東|澎湖|金門|馬祖|東京|大阪|香港|新加坡|上海|北京|深圳)/);
}

function firstMatch(text: string, matcher: RegExp) {
  return text.match(matcher)?.[0] ?? "";
}

function isContactLine(line: string) {
  return /@|電話|手機|電子郵件|e-?mail|LINE ?ID|微信|地址|現居|居住地|https?:\/\//i.test(line);
}

function isBulletLine(line: string) {
  return /^[-*•·●▪]/.test(line) || /^\d+[.)、]\s+/.test(line);
}

function cleanBullet(value: string) {
  return clean(value.replace(/^[-*•·●▪]\s*/, "").replace(/^\d+[.)、]\s+/, ""));
}

function cleanList(values: string[]) {
  return values.map(clean).filter(Boolean);
}

function compactLines(lines: string[]) {
  return clean(lines.filter(Boolean).map(cleanBullet).join("\n"));
}

function clean(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(layoutNoisePattern, " ")
    .replace(/^[\s•·●○◦▪▫■□◆◇▶▷►▸▹-]+/, "")
    .replace(/(?:^|\s)(?:\d{1,2}[.)、]|[（(]\d{1,2}[)）])\s+/g, " ")
    .replace(/^[\s•·●○◦▪▫■□◆◇▶▷►▸▹-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMultilineText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map(clean)
    .join("\n")
    .trim();
}

function normalizeText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
