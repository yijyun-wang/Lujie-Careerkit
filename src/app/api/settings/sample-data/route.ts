import { clearSampleData } from "@/lib/repository";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    return Response.json({ data: await clearSampleData() });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "示例資料清理失敗。" },
      { status: 500 },
    );
  }
}
