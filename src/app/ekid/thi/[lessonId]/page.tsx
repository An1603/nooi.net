"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuizRunner } from "@/components/ekid/child/QuizRunner";
import { KID } from "@/components/ekid/child/kid-theme";
import type { LibraryLesson, PublicExercise } from "@/components/ekid/child/types";

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Trang làm bài thi của bé — tải câu hỏi (đã ẩn đáp án) rồi chuyển cho QuizRunner
 * chấm điểm phía server.
 */
export default function EkidQuizPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const [lesson, setLesson] = useState<LibraryLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Không truyền kid_id — server tự suy ra hồ sơ của bé đang đăng nhập.
      const r = await fetch("/api/ekid/library");
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không tải được bài thi");
      const all = (d.lessons as LibraryLesson[]) ?? [];
      const found = all.find((l) => l.id === lessonId) ?? null;
      if (!found) throw new Error("Không tìm thấy bài học");
      setLesson(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi tải bài thi");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p className="py-10 text-center text-xl font-bold text-[#3b2a20]">
        Đang mở bài thi...
      </p>
    );
  }

  if (error || !lesson) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-[#ff7a59]/50 bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <p className="text-xl font-bold text-[#e15a3a]">{error ?? "Không tìm thấy bài học"}</p>
        <Link href="/" className={`mt-4 ${KID.btnPrimary}`}>
          ⬅ Về thư viện
        </Link>
      </div>
    );
  }

  // Bài bị KHOÁ theo nguyên tắc "thi đạt mới sang bài": KHÔNG cho làm bài thi.
  if (lesson.locked) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-[#ffd93d] bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <p className="text-5xl" aria-hidden>
          🔒
        </p>
        <p className="mt-3 text-xl font-bold text-[#3b2a20]">
          Con cần hoàn thành bài trước đã nhé!
        </p>
        <Link href="/" className={`mt-4 ${KID.btnPrimary}`}>
          ⬅ Về thư viện
        </Link>
      </div>
    );
  }

  const exercises: PublicExercise[] = lesson.exercises ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={KID.h1}>📝 {lesson.title}</h1>
        <Link href={`/hoc/${lessonId}`} className={KID.btnGhost}>
          ⬅ Học lại
        </Link>
      </div>

      <QuizRunner lessonId={lessonId} exercises={exercises} />
    </div>
  );
}
