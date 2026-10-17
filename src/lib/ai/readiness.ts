import type { RedactedAiSettings } from "@/lib/ai/settings";

export function isAiReady(settings: RedactedAiSettings | null) {
  if (!settings) return false;
  if (settings.requiresApiKey && !settings.hasApiKey) return false;
  return settings.aiLastTestStatus !== "failed";
}

export function aiReadinessMessage(settings: RedactedAiSettings | null) {
  if (!settings) return "AI 模型尚未配置。請先在設定頁選擇 Provider、填寫模型與金鑰，並測試連線。";
  if (settings.requiresApiKey && !settings.hasApiKey) return "當前 Provider 需要 API Key。請先在設定頁儲存金鑰。";
  if (settings.aiLastTestStatus === "failed") return "上次 AI 連線測試失敗。請檢查 Base URL、模型名稱或金鑰後重新測試。";
  return "AI 功能可用。";
}

export function isResumeImportAiReady(settings: RedactedAiSettings | null) {
  return isAiReady(settings);
}
