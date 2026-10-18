import { generateText, jsonSchema, Output, type LanguageModel, type ModelMessage } from "ai";
import { z } from "zod";

import { createAiModel, getAiTemperature, supportsJsonSchemaOutput } from "./client";
import { parseAiJsonResponse, runAiObjectTask, toProviderJsonSchema, type AiObjectExecutor, type AiTaskResult } from "./tasks";
import type { EffectiveAiSettings } from "./settings";
import { coerceResumeContent, normalizeResumeContent, resumeContentFromText, resumeContentSchema } from "../resume-content";
import type { ResumeContent } from "../types";

export type ResumeFileGenerator = (input: {
  model: LanguageModel;
  system: string;
  messages: ModelMessage[];
  temperature?: number;
  structuredOutput?: boolean;
}) => Promise<{ text: string }>;

const RESUME_IMPORT_SYSTEM =
  "你是履歷資訊抽取助手，不是履歷優化助手。只做結構識別和欄位歸類，保留原文語義、原句和順序，不要潤色、壓縮、改寫、重排或補寫內容；只擷取正文，不擷取版式符號。只輸出一個合法 JSON 物件，不要 Markdown，不要解釋。";

/**
 * Parse an image or scanned PDF by sending the file to the configured model as a multimodal message.
 * Requires a model that accepts image / PDF input (e.g. OpenAI, Gemini, Claude, or a local vision model).
 */
export async function parseResumeFileWithAi(
  input: { file: File; kind: "image" | "pdf"; settings: EffectiveAiSettings },
  dependencies: { generate?: ResumeFileGenerator; model?: LanguageModel } = {},
): Promise<ResumeContent> {
  if (!input.settings.enabled || (input.settings.requiresApiKey && !input.settings.apiKey)) {
    throw new Error("請先在設定中啟用 AI 並儲存 API Key。");
  }

  const data = new Uint8Array(await input.file.arrayBuffer());
  const mediaType = input.kind === "pdf" ? "application/pdf" : input.file.type || imageMediaType(input.file.name);
  const filePart = input.kind === "pdf"
    ? { type: "file" as const, data, mediaType, filename: input.file.name }
    : { type: "image" as const, image: data, mediaType };
  const generate = dependencies.generate ?? defaultGenerate;
  const result = await generate({
    model: dependencies.model ?? createAiModel(input.settings),
    system: RESUME_IMPORT_SYSTEM,
    messages: [{ role: "user", content: [{ type: "text", text: buildResumeImportPrompt(input.file.name) }, filePart] }],
    temperature: getAiTemperature(input.settings),
    structuredOutput: supportsJsonSchemaOutput(input.settings.providerId),
  });
  if (!result.text.trim()) throw new Error("模型沒有回傳內容，請確認所選模型支援圖片或 PDF 輸入。");
  const baseName = input.file.name.replace(/\.[^.]+$/, "");
  return normalizeResumeContent(coerceResumeContent(parseAiJsonResponse(result.text), baseName), baseName);
}

async function defaultGenerate({ structuredOutput, ...input }: Parameters<ResumeFileGenerator>[0]) {
  const result = await generateText({
    ...input,
    // Same provider-enforced schema as runAiObjectTask; coerceResumeContent still tolerates gaps.
    ...(structuredOutput
      ? { output: Output.object({ schema: jsonSchema(toProviderJsonSchema(z.toJSONSchema(resumeContentSchema))) }) }
      : {}),
  });
  return { text: result.text };
}

function imageMediaType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

export async function parseResumeTextWithAi(
  input: { fileName: string; text: string; settings: EffectiveAiSettings },
  dependencies: { generateObject?: AiObjectExecutor } = {},
): Promise<AiTaskResult<ResumeContent>> {
  const fallback = resumeContentFromText(input.fileName, input.text);
  const result = await runAiObjectTask({
    settings: input.settings,
    schema: resumeContentSchema,
    system:
      "你是履歷資訊抽取助手，不是履歷優化助手。只做結構識別和欄位歸類，保留原文語義、原句和順序；不得潤色、補寫、壓縮、重排或編造內容。",
    prompt: `${buildResumeImportPrompt(input.fileName)}\n\n以下是從 PDF 或 Word 提取出的履歷文本：\n\n${input.text}`,
    fallback,
    taskLabel: "履歷文本結構化",
  }, dependencies);

  return {
    ...result,
    data: normalizeResumeContent(result.data, input.fileName.replace(/\.[^.]+$/, "")),
  };
}

