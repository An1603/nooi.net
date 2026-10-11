import Link from "next/link";
import { lessonEmoji, statusLabel, type LibraryLesson } from "./types";

// Màu viền/nền theo trạng thái tiến độ (trẻ em: tươi sáng, rõ ràng, dễ nhìn).
function stateStyle(status: string): string {
  if (status === "da-thi") return "border-[#4ecdc4] bg-[#e6fffb]";
  if (status === "da-hoc") return "border-[#ffd93d] bg-[#fffdf0]";
  return "border-[#e0f2fe] bg-white/90";
}

/**
 * Thẻ bài học trong thư viện — ô lớn, emoji, tên bài, trạng thái.
 * Bấm vào thẻ → vào trang học của bài.
 */
export function LessonCard({ lesson }: { lesson: LibraryLesson }) {
  return (
    <Link
      href={`/ekid/hoc/${lesson.id}`}
      className={`group flex flex-col items-center gap-2 rounded-3xl border-2 p-4 text-center shadow-lg shadow-sky-200/50 transition-transform hover:scale-[1.03] active:scale-95 ${stateStyle(
        lesson.progress.status,
      )}`}
    >
      <span className="text-5xl" aria-hidden>
        {lessonEmoji(lesson)}
      </span>
      <span className="text-lg font-extrabold leading-tight text-[#3b2a20]">
        {lesson.title}
      </span>
      <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-sm font-bold text-[#6b5648]">
        {statusLabel(lesson.progress)}
      </span>
    </Link>
  );
}
