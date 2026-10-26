"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import type { VoiceStatus } from "@/components/voice/useVoiceAssistant";
import { ExerciseCard } from "./ExerciseCard";
import type { VoiceOption } from "@/lib/voice/gemini-live";
import type { AgeBand, EkidExercise, TeacherGender } from "@/lib/ekid/ekid-system";
import { buildSystemInstruction, resolveKidVoice } from "@/lib/ekid/ekid-system";
import { EKID_TOOLS, mediaShouldPauseVoice } from "@/lib/ekid/interactive";
import { InteractiveStage } from "@/components/ekid/child/InteractiveStage";
import { useEkidInteractive } from "@/components/ekid/child/useEkidInteractive";
import { useAnswerSpeech } from "@/components/ekid/child/useAnswerSpeech";

export interface EkidKidLite {
  id: string;
  name: string;
  favorite_voice: string | null;
  placement_age_band: AgeBand | null;
  placement_level: number | null;
  /** Giới tính giáo viên AI: "co" → giọng nữ, "thay" → giọng nam. */
  teacher_gender?: TeacherGender | null;
  avatar_emoji?: string | null;
  daily_limit_min?: number | null;
  has_entry_test?: boolean;
  is_owner?: boolean;
}
export interface EkidLessonLite {
  id: string;
  core_topic: string;
  exercises: EkidExercise[];
  system_prompt: string;
}

/**
 * Phiên học eKid — ghép trợ lý giọng nói (Gemini Live) với các thẻ bài tập,
 * tổng hợp kết quả và lưu phiên qua `/api/ekid/session`.
 */
