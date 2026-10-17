import {
  DEFAULT_AI_PROVIDER_ID,
  getAiProvider,
  getCurrentAiModel,
  getDefaultAiModel,
  LEGACY_DEFAULT_AI_MODELS,
  REMOVED_AI_PROVIDER_IDS,
} from "./provider-registry";
import type { AiTestStatus } from "./settings";

type StoredAiSettingsForMaintenance = {
  aiProvider: string;
  aiModel: string;
  aiBaseUrl: string;
  aiApiKey: string;
  aiEnabled: boolean;
};

type AiSettingsMaintenancePatch = {
  aiProvider?: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel: string;
  aiLastTestStatus: AiTestStatus;
};

export function getAiSettingsMaintenancePatch(
  settings: StoredAiSettingsForMaintenance,
): AiSettingsMaintenancePatch | null {
  if ((REMOVED_AI_PROVIDER_IDS as readonly string[]).includes(settings.aiProvider)) {
    // 中國的線上模型服務已從本分支移除：改回預設供應商，並清除只對舊服務有效的 API Key。
    const defaultProvider = getAiProvider(DEFAULT_AI_PROVIDER_ID);
    return {
      aiProvider: defaultProvider.id,
      aiModel: getDefaultAiModel(defaultProvider.id),
      aiBaseUrl: defaultProvider.baseUrl,
      aiApiKey: "",
      aiLastTestStatus: "untested",
    };
  }
  const currentModel = getCurrentAiModel(settings.aiProvider, settings.aiModel);
  if (currentModel !== settings.aiModel) {
    return {
      aiModel: currentModel,
      aiLastTestStatus: "untested",
    };
  }

  const legacyDefaultModels = new Set<string>(LEGACY_DEFAULT_AI_MODELS);

  if (
    settings.aiProvider === "openai" &&
    legacyDefaultModels.has(settings.aiModel) &&
    !settings.aiEnabled &&
    !settings.aiApiKey
  ) {
    const openAiDefaultModel = getDefaultAiModel("openai");
    return {
      aiModel: openAiDefaultModel,
      aiLastTestStatus: "untested",
    };
  }

  return null;
}
