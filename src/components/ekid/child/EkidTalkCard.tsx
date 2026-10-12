"use client";

// EkidTalkCard — khung trò chuyện AI ở ĐẦU trang chủ con (kiểu NOOI AI Mentor).
// Chỉ tái dùng VoiceAssistant + buildSystemInstruction; KHÔNG viết lại engine voice.

import { useMemo } from "react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import type { VoiceOption } from "@/lib/voice/gemini-live";
import type { AgeBand } from "@/lib/ekid/ekid-system";
import { BAND_VOICE, buildSystemInstruction } from "@/lib/ekid/ekid-system";
import { KID } from "@/components/ekid/child/kid-theme";

/** Hồ sơ bé rút gọn — đủ để chọn giọng + dựng system instruction. */
export interface TalkKid {
  name: string;
  favorite_voice: string | null;
  placement_age_band: AgeBand | null;
  placement_level: number | null;
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
      }),
    [kid],
  );

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
