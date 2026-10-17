import { ZodError } from "zod";

export function interviewRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ message: "面試請求引數不完整或格式不正確。" }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : "面試請求失敗，請稍後重試。";
  if (message.includes("未找到")) return Response.json({ message }, { status: 404 });
  if (message.includes("AI") || message.includes("模型") || message.includes("連線")) {
    return Response.json({ message }, { status: 502 });
  }
  return Response.json({ message }, { status: 400 });
}
