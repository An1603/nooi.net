"use client";

// useAnswerSpeech — ÉP AI LÊN TIẾNG ngay khi bé trả lời (bấm màn hình hoặc nói).
//
// Vì sao cần: gửi `toolResponse`/`answer_exercise` cho model KHÔNG bảo đảm model sẽ
// phát một lượt nói. Ngài An yêu cầu "bấm hay nói cũng phải có lời đáp về kết quả",
// nên ở đây ta chủ động gửi một LƯỢT VĂN BẢN vào phiên Live (describe → answerSpeechInstruction)
// để buộc model phản hồi bằng giọng ngay.
//
// Dùng chung cho EkidTalkScreen (trang chủ con) và EkidVoiceSession (trong bài học).

import { useCallback, useEffect, useRef } from "react";
import { answerSpeechInstruction, type ExerciseResult } from "@/lib/ekid/interactive";

/** Kết quả kèm id nội dung (khớp `ExerciseResolution` của useEkidInteractive). */
export type AnswerSpeechResult = ExerciseResult & { itemId: string };

export interface AnswerSpeechController {
  /** Truyền vào `VoiceAssistant` prop `onSpeakReady`. */
  onSpeakReady: (speak: (text: string) => void) => void;
}

/**
 * @param result Kết quả ĐÃ ghi nhận của nội dung đang hiện (null = chưa trả lời gì).
 * Mỗi kết quả MỚI chỉ được đọc lên MỘT lần (chống lặp khi re-render/StrictMode).
 */
export function useAnswerSpeech(result: AnswerSpeechResult | null): AnswerSpeechController {
  const speakRef = useRef<((text: string) => void) | null>(null);
  const saidRef = useRef<string | null>(null);

  const onSpeakReady = useCallback((speak: (text: string) => void) => {
    speakRef.current = speak;
  }, []);

  useEffect(() => {
    if (!result) return;
    const key = `${result.itemId}:${result.chosen_index}:${result.source}`;
    if (saidRef.current === key) return;
    saidRef.current = key;
    // Hàm `speak` ổn định và tự bỏ qua khi phiên chưa kết nối → gọi lúc nào cũng an toàn.
    speakRef.current?.(answerSpeechInstruction(result));
  }, [result]);

  return { onSpeakReady };
}
