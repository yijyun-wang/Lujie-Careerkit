import { Buffer } from "node:buffer";

import { parseResumeFileWithAi, parseResumeTextWithAi } from "@/lib/ai/resume-import";
import { getEffectiveAiRuntimeSettings } from "@/lib/repository";
import { extractPdfText, extractWordText } from "@/lib/resume-file-parsers";
import { normalizeResumeContent, resumeContentFromText, isResumeContentLike } from "@/lib/resume-content";
import { getResumeUploadKind } from "@/lib/resume-upload";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VISION_HINT = "圖片或掃描版 PDF 需要在設定中選擇支援圖片／PDF 輸入的模型（例如 OpenAI、Google Gemini、Anthropic Claude，或本機的 Gemma 3 等視覺模型）。";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const preferLocalFallback = formData.get("preferLocalFallback") === "true";
    if (!(file instanceof File)) {
      return Response.json({ error: "請選擇要匯入的履歷檔案。" }, { status: 400 });
    }
    if (file.size === 0) {
      return Response.json({ error: "檔案內容為空。" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "檔案不能超過 10 MB。" }, { status: 413 });
    }

    const kind = getResumeUploadKind(file.name);
    if (!kind) {
      return Response.json({ error: "請上傳 PDF、DOC、DOCX、圖片、TXT、MD 或 JSON 檔案。" }, { status: 415 });
    }

    let plainText = "";
    if (kind === "json" || kind === "text") {
      plainText = (await file.text()).trim();
      if (!plainText) {
        return Response.json({ error: "檔案內容為空。" }, { status: 400 });
      }
    }

    if (kind === "json") {
      try {
        const parsed = JSON.parse(plainText) as unknown;
        if (isResumeContentLike(parsed)) {
          return ok(file.name, normalizeResumeContent(parsed, file.name.replace(/\.[^.]+$/, "")), "local-json");
        }
      } catch {
        // 非標準 JSON 繼續交給 AI 嘗試整理。
      }
    }

    const settings = await getEffectiveAiRuntimeSettings();

    if (preferLocalFallback) {
      const local = await localFallback(file, kind, plainText, "已使用本機規則解析，欄位歸類效果可能不佳。");
      if (local) return local;
      return Response.json({ error: VISION_HINT }, { status: 422 });
    }

    if (kind !== "image") {
      const text = await extractLocalText(file, kind, plainText);
      if (text) {
        const result = await parseResumeTextWithAi({ fileName: file.name, text, settings });
        return ok(
          file.name,
          result.data,
          result.source === "ai" ? "ai-text" : "local-fallback",
          result.message,
        );
      }
      if (kind !== "pdf") {
        return Response.json({ error: "無法從此 Word 檔案擷取文字，請另存為 PDF 或文字檔後再匯入。" }, { status: 422 });
      }
    }

    // 圖片或掃描版 PDF：直接把檔案交給使用者設定的模型（需支援圖片／PDF 輸入）。
    try {
      return ok(file.name, await parseResumeFileWithAi({ file, kind, settings }), "ai-file");
    } catch (error) {
      return Response.json({ error: `AI 履歷解析失敗。${formatError(error)} ${VISION_HINT}`.trim() }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: formatError(error) || "履歷匯入失敗，請稍後重試。" }, { status: 500 });
  }
}

function ok(fileName: string, content: ReturnType<typeof normalizeResumeContent>, source: string, message?: string) {
  const characterCount = JSON.stringify(content).length;
  return Response.json({
    fileName,
    content,
    characterCount,
    source,
    message,
  });
}

async function localFallback(file: File, kind: NonNullable<ReturnType<typeof getResumeUploadKind>>, plainText: string, message: string) {
  const text = await extractLocalText(file, kind, plainText);
  if (!text) return null;
  return ok(file.name, resumeContentFromText(file.name, text), "local-fallback", message);
}

async function extractLocalText(
  file: File,
  kind: NonNullable<ReturnType<typeof getResumeUploadKind>>,
  plainText: string,
) {
  if (kind === "text" || kind === "json") return plainText;
  if (kind !== "pdf" && kind !== "word") return "";

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = kind === "pdf" ? await extractPdfText(buffer) : await extractWordText(buffer);
  return text.replace(/\s/g, "").length >= 10 ? text : "";
}

function formatError(error: unknown) {
  return error instanceof Error && error.message.trim() ? error.message.trim() : "";
}
