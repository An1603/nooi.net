"use client";

import { useMemo, useState } from "react";
import type { AgeBand } from "@/lib/ekid/ekid-system";

// Một câu hỏi test đầu vào: câu hỏi + các lựa chọn + chỉ số đáp án đúng.
interface IntroQuestion {
  q: string;
  options: string[];
  answerIndex: number;
}

// Bộ câu hỏi đơn giản theo từng lứa tuổi (định vị đầu vào).
const QUESTIONS: Record<AgeBand, IntroQuestion[]> = {
  "mam-non": [
    { q: "Đếm xem có mấy quả táo nhé: 🍎🍎🍎", options: ["2", "3", "4"], answerIndex: 1 },
    { q: "Chữ cái nào đứng đầu bảng chữ cái?", options: ["A", "B", "C"], answerIndex: 0 },
    { q: 'Con vật nào kêu "meo meo"?', options: ["Con chó", "Con mèo", "Con gà"], answerIndex: 1 },
  ],
  "tieu-hoc": [
    { q: "5 + 3 = ?", options: ["7", "8", "9"], answerIndex: 1 },
    { q: "12 − 4 = ?", options: ["6", "8", "10"], answerIndex: 1 },
    { q: "7 + 6 = ?", options: ["12", "13", "14"], answerIndex: 1 },
  ],
  "thieu-nien": [
    { q: "Dãy số 2, 4, 8, 16, ... số tiếp theo là?", options: ["18", "24", "32"], answerIndex: 2 },
    {
      q: '"Nếu trời mưa thì đường ướt." Đường đang ướt — có chắc trời đã mưa không?',
      options: ["Chắc chắn mưa", "Không chắc chắn", "Chắc chắn không mưa"],
      answerIndex: 1,
    },
    {
      q: "Một số cộng với 7 rồi nhân với 2 thì được 30. Số đó là?",
      options: ["8", "11", "15"],
      answerIndex: 0,
    },
  ],
};

/**
 * Bài kiểm tra ĐẦU VÀO — hiện 3 câu hỏi theo lứa, bé bấm đáp án.
 * Khi trả lời hết → tính điểm → POST `/api/ekid/assessments` (step='dau-vao') → onDone().
 */
export function AssessmentIntro({
  kidId,
  band,
  onDone,
}: {
  kidId: string;
  band: AgeBand;
  onDone: () => void;
}) {
  const questions = useMemo(() => QUESTIONS[band] ?? QUESTIONS["mam-non"], [band]);
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = picked.filter((p) => p !== null).length;
  const allAnswered = answeredCount === questions.length;

  function choose(qi: number, oi: number) {
    setPicked((prev) => prev.map((v, i) => (i === qi ? oi : v)));
  }

  async function submit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(null);

    const correctCount = questions.reduce(
      (n, q, i) => n + (picked[i] === q.answerIndex ? 1 : 0),
      0,
    );
    const scorePct = Math.round((correctCount / questions.length) * 100);
    const items = questions.map((q, i) => ({
      q: q.q,
      answer: q.options[q.answerIndex],
      correct: picked[i] === q.answerIndex,
    }));

    try {
      const r = await fetch("/api/ekid/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kid_id: kidId, step: "dau-vao", items, score_pct: scorePct }),
      });
      if (!r.ok) throw new Error("Không lưu được kết quả bài kiểm tra");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi nộp bài");
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-6 space-y-4 backdrop-blur-md">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Bài kiểm tra đầu vào</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cùng làm vài câu nhỏ để cô biết bé bắt đầu từ đâu nhé!
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Đã trả lời {answeredCount}/{questions.length}
        </p>
      </div>

      {questions.map((qq, qi) => (
        <div key={qi} className="rounded-xl border border-border bg-glass/60 p-3 sm:p-4">
          <p className="text-base font-medium text-foreground">{qq.q}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {qq.options.map((opt, oi) => {
              const active = picked[qi] === oi;
              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => choose(qi, oi)}
                  aria-pressed={active}
                  className={`rounded-xl border px-4 py-4 text-base font-medium text-foreground transition-colors ${
                    active ? "border-n-green/60 bg-n-green/20" : "border-border bg-glass hover:bg-glass-hover"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!allAnswered || submitting}
        className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Đang lưu..." : "Hoàn thành & bắt đầu học 🎤"}
      </button>
    </div>
  );
}
