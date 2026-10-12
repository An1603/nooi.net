"use client";

// EkidTalkCard — khung trò chuyện AI ở ĐẦU trang chủ con (kiểu NOOI AI Mentor).
// Chỉ tái dùng VoiceAssistant + buildSystemInstruction; KHÔNG viết lại engine voice.
// Nạp BỘ NHỚ về bé vào ngữ cảnh AI; tự lưu hội thoại một lần khi kết thúc buổi.

import { useCallback, useEffect, useMemo, useRef } from "react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import type { VoiceTurn } from "@/components/voice/useVoiceAssistant";
import type { VoiceOption } from "@/lib/voice/gemini-live";
import type { AgeBand } from "@/lib/ekid/ekid-system";
import { BAND_VOICE, buildSystemInstruction } from "@/lib/ekid/ekid-system";
import { KID } from "@/components/ekid/child/kid-theme";

/** Hồ sơ bé rút gọn — đủ để chọn giọng + dựng system instruction + lưu bộ nhớ. */
export interface TalkKid {
  id: string;
  name: string;
  favorite_voice: string | null;
  placement_age_band: AgeBand | null;
  placement_level: number | null;
  /** Bộ nhớ tổng hợp về bé từ các buổi trước (cột ekid_kids.memory). */
  memory: string | null;
}

// 10 giọng Gemini Live hợp lệ (khớp `VoiceOption` trong gemini-live.ts).
const VALID_VOICES: readonly VoiceOption[] = [
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Aoede",
  "Zephyr",
  "Leda",
  "Orus",
  "Callirrhoe",
  "Sulafat",
];

function isVoiceOption(value: string | null): value is VoiceOption {
  return value !== null && (VALID_VOICES as readonly string[]).includes(value);
}

/**
 * Thẻ trò chuyện AI cho bé: thẻ tiêu đề kiểu AI Mentor chứa trợ lý giọng nói.
 * Hết giờ học trong ngày (`remaining <= 0`) → thay bằng lời hẹn ngày mai.
 */
export function EkidTalkCard({ kid, remaining }: { kid: TalkKid; remaining: number }) {
  const voice: VoiceOption = isVoiceOption(kid.favorite_voice)
    ? kid.favorite_voice
    : BAND_VOICE[kid.placement_age_band ?? "mam-non"];

  // Phiên trò chuyện CHUNG: không gắn bài học, không có bài tập.
  // Bộ nhớ (`memory`) được nạp làm ghi chú để AI nhớ ngữ cảnh về bé.
  const systemInstruction = useMemo(
    () =>
      buildSystemInstruction({
        kidName: kid.name,
        placement: {
          ageBand: kid.placement_age_band ?? "mam-non",
          level: kid.placement_level ?? 1,
        },
        lessonTopic: undefined,
        exercises: [],
        freeSession: true,
        recentNotes: kid.memory ?? null,
      }),
    [
      kid.name,
      kid.placement_age_band,
      kid.placement_level,
      kid.memory,
    ],
  );

  // ── Thu thập + tự lưu hội thoại ─────────────────────────────────────────
  const turnsRef = useRef<VoiceTurn[]>([]);
  const sentRef = useRef(false); // Chỉ gửi MỘT LẦN cho mỗi buổi.
  const startedAtRef = useRef<number>(0);
  if (startedAtRef.current === 0) startedAtRef.current = Date.now();

  const onTurnsChange = useCallback((turns: VoiceTurn[]) => {
    turnsRef.current = turns;
  }, []);

  // Best-effort: gửi toàn bộ lượt hội thoại + số phút tới API lưu bộ nhớ.
  // Im lặng tuyệt đối nếu lỗi; chỉ gửi khi có lượt và chưa gửi lần nào.
  const saveSession = useCallback(() => {
    if (sentRef.current) return;
    const turns = turnsRef.current;
    if (turns.length === 0) return;
    sentRef.current = true;

    const duration = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 60000));
    try {
      void fetch(`/api/ekid/kids/${kid.id}/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ turns, duration_min: duration }),
      }).catch(() => {});
    } catch {
      // Bỏ qua — không chặn luồng nói của bé.
    }
  }, [kid.id]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveSession();
    };
    const onPageHide = () => saveSession();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      // Gỡ component (điều hướng trong app) → gửi nốt một lần.
      saveSession();
    };
  }, [saveSession]);

  return (
    <section
      className={`${KID.cardPad} flex flex-col gap-4`}
      aria-label={`Bạn AI của ${kid.name}`}
    >
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-[#3b2a20]">
          <span aria-hidden className="mr-1">
            🎙️
          </span>
          Bạn AI của {kid.name}
        </h2>
        <p className="mt-1 text-base font-semibold text-[#6b5648]">
          Trò chuyện cùng bạn AI — hỏi bài, kể chuyện hay luyện nói nhé!
        </p>
      </div>

      {remaining > 0 ? (
        <VoiceAssistant
          voice={voice}
          systemInstruction={systemInstruction}
          title={`Bạn AI của ${kid.name}`}
          hideTranscript
          onTurnsChange={onTurnsChange}
        />
      ) : (
        <div
          role="status"
          className="rounded-2xl border-2 border-[#ffd93d] bg-[#fffbeb] p-4 text-center text-lg font-bold text-[#6b5648]"
        >
          Hôm nay mình học đủ rồi, hẹn bé ngày mai nhé! 🌙
        </div>
      )}
    </section>
  );
}