function buildResumeImportPrompt(fileName: string) {
  return [
    `請解析檔案「${fileName}」，把它轉換成錄階 ResumeContent JSON。`,
    "重要：這是“匯入並還原履歷”，不是“優化履歷”。請保留使用者原句、原有小標題和原順序；不要把專案符號、列表編號、裝飾線、頁首頁尾、頁碼等版式元素當作正文。",
    "",
    "欄位要求：",
    "- basics.name/email/phone/city/links：候選人的基礎資訊，沒有就填空字串或空陣列。電話和電子郵件必須分開，email 只能是電子郵件地址，phone 只能是電話號碼；不要把手機號碼和電子郵件黏在一起。",
    "- profile.title：應徵職務或目標職缺，沒有就填空字串。",
    "- profile.summary：只放原履歷明確標為個人總結、個人簡介、個人優勢、職業概述或求職概述的原文；不要放自我評價。",
    "- education：教育背景。school/degree/major/start/end/highlights 必須存在。",
    "- experiences：正式工作經歷。company/role/start/end/highlights 必須存在。",
    "- internships：實習經歷。company/role/start/end/highlights 必須存在。",
    "- start/end 日期一律寫成 YYYY-MM（例如 2004/9 寫成 2004-09），只有年份時寫 YYYY；仍在職或在學時 end 填「至今」。",
    "- projects：專案經歷。name/role/highlights 必須存在。highlights 必須保留原履歷 bullet 後面的正文和原順序，不要合併、刪減、潤色或重新排序。",
    "- skills：僅放“技能/專業技能/技術棧”等明確技能欄中的短關鍵字陣列；不要把“主要優勢與技能認證”“個人優勢”“作品說明”等使用者自訂標題整段拆進 skills。",
    "- awards：證書、獎項、榮譽陣列。",
    "- customSections：使用者自訂標題模組。凡是標題不能穩定對映到 education/experiences/internships/projects/skills/awards/profile 的，都放這裡，title 保留原標題，content 保留該標題下的原文。",
    "- selfReview：只放原履歷明確標為自我評價或 Self Evaluation 的原文；不要與 profile.summary 重複。沒有就填空字串。",
    "",
    "分類規則：",
    "- 實習經歷不要放進 experiences，放進 internships。",
    "- 專案經歷不要放進工作經歷，放進 projects。",
    "- 使用者已經寫好的小標題和 bullet 順序必須保留，不要為了看起來更像模板而拆散。",
    "- 時間保留原文格式，例如 2022.09、2024-06、至今。",
    "- 所有欄位都必須來自檔案內容；無法確認的資訊不要猜。",
    "- 如果原文是“從0到1產品架構設計/模型落地與迭代/跨團隊協作/取得成果”這樣的專案內小標題，保留這些小標題和其後的原文，不要改成新的短句。",
    "",
    "只返回 JSON，結構必須完全符合這個形狀：",
    JSON.stringify({
      basics: { name: "", email: "", phone: "", city: "", links: [] },
      profile: { title: "", summary: "" },
      education: [{ school: "", degree: "", major: "", start: "", end: "", highlights: [] }],
      experiences: [{ company: "", role: "", start: "", end: "", highlights: [] }],
      internships: [{ company: "", role: "", start: "", end: "", highlights: [] }],
      projects: [{ name: "", role: "", highlights: [] }],
      skills: [],
      awards: [],
      customSections: [{ title: "", content: "" }],
      selfReview: "",
    }, null, 2),
  ].join("\n");
}
