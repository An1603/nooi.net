"use client";

// EkidTalkScreen — màn hình chính của con (eKid v3.2).
//
// Bố cục: SÂN KHẤU TRÌNH CHIẾU là chủ đạo (flex-1, chiếm phần lớn màn hình) + VOICE DOCK
// GỌN neo góc dưới-phải (mobile) / cạnh phải (desktop). Không tiêu đề lớn/tip/hội thoại ở
// đây — chỉ nút mic tròn (chế độ `compact` của VoiceAssistant).
//
// Tái dùng VoiceAssistant + useEkidInteractive; KHÔNG viết lại engine voice.
// Nạp BỘ NHỚ về bé vào ngữ cảnh AI; tự lưu hội thoại một lần khi kết thúc buổi
// (visibilitychange/pagehide) — logic chuyển từ EkidTalkCard cũ.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import type { VoiceOption } from "@/lib/voice/gemini-live";
import type { VoiceStatus } from "@/components/voice/useVoiceAssistant";
import type { AgeBand } from "@/lib/ekid/ekid-system";
import { BAND_VOICE, buildSystemInstruction } from "@/lib/ekid/ekid-system";
import { EKID_TOOLS, mediaShouldPauseVoice, stageHint } from "@/lib/ekid/interactive";
import { KID } from "@/components/ekid/child/kid-theme";
import { InteractiveStage } from "@/components/ekid/child/InteractiveStage";
import { useEkidInteractive } from "@/components/ekid/child/useEkidInteractive";
import { useAnswerSpeech } from "@/components/ekid/child/useAnswerSpeech";

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
 * Màn hình trò chuyện + trình chiếu của bé: sân khấu chủ đạo, voice dock gọn ở góc,
 * nút "📚 Bài học" mở trang thư viện riêng.
 */
export function EkidTalkScreen({ kid, remaining }: { kid: TalkKid; remaining: number }) {
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
    [kid.name, kid.placement_age_band, kid.placement_level, kid.memory],
  );

  // ── Lớp tương tác (1 nội dung hiện tại) + ghi log hội thoại ───────────────
  // `resolution` = kết quả bé ĐÃ trả lời (bấm màn hình HOẶC nói) — dùng cho cả
  // khung hiển thị (tô đúng/sai) lẫn khung "ghi chú" bên trái.
  const { current, resolution, onToolCall, onTurnsChange, onResolve, getLog } =
    useEkidInteractive(kid.id);

  // Gợi ý ngắn cho khung ghi chú (cột trái) — bám theo nội dung đang hiện.
  const hint = stageHint(current, resolution);

  // ÉP AI nói ngay kết quả (bấm hoặc nói) — không chờ model tự phát lượt.
  // Cần trạng thái phiên để biết AI ĐÃ tự đáp hay chưa (khỏi nói chồng).
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const { onSpeakReady } = useAnswerSpeech(resolution, voiceStatus);

  // Đang có VIDEO trên sân khấu → TẠM DỪNG trò chuyện (bé nghe rõ + tiết kiệm voice live).
  const videoOnStage = mediaShouldPauseVoice(current);

  // ── Thu thập + tự lưu hội thoại ─────────────────────────────────────────
  const sentRef = useRef(false); // Chỉ gửi MỘT LẦN cho mỗi buổi.
  const startedAtRef = useRef<number>(0);
  if (startedAtRef.current === 0) startedAtRef.current = Date.now();

  // Best-effort: gửi toàn bộ lượt hội thoại + số phút tới API lưu bộ nhớ.
  // Log gồm cả sự kiện công cụ (bài tập/ảnh/video) để chuẩn hoá nội dung về sau.
  // Im lặng tuyệt đối nếu lỗi; chỉ gửi khi có lượt và chưa gửi lần nào.
  const saveSession = useCallback(() => {
    if (sentRef.current) return;
    const turns = getLog();
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
  }, [kid.id, getLog]);

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
    <div className="relative flex min-h-[72vh] flex-col gap-3 md:min-h-[78vh]">
      {/* ── Thanh trên: tiêu đề nhỏ + nút mở thư viện bài học ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={KID.h1}>
          <span aria-hidden className="mr-1">
            🎙️
          </span>
          Bạn AI của {kid.name}
        </h1>
        <Link href="/bai-hoc" className={KID.btnGhost}>
          📚 Bài học
        </Link>
      </div>

      {remaining > 0 ? (
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:gap-4">
          {/* ── CỘT TRÁI: mic + trạng thái + ghi chú ──
              Mobile: dock gọn nổi ở góc dưới-phải (như v3.2).
              Desktop: cột 280px cố định bên trái, sân khấu nhường chỗ bên phải. */}
          <aside
            aria-label="Mic, trạng thái và ghi chú"
            className="fixed bottom-4 right-4 z-40 md:static md:z-auto md:order-first md:w-[280px] md:shrink-0"
          >
            <div className={`${KID.cardPad} flex flex-col items-center gap-3 p-3 md:p-4`}>
              <VoiceAssistant
                voice={voice}
                systemInstruction={systemInstruction}
                title={`Bạn AI của ${kid.name}`}
                hideTranscript
                onTurnsChange={onTurnsChange}
                tools={EKID_TOOLS}
                onToolCall={onToolCall}
                onSpeakReady={onSpeakReady}
                onStatusChange={setVoiceStatus}
                paused={videoOnStage}
                compact
              />
              {/* Ghi chú: chỉ hiện trên desktop (mobile ưu tiên chỗ cho khung hiển thị). */}
              <div className="hidden w-full border-t-2 border-[#e0f2fe] pt-3 md:block" aria-live="polite">
                <p className="text-xs font-black tracking-wide text-[#9c8b7e] uppercase">Ghi chú</p>
                <p className="mt-1 text-sm leading-snug font-bold text-[#3b2a20]">{hint}</p>
              </div>
            </div>
          </aside>

          {/* ── CỘT PHẢI: KHUNG HIỂN THỊ (chủ đạo) ── */}
          <section
            aria-label="Khung hiển thị"
            className="flex flex-1 items-center justify-center rounded-3xl border-2 border-white bg-white/60 p-3 pb-28 shadow-lg shadow-sky-200/50 sm:p-5 md:order-last md:pb-5"
          >
            {current ? (
              <InteractiveStage item={current} resolution={resolution} onResolve={onResolve} />
            ) : (
              <div className="flex max-w-md flex-col items-center gap-3 text-center">
                <span className="text-5xl" aria-hidden>
                  🎈
                </span>
                <p className="text-xl font-extrabold text-[#3b2a20]">
                  Bấm mic để trò chuyện cùng thầy/cô AI
                </p>
                <p className="text-base font-semibold text-[#6b5648]">
                  Con có thể hỏi bài, kể chuyện hoặc luyện nói — thầy/cô AI sẽ hiện hình ảnh và bài tập lên đây nhé!
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div
          role="status"
          className="rounded-2xl border-2 border-[#ffd93d] bg-[#fffbeb] p-4 text-center text-lg font-bold text-[#6b5648]"
        >
          Hôm nay mình học đủ rồi, hẹn bé ngày mai nhé! 🌙
        </div>
      )}
    </div>
  );
}
