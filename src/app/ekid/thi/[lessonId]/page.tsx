"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QuizRunner } from "@/components/ekid/child/QuizRunner";
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
      <p className="py-10 text-center text-xl font-bold text-foreground">
        Đang mở bài thi...
      </p>
    );
  }

  if (error || !lesson) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-destructive/50 bg-card p-6 text-center">
        <p className="text-xl font-bold text-destructive">{error ?? "Không tìm thấy bài học"}</p>
        <Link
          href="/ekid"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground"
        >
          ⬅ Về thư viện
        </Link>
      </div>
    );
  }

  const exercises: PublicExercise[] = lesson.exercises ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-foreground">
          📝 {lesson.title}
        </h1>
        <Link
          href={`/ekid/hoc/${lessonId}`}
          className="rounded-full border-2 border-border bg-card px-5 py-2.5 text-lg font-bold text-foreground"
        >
          ⬅ Học lại
        </Link>
      </div>

      <QuizRunner lessonId={lessonId} exercises={exercises} />
    </div>
  );
}