export function EkidVoiceSession({
  kid,
  lesson,
  remaining,
}: {
  kid: EkidKidLite;
  lesson?: EkidLessonLite;
  remaining: number;
}) {
  const exercises: EkidExercise[] = useMemo(() => lesson?.exercises ?? [], [lesson]);
  const [results, setResults] = useState<{ i: number; correct: boolean }[]>([]);
  const startedRef = useMemo(() => Date.now(), []);

  // ── M1: ngân hàng câu hỏi của bài + phiên đã mở ────────────────────────────
  // Câu hỏi tải từ /api/ekid/lesson/{id}/items (KHÔNG kèm đáp án); phiên mở trước
  // để mọi lượt gợi ý/trả lời có session_id thật mà ghi log.
  const [questionBank, setQuestionBank] = useState<Array<{ id: string; prompt: string; kind: string; level: number }>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  useEffect(() => {
    if (!lesson?.id) return;
    let alive = true;
    (async () => {
      try {
        // Mở phiên TRƯỚC: không mở được (hết giờ / hết buổi / ngoài khung giờ) thì
        // không nạp ngân hàng câu hỏi — tránh cảnh AI hỏi mà không ghi nhận được.
        const sr = await fetch("/api/ekid/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kid_id: kid.id, lesson_id: lesson.id }),
        });
        const sd = (await sr.json()) as { session_id?: string; error?: string };
        if (!alive) return;
        if (!sr.ok || !sd.session_id) {
          setSessionError(sd.error ?? "Không mở được phiên học");
          return;
        }
        setSessionId(sd.session_id);

        const ir = await fetch(
          `/api/ekid/lesson/${encodeURIComponent(lesson.id)}/items?kid_id=${encodeURIComponent(kid.id)}`,
          { cache: "no-store" },
        );
        if (!alive) return;
        if (ir.ok) {
          const d = (await ir.json()) as { items?: Array<{ id: string; prompt: string; kind: string; level: number }> };
          setQuestionBank(d.items ?? []);
        }
      } catch {
        // Lỗi mạng: vẫn học được theo bài tập sẵn có, chỉ không ghi nhận được chỉ số.
      }
    })();
    return () => {
      alive = false;
    };
  }, [kid.id, lesson?.id]);

  // Hội thoại thật của buổi (bé ↔ AI) + sự kiện công cụ (bài tập/ảnh/video)
  // — gom qua useEkidInteractive để lưu cùng phiên.
  // `speak` ổn định để hook tương tác gọi được trước khi useAnswerSpeech sẵn sàng.
  const speakRef = useRef<(text: string) => void>(() => {});
  const speak = useCallback((text: string) => speakRef.current(text), []);
  // Trạng thái phiên giọng nói: dùng để hoãn lời đọc bài mới tới khi AI nói xong.
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const interactive = useEkidInteractive(kid.id, {
    speak,
    status: voiceStatus,
    sessionId,
    items: questionBank,
  });
  // ÉP AI nói ngay kết quả bài tập (bấm hoặc nói) trong buổi học — cần trạng thái
  // phiên để biết AI đã tự đáp hay chưa (khỏi nói chồng).
  const { onSpeakReady, speak: speakToAi } = useAnswerSpeech(interactive.resolution, voiceStatus);
  useEffect(() => {
    speakRef.current = speakToAi;
  }, [speakToAi]);
  // Đang có VIDEO trên màn hình → tạm dừng trò chuyện (bé nghe rõ + tiết kiệm voice live).
  const videoOnStage = mediaShouldPauseVoice(interactive.current);

  // Giáo viên là cô → giọng nữ; là thầy → giọng nam (không trộn giới tính).
  const teacherGender: TeacherGender = kid.teacher_gender ?? "co";
  const ageBand: AgeBand = kid.placement_age_band ?? "mam-non";
  const voice: VoiceOption = resolveKidVoice({
    gender: teacherGender,
    ageBand,
    favoriteVoice: kid.favorite_voice,
  });
  const systemInstruction = useMemo(
    () =>
      buildSystemInstruction({
        kidName: kid.name,
        placement: {
          ageBand,
          level: kid.placement_level ?? 1,
        },
        lessonTopic: lesson?.core_topic,
        exercises,
        questionBank: questionBank.map((q) => ({ id: q.id, prompt: q.prompt })),
        teacherGender,
      }),
    [kid.name, ageBand, kid.placement_level, lesson, exercises, questionBank, teacherGender],
  );

  function onAnswer(i: number, correct: boolean) {
    setResults((prev) => [...prev, { i, correct }]);
  }

  async function finish() {
    const duration = Math.round((Date.now() - startedRef) / 60000);
    await fetch("/api/ekid/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kid_id: kid.id,
        lesson_id: lesson?.id ?? null,
        // Có session_id thì server CẬP NHẬT phiên đã mở, không tạo dòng thứ hai
        // (tránh đếm trùng số buổi trong ngày).
        session_id: sessionId,
        duration_min: duration,
        transcript: interactive.getLog(),
        exercises_done: results.map((r) => ({ exercise_id: r.i, correct: r.correct })),
      }),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {remaining > 0 ? (
        <>
          <VoiceAssistant
            voice={voice}
            systemInstruction={systemInstruction}
            title={`Cùng học với ${kid.name}`}
            hideTranscript
            onTurnsChange={interactive.onTurnsChange}
            tools={EKID_TOOLS}
            onToolCall={interactive.onToolCall}
            onUserSpeech={interactive.onUserSpeech}
            onSpeakReady={onSpeakReady}
            onStatusChange={setVoiceStatus}
            paused={videoOnStage}
          />
          {/* `resolution` để thẻ bài tập hiện đúng/sai dù bé BẤM hay TRẢ LỜI BẰNG LỜI. */}
          <InteractiveStage
            item={interactive.current}
            resolution={interactive.resolution}
            onResolve={interactive.onResolve}
          />

          {sessionError && (
            <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {sessionError}
            </p>
          )}

          {/* M1: gợi ý do SERVER quyết bậc, không để AI tự nghĩ. Cùng đường với tool ask_hint. */}
          {questionBank.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void interactive.requestHint()}
                className="rounded-full border-2 border-amber-300 bg-amber-50 px-5 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100"
              >
                💡 Gợi ý (mở 1 bậc)
              </button>
              <span className="text-xs font-semibold text-[#6b5545]">
                Bài này có {questionBank.length} câu · AI hỏi lần lượt, mỗi lượt một câu
              </span>
            </div>
          )}
        </>
      ) : (
        <div
          role="status"
          className="rounded-xl bg-secondary p-4 text-center text-sm text-secondary-foreground"
        >
          Hôm nay mình học đủ rồi, hẹn bé ngày mai nhé! 🌙
        </div>
      )}
      {exercises.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {exercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} index={i} onAnswer={(c) => onAnswer(i, c)} />
          ))}
        </div>
      )}
      <button
        onClick={finish}
        className="self-start rounded-xl bg-primary px-5 py-2.5 text-sm text-primary-foreground"
      >
        Kết thúc buổi học
      </button>
    </div>
  );
}
