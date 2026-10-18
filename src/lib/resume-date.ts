const CURRENT_PATTERN = /^(?:至今|迄今|現在|目前|now|present|current)$/i;
const MONTH_PATTERN = /^(\d{4})\s*(?:[-/.年]\s*(\d{1,2})\s*月?)?$/;

export interface ResumeMonth {
  year: string;
  month: string;
}

/** Parses "2024-09", "2024/9", "2024.9", "2024年9月" or "2024" into zero-padded parts. */
export function parseResumeMonth(value: string): ResumeMonth | null {
  const match = MONTH_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, year, rawMonth] = match;
  if (!rawMonth) return { year, month: "" };
  const month = Number(rawMonth);
  if (month < 1 || month > 12) return null;
  return { year, month: String(month).padStart(2, "0") };
}

/** Normalizes a resume date to "YYYY-MM" (or "YYYY"); "present" words become "至今". */
export function normalizeResumeMonth(value: string): string {
  const trimmed = value.trim();
  if (CURRENT_PATTERN.test(trimmed)) return "至今";
  const parsed = parseResumeMonth(trimmed);
  if (!parsed) return trimmed;
  return parsed.month ? `${parsed.year}-${parsed.month}` : parsed.year;
}
