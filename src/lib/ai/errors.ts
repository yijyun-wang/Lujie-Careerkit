export type NormalizedAiError = {
  code:
    | "missing_api_key"
    | "unauthorized"
    | "rate_limited"
    | "unsupported_model"
    | "network"
    | "invalid_json"
    | "unknown";
  message: string;
};

export function normalizeAiError(error: unknown): NormalizedAiError {
  // Schema validation failures carry no keyword the checks below recognize.
  if (error instanceof Error && error.name === "ZodError") {
    return {
      code: "invalid_json",
      message: "模型返回格式不符合要求，請重試或切換模型。",
    };
  }

  const text = safeErrorText(error);
  const lower = text.toLowerCase();

  if (lower.includes("missing") && lower.includes("api key")) {
    return {
      code: "missing_api_key",
      message: "缺少 API Key，請在設定頁儲存對應模型服務的金鑰。",
    };
  }

  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("invalid api key") ||
    lower.includes("authentication")
  ) {
    return {
      code: "unauthorized",
      message: "AI 金鑰校驗失敗，請檢查設定頁儲存的金鑰是否正確。",
    };
  }

  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("too many requests") ||
    lower.includes("quota")
  ) {
    return {
      code: "rate_limited",
      message: "AI 服務觸發限流或額度不足，請稍後重試或更換模型服務。",
    };
  }

  if (lower.includes("model") || lower.includes("404") || lower.includes("not found")) {
    return {
      code: "unsupported_model",
      message: "當前模型不可用，請檢查模型名稱或切換到該服務支援的模型。",
    };
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("aborted") ||
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("socket")
  ) {
    return {
      code: "network",
      message: "AI 請求失敗，請檢查網路連線、Base URL 或本地模型服務是否啟動。",
    };
  }

  if (lower.includes("json") || lower.includes("schema") || lower.includes("parse")) {
    return {
      code: "invalid_json",
      message: "模型返回格式不符合要求，請重試或切換模型。",
    };
  }

  return {
    code: "unknown",
    message: "AI 請求失敗，請檢查設定頁的 Provider、模型和網路連線。",
  };
}

function safeErrorText(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  return raw.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]");
}
