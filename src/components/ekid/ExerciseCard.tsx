"use client";

import { useState } from "react";
import type { EkidExercise } from "@/lib/ekid/ekid-system";

/**
 * Thẻ bài tập — bé chạm vào đáp án; sau khi chọn sẽ hiện phản hồi đúng/sai.
 */
export function ExerciseCard({
  exercise,
  index,
  onAnswer,
}: {
  exercise: EkidExercise;
  index: number;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  function choose(i: number) {
    if (done) return;
    setPicked(i);
    setDone(true);
    onAnswer(i === exercise.answer_index);
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-4 sm:p-5">
      <p className="text-xs text-muted-foreground mb-1">Bài {index + 1}</p>
      <p className="text-base sm:text-lg font-medium text-foreground mb-3">{exercise.question}</p>
      {exercise.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exercise.image_url}
          alt=""
          className="w-full max-w-xs rounded-xl mb-3 opacity-95"
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        {exercise.options.map((opt, i) => {
          const isAns = i === exercise.answer_index;
          const bg = !done
            ? "bg-glass hover:bg-glass-hover"
            : isAns
              ? "bg-n-green/20 border-n-green/50"
              : i === picked
                ? "bg-destructive/20 border-destructive/50"
                : "bg-glass";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`rounded-xl border border-border px-3 py-4 text-base font-medium text-foreground transition-colors ${bg}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {done && (
        <p
          className={`mt-3 text-sm ${
            picked === exercise.answer_index ? "text-n-green" : "text-primary"
          }`}
        >
          {picked === exercise.answer_index
            ? "🌟 Giỏi quá! Chính xác rồi!"
            : `💛 Chưa đúng — đáp án là "${exercise.options[exercise.answer_index]}". Thử lại nhé!`}
        </p>
      )}
    </div>
  );
}
