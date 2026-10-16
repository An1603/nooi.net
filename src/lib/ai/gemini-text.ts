// gemini-text.ts — Gọi Gemini TEXT với fallback nhiều model.
//
// Lý do: project Gemini có thể chặn một số model cũ ("không còn cho người dùng mới")
// hoặc tạm nghẽn (503 UNAVAILABLE). Thử lần lượt danh sách model ưu tiên để tăng
// độ bền cho AI Mentor chat và tính năng biên tập bộ nhớ eKid.
//
// Dùng chung: `src/app/api/ai-mentor/chat/route.ts`, `src/lib/ekid/kid-memory.ts`.

import { GoogleGenAI } from "@google/genai";

/** Danh sách model text ưu tiên (thử lần lượt khi nghẽn/không khả dụng). */
export const GEMINI_TEXT_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-2.5-flash",
] as const;

export interface GenerateTextOptions {
  /** Chỉ dẫn hệ thống (tuỳ chọn). */
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Vd "application/json" để buộc trả JSON. */
  responseMimeType?: string;
}

/**
 * Gọi Gemini text với fallback nhiều model. Trả về chuỗi text, hoặc `null`
 * nếu MỌI model đều thất bại (không ném lỗi ra ngoài).
 */
export async function generateGeminiText(
  apiKey: string,
  prompt: string,
  opts: GenerateTextOptions = {},
): Promise<string | null> {
  const client = new GoogleGenAI({ apiKey });
  const config: Record<string, unknown> = {};
  if (opts.systemInstruction) config.systemInstruction = opts.systemInstruction;
  if (typeof opts.temperature === "number") config.temperature = opts.temperature;
  if (typeof opts.maxOutputTokens === "number") config.maxOutputTokens = opts.maxOutputTokens;
  if (opts.responseMimeType) config.responseMimeType = opts.responseMimeType;

  let lastErr: unknown = null;
  for (const model of GEMINI_TEXT_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config,
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text.trim()) return text;
      lastErr = new Error(`model ${model} trả rỗng`);
    } catch (err) {
      lastErr = err;
      // thử model kế tiếp
    }
  }
  console.error("[gemini-text] tất cả model thất bại:", lastErr);
  return null;
}
