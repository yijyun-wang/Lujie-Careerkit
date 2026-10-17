import { z } from "zod";

import { dateInputSchema } from "./api-request";
import type { JobAnalysis } from "./types";

const analysisTextSchema = z.string().trim().max(2_000);
const analysisListSchema = z.array(analysisTextSchema).max(100);

export const jobAnalysisInputSchema: z.ZodType<JobAnalysis> = z
  .object({
    company: analysisTextSchema,
    title: analysisTextSchema,
    deadline: dateInputSchema.nullable(),
    requirements: analysisListSchema,
    keywords: analysisListSchema,
    bonusPoints: analysisListSchema,
    risks: analysisListSchema,
    suggestions: analysisListSchema,
  })
  .strict();

const KNOWN_KEYWORDS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue",
  "Java",
  "Spring",
  "SQL",
  "Python",
  "機器學習",
  "推薦系統",
  "資料分析",
  "使用者研究",
  "A/B 測試",
  "工程化",
  "效能優化",
  "瀏覽器渲染",
  "網路請求",
];

export function analyzeJobInput(input: string): JobAnalysis {
  const text = input.trim();

  if (!text) {
    return {
      company: "待填寫公司",
      title: "待分析職缺",
      deadline: null,
      requirements: [],
      keywords: [],
      bonusPoints: [],
      risks: ["缺少職缺 JD，無法判斷關鍵字和比對缺口。"],
      suggestions: ["先貼上職缺 JD 或補充工作內容，再進行比對優化。"],
    };
  }

  const deadlineMatch = text.match(/(?:截止|投遞截止|應徵截止|截止日期|ddl|DDL)[:：]?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
  const keywords = KNOWN_KEYWORDS.filter((keyword) =>
    text.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
  );
  const requirementLine = extractSection(text, ["應徵條件", "條件要求", "要求", "職缺條件", "其他條件"]);
  const bonusLine = extractSection(text, ["加分項", "加分條件", "優先", "加分"]);

  return {
    company: "待填寫公司",
    title: "待分析職缺",
    deadline: deadlineMatch?.[1]?.replaceAll("/", "-") ?? null,
    requirements: splitMeaningful(requirementLine || text).slice(0, 5),
    keywords,
    bonusPoints: splitMeaningful(bonusLine).slice(0, 4),
    risks: keywords.length < 3 ? ["關鍵字資訊偏少，建議補充完整 JD 後再生成優化後履歷。"] : [],
    suggestions: buildSuggestions(keywords),
  };
}

function extractSection(text: string, labels: string[]) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const line = lines.find((candidate) => labels.some((label) => candidate.includes(label)));
  return line ?? "";
}

function splitMeaningful(text: string) {
  return text
    .split(/[。；;\n]/)
    .map((item) => item.replace(/^(應徵條件|條件要求|職缺條件|其他條件|要求|加分條件|加分項|優先)[:：]/, "").trim())
    .filter((item) => item.length > 0);
}

function buildSuggestions(keywords: string[]) {
  if (keywords.length === 0) {
    return ["先補充職缺關鍵字，再決定履歷裡哪些專案需要前置。"];
  }

  return [
    `把 ${keywords.slice(0, 3).join("、")} 相關經歷放到專案或技能區前半部分。`,
    "將職責描述改成“動作 + 方法 + 結果”的表達，避免只羅列技術名詞。",
  ];
}
