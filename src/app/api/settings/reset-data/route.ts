import { resetAppDataToSample } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST() {
  try {
    return Response.json({ data: await resetAppDataToSample() });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "本地資料重置失敗。" },
      { status: 500 },
    );
  }
}
