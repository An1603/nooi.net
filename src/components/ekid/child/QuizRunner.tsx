"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicExercise } from "./types";
import { KID } from "./kid-theme";

interface QuizResult {
  score: number;
  best_score: number;
  points_awarded: number;
  new_badges: { code: string; label: string }[];
  passed_lessons: number;
}

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Trình làm bài thi — hiện lần lượt từng câu, thu `answers[]`, gửi chấm điểm
 * lên server (POST /api/ekid/quiz). Client KHÔNG biết đáp án đúng.
 */
export function QuizRunner({
  lessonId,
  exercises,
}: {
  lessonId: string;
  exercises: PublicExercise[];
}) {
  const [answers, setAnswers] = useState<number[]>(() => exercises.map(() => -1));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const total = exercises.length;

  if (total === 0) {
    return (
      <div className={`${KID.cardPad} text-center`}>
        <p className="text-xl font-bold text-[#3b2a20]">
          Bài này chưa có câu hỏi nào. Bé quay lại thư viện nhé!
        </p>
        <Link href="/" className={`mt-4 ${KID.btnPrimary}`}>
          ⬅ Về thư viện
        </Link>
      </div>
    );
  }

  async function submit(finalAnswers: number[]) {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/ekid/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Không truyền kid_id — server tự suy ra hồ sơ của bé đang đăng nhập.
        body: JSON.stringify({ lesson_id: lessonId, answers: finalAnswers }),
      });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không nộp được bài");
      setResult({
        score: (d.score as number) ?? 0,
        best_score: (d.best_score as number) ?? 0,
        points_awarded: (d.points_awarded as number) ?? 0,
        new_badges: (d.new_badges as { code: string; label: string }[]) ?? [],
        passed_lessons: (d.passed_lessons as number) ?? 0,
      });
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi nộp bài");
    } finally {
      setSubmitting(false);
    }
  }

  function choose(optionIndex: number) {
    const next = [...answers];
    next[idx] = optionIndex;
    setAnswers(next);
    if (idx < total - 1) {
      setIdx(idx + 1);
    } else {
      void submit(next);
    }
  }

  function retry() {
    setAnswers(exercises.map(() => -1));
    setIdx(0);
    setResult(null);
    setPhase("quiz");
  }

  if (phase === "result" && result) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-[#4ecdc4] bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <div className="text-7xl" aria-hidden>
          {result.score >= 70 ? "🎉" : "💪"}
        </div>
        <p className="text-3xl font-extrabold text-[#ff7a59]">{result.score} điểm</p>
        <p className="text-lg font-bold text-[#3b2a20]">
          Điểm cao nhất: {result.best_score} điểm
        </p>
        <p className="text-lg font-bold text-[#3b2a20]">
          ⭐ Bé vừa nhận {result.points_awarded} điểm thưởng!
        </p>

        {result.new_badges.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {result.new_badges.map((b) => (
              <span
                key={b.code}
                className="rounded-full bg-[#fff3c4] px-4 py-2 text-base font-extrabold text-[#a16207]"
              >
                🏅 {b.label}
              </span>
            ))}
          </div>
        ) : null}

        {error ? <p className="text-base font-bold text-[#e15a3a]">{error}</p> : null}

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button onClick={retry} className={KID.btnGhost}>
            🔁 Thi lại
          </button>
          <Link href="/" className={KID.btnPrimary}>
            🏠 Về thư viện
          </Link>
        </div>
      </div>
    );
  }

  const current = exercises[idx];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-[#ff7a59] transition-all"
            style={{ width: `${((idx + (submitting ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
        <span className="text-base font-bold text-[#3b2a20]">
          Câu {idx + 1}/{total}
        </span>
      </div>

      <div className={`${KID.cardPad}`}>
        <p className="text-2xl font-extrabold leading-snug text-[#3b2a20]">
          {current.question}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            disabled={submitting}
            className="min-h-[64px] rounded-2xl border-2 border-[#bae6fd] bg-white px-4 py-6 text-2xl font-extrabold text-[#3b2a20] shadow-md shadow-sky-200/50 transition-transform hover:scale-[1.02] hover:border-[#4ecdc4] active:scale-95 disabled:opacity-60"
          >
            {opt}
          </button>
        ))}
      </div>

      {submitting ? (
        <p className="text-center text-lg font-bold text-[#ff7a59]">Đang chấm điểm...</p>
      ) : null}
      {error ? (
        <p className="text-center text-lg font-bold text-[#e15a3a]">{error}</p>
      ) : null}
    </div>
  );
}
