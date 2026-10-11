import Link from "next/link";
import {
  lessonEmoji,
  statusLabel,
  type LibraryLesson,
} from "./types";

// Màu viền/nền theo trạng thái tiến độ (trẻ em: rõ ràng, dễ nhìn).
function stateStyle(status: string): string {
  if (status === "da-thi") return "border-n-green/60 bg-n-green/10";
  if (status === "da-hoc") return "border-primary/60 bg-primary/10";
  return "border-border bg-card";
}

/**
 * Thẻ bài học trong thư viện — ô lớn, emoji, tên bài, trạng thái.
 * Bấm vào thẻ → vào trang học của bài.
 */
export function LessonCard({ lesson }: { lesson: LibraryLesson }) {
  return (
    <Link
      href={`/ekid/hoc/${lesson.id}`}
      className={`group flex flex-col items-center gap-2 rounded-3xl border-2 p-4 text-center shadow-lg transition-transform hover:scale-[1.03] active:scale-95 ${stateStyle(
        lesson.progress.status,
      )}`}
    >
      <span className="text-5xl" aria-hidden>
        {lessonEmoji(lesson)}
      </span>
      <span className="text-lg font-extrabold leading-tight text-foreground">
        {lesson.title}
      </span>
      <span className="rounded-full bg-background/60 px-3 py-1 text-sm font-bold text-foreground/80">
        {statusLabel(lesson.progress)}
      </span>
    </Link>
  );
}
