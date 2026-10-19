"use client";

// useAnswerSpeech — bảo đảm CÓ LỜI ĐÁP về kết quả khi bé trả lời (bấm hoặc nói).
//
// Vì sao cần: gửi `toolResponse`/`answer_exercise` cho model KHÔNG bảo đảm model phát
// một lượt nói. Thực tế đo được: bé BẤM thì model tự đáp, nhưng bé NÓI (ngay sau tool
// call) thì model thường kết thúc lượt luôn → màn hình xanh mà AI im lặng.
//
// Cách làm: sau mỗi kết quả, chờ một KHOẢNG ÂN HẠN ngắn; nếu trong lúc đó AI ĐÃ lên
// tiếng (status "speaking") thì thôi — tránh nói chồng; nếu AI vẫn im thì GỬI THẲNG một
// lượt văn bản vào phiên Live để buộc model lên tiếng ngay.
//
// Dùng chung cho EkidTalkScreen (trang chủ con) và EkidVoiceSession (trong bài học).

import { useCallback, useEffect, useRef } from "react";
import { answerSpeechInstruction, type ExerciseResult } from "@/lib/ekid/interactive";
import type { VoiceStatus } from "@/components/voice/useVoiceAssistant";

/** Kết quả kèm id nội dung (khớp `ExerciseResolution` của useEkidInteractive). */
export type AnswerSpeechResult = ExerciseResult & { itemId: string };

/** Ân hạn chờ AI TỰ đáp trước khi ép — đủ dài cho lượt ngắn nhất, đủ ngắn để không trễ. */
export const ANSWER_SPEECH_GRACE_MS = 1200;

export interface AnswerSpeechController {
  /** Truyền vào `VoiceAssistant` prop `onSpeakReady`. */
  onSpeakReady: (speak: (text: string) => void) => void;
  /** Gửi NGAY một lượt văn bản vào phiên Live (no-op khi chưa kết nối). */
  speak: (text: string) => void;
}

/**
 * @param result Kết quả ĐÃ ghi nhận của nội dung đang hiện (null = chưa trả lời gì).
 * @param status Trạng thái phiên giọng nói (lấy từ `VoiceAssistant` prop `onStatusChange`).
 * Mỗi kết quả MỚI chỉ xử lý MỘT lần (chống lặp khi re-render/StrictMode).
 */
export function useAnswerSpeech(
  result: AnswerSpeechResult | null,
  status?: VoiceStatus | null,
  graceMs: number = ANSWER_SPEECH_GRACE_MS,
): AnswerSpeechController {
  const speakRef = useRef<((text: string) => void) | null>(null);
  const saidRef = useRef<string | null>(null);
  const spokeRef = useRef(false); // AI đã lên tiếng kể từ kết quả này?
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Trạng thái mới nhất của phiên — để KHÔNG cắt lời AI đang nói.
  const statusRef = useRef<VoiceStatus | null>(status ?? null);
  useEffect(() => {
    statusRef.current = status ?? null;
  }, [status]);

  const onSpeakReady = useCallback((speak: (text: string) => void) => {
    speakRef.current = speak;
  }, []);

  // Đánh dấu "AI đã lên tiếng" khi phiên chuyển sang trạng thái đang nói.
  useEffect(() => {
    if (status === "speaking") spokeRef.current = true;
  }, [status]);

  useEffect(() => {
    if (!result) return;
    const key = `${result.itemId}:${result.chosen_index}:${result.source}`;
    if (saidRef.current === key) return;
    saidRef.current = key;

    // Lượt mới → chưa lên tiếng; chờ trong ân hạn rồi mới quyết định.
    spokeRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    let waits = 0;
    const trySpeak = () => {
      timerRef.current = null;
      if (spokeRef.current) return; // AI đã tự đáp → KHÔNG nói chồng.
      // AI đang nói (tổng kết / đọc câu hỏi) → HOÃN, không cắt lời.
      if (statusRef.current === "speaking" && waits < 20) {
        waits += 1;
        timerRef.current = setTimeout(trySpeak, 600);
        return;
      }
      // Hàm `speak` ổn định và tự bỏ qua khi phiên chưa kết nối.
      speakRef.current?.(answerSpeechInstruction(result));
    };
    timerRef.current = setTimeout(trySpeak, graceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [result, graceMs]);

  const speak = useCallback((text: string) => {
    speakRef.current?.(text);
  }, []);

  return { onSpeakReady, speak };
}
