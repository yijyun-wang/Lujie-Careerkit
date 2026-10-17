import { getEffectiveAiRuntimeSettings, recordAiSettingsTest, updateAiSettings } from "@/lib/repository";
import { testAiConnection } from "@/lib/ai/tasks";
import type { AiSettingsInput } from "@/lib/ai/settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (rawBody.trim()) {
      let input: unknown;
      try {
        input = JSON.parse(rawBody);
      } catch {
        return Response.json({ message: "AI 設定測試引數格式不正確。" }, { status: 400 });
      }

      await updateAiSettings(input as AiSettingsInput);
    }

    const settings = await getEffectiveAiRuntimeSettings();
    const result = await testAiConnection(settings);
    const payload = await recordAiSettingsTest(result.source === "ai" && result.data.ok ? "success" : "failed");

    return Response.json({
      ...payload,
      result,
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "AI 連線測試失敗。" },
      { status: 400 },
    );
  }
}
