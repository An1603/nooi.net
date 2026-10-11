"use client";
import { useMemo, useState } from "react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { ExerciseCard } from "./ExerciseCard";
import type { VoiceOption } from "@/lib/voice/gemini-live";
import type { AgeBand, EkidExercise } from "@/lib/ekid/ekid-system";
import { BAND_VOICE, buildSystemInstruction } from "@/lib/ekid/ekid-system";

export interface EkidKidLite {
  id: string;
  name: string;
  favorite_voice: string | null;
  placement_age_band: AgeBand | null;
  placement_level: number | null;
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
  const exercises: EkidExercise[] = lesson?.exercises ?? [];
  const [results, setResults] = useState<{ i: number; correct: boolean }[]>([]);
  const startedRef = useMemo(() => Date.now(), []);

  const voice =
    (kid.favorite_voice as VoiceOption) || BAND_VOICE[kid.placement_age_band ?? "mam-non"];
  const systemInstruction = useMemo(
    () =>
      buildSystemInstruction({
        kidName: kid.name,
        placement: {
          ageBand: kid.placement_age_band ?? "mam-non",
          level: kid.placement_level ?? 1,
        },
        lessonTopic: lesson?.core_topic,
        exercises,
      }),
    [kid, lesson, exercises],
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
        duration_min: duration,
        transcript: [],
        exercises_done: results.map((r) => ({ exercise_id: r.i, correct: r.correct })),
      }),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <VoiceAssistant
        voice={voice}
        systemInstruction={systemInstruction}
        title={`Cùng học với ${kid.name}`}
      />
      {remaining <= 0 && (
        <p className="text-sm text-destructive">
          Hôm nay bé đã học đủ thời gian. Hẹn bé ngày mai nhé! 🌙
        </p>
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
