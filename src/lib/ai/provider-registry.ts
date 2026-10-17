export type AiProviderGroupId = "international" | "aggregator" | "local" | "custom";

export type AiProviderDefinition = {
  id: string;
  label: string;
  group: AiProviderGroupId;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  baseUrlEditable?: boolean;
  apiKeyOptional?: boolean;
};

export const DEFAULT_AI_PROVIDER_ID = "openai";
export const DEFAULT_AI_MODEL = "gpt-6-luna";

// 本分支不提供中國的線上模型服務；舊設定若仍指向這些供應商，會在載入時改回預設供應商。
export const REMOVED_AI_PROVIDER_IDS = ["deepseek", "minimax", "qwen", "moonshot", "zhipu", "volcengine", "siliconflow"] as const;
export const LEGACY_DEFAULT_AI_MODELS = ["gpt-4o-mini", "gpt-5.4-mini", "deepseek-v4-flash", "qwen3.6-flash"] as const;

export const AI_PROVIDER_GROUPS: Array<{ id: AiProviderGroupId; label: string }> = [
  { id: "international", label: "國際模型" },
  { id: "aggregator", label: "聚合閘道" },
  { id: "local", label: "本機模型" },
  { id: "custom", label: "自訂" },
];

export const AI_PROVIDERS: AiProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    group: "international",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-6-luna",
    models: [
      "gpt-6-luna",
      "gpt-6.1-sol",
      "gpt-6-astra",
      "gpt-5.6",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
    ],
  },
  {
    id: "gemini",
    label: "Google Gemini（官方 API）",
    group: "international",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-3.8-flash",
    models: [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-pro-preview",
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude（官方 API）",
    group: "international",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-5-5",
    models: [
      "claude-sonnet-5-5",
      "claude-opus-5-5",
      "claude-fable-5-1",
      "claude-haiku-4-5",
    ],
  },
  {
    id: "anthropic-via-openrouter",
    label: "Anthropic Claude（經 OpenRouter）",
    group: "international",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-fable-5.1",
    models: [
      "anthropic/claude-fable-5.1",
      "anthropic/claude-opus-5.5",
      "anthropic/claude-sonnet-5.5",
      "anthropic/claude-haiku-4.5",
    ],
  },
  {
    id: "gemini-via-openrouter",
    label: "Google Gemini（經 OpenRouter）",
    group: "international",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-3.8-flash",
    models: [
      "google/gemini-3.8-flash",
      "google/gemini-3.5-flash-lite",
      "google/gemini-3.1-pro-preview",
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    group: "international",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-medium-3-5",
    models: [
      "mistral-medium-3-5",
      "mistral-large-latest",
      "mistral-small-latest",
    ],
  },
  {
    id: "xai",
    label: "xAI Grok",
    group: "international",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-4.7",
    models: ["grok-4.7"],
  },
  {
    id: "groq",
    label: "Groq",
    group: "international",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
    models: [
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    group: "aggregator",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-6.1-sol",
    models: [
      "openai/gpt-6.1-sol",
      "openai/gpt-6-luna",
      "openai/gpt-6-astra",
      "openai/gpt-5.6-terra",
      "openai/gpt-5.6-luna",
      "anthropic/claude-fable-5.1",
      "anthropic/claude-opus-5.5",
      "anthropic/claude-sonnet-5.5",
      "google/gemini-3.8-flash",
      "google/gemini-3.5-flash-lite",
      "google/gemini-3.1-pro-preview",
      "x-ai/grok-4.7",
      "mistralai/mistral-medium-3-5",
      "openai/gpt-oss-120b",
    ],
  },
  {
    id: "one-api",
    label: "One API / New API",
    group: "aggregator",
    baseUrl: "http://localhost:3001/v1",
    defaultModel: "gpt-5.6",
    models: [
      "gpt-6.1-sol",
      "gpt-5.6",
      "grok-4.7",
      "claude-fable-5.1",
      "gemini-3.8-flash",
      "mistral-medium-3-5",
    ],
    baseUrlEditable: true,
  },
  {
    id: "ollama",
    label: "Ollama / LM Studio / vLLM",
    group: "local",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "gpt-oss:20b",
    models: [
      "gpt-oss:20b",
      "gpt-oss:120b",
      "gemma3:12b",
      "gemma3:27b",
      "llama3.3:70b",
      "llama3.1:8b",
      "mistral-small:latest",
    ],
    baseUrlEditable: true,
    apiKeyOptional: true,
  },
  {
    id: "custom-openai-compatible",
    label: "自訂 OpenAI-compatible",
    group: "custom",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5.6",
    models: [
      "gpt-6.1-sol",
      "gpt-5.6",
      "claude-fable-5.1",
      "gemini-3.8-flash",
      "grok-4.7",
    ],
    baseUrlEditable: true,
  },
];

const CUSTOM_PROVIDER = AI_PROVIDERS.find((provider) => provider.id === "custom-openai-compatible");

const AI_MODEL_RENAMES: Record<string, Record<string, string>> = {
  "gemini-via-openrouter": {
    "google/gemini-3.8-flash-lite": "google/gemini-3.5-flash-lite",
  },
  groq: {
    "groq/compound": "openai/gpt-oss-120b",
    "groq/compound-mini": "openai/gpt-oss-20b",
    "llama-3.1-8b-instant": "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
  },
  mistral: {
    "mistral-medium-3.5": "mistral-medium-3-5",
    "mistral-small-4": "mistral-small-2603",
  },
  openrouter: {
    "google/gemini-3.8-flash-lite": "google/gemini-3.5-flash-lite",
    "openai/gpt-5.6": "openai/gpt-5.6-sol",
    "mistralai/mistral-medium-3.5": "mistralai/mistral-medium-3-5",
    "mistralai/mistral-small-4": "mistralai/mistral-small-2603",
  },
};

export function getAiProvider(providerId: string | null | undefined) {
  return AI_PROVIDERS.find((provider) => provider.id === providerId) ?? CUSTOM_PROVIDER ?? AI_PROVIDERS[0];
}

export function getDefaultAiModel(providerId: string | null | undefined) {
  return getAiProvider(providerId).defaultModel;
}

export function getCurrentAiModel(providerId: string | null | undefined, model: string | null | undefined) {
  const provider = getAiProvider(providerId);
  const value = model?.trim() || provider.defaultModel;
  return AI_MODEL_RENAMES[provider.id]?.[value] ?? value;
}

export function requiresBaseUrl(providerId: string | null | undefined) {
  return Boolean(getAiProvider(providerId).baseUrlEditable);
}

export function providerRequiresApiKey(providerId: string | null | undefined) {
  return !getAiProvider(providerId).apiKeyOptional;
}
