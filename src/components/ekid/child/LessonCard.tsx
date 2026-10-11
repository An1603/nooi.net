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
 *
 * - Bài bình thường: bấm vào thẻ → vào trang học của bài.
 * - Bài `locked` (thi đạt mới sang bài): hiện mờ + 🔒 và KHÔNG cho bấm vào.
 */
export function LessonCard({ lesson }: { lesson: LibraryLesson }) {
  const locked = lesson.locked === true;

  const inner = (
    <>
      <span className="relative text-5xl" aria-hidden>
        {lessonEmoji(lesson)}
        {locked ? <span className="absolute -right-3 -top-2 text-2xl">🔒</span> : null}
      </span>
      <span className="text-lg font-extrabold leading-tight text-[#3b2a20]">
        {lesson.title}
      </span>
      {locked ? (
        <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-sm font-bold text-[#64748b]">
          Chưa mở
        </span>
      ) : (
        <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-sm font-bold text-[#6b5648]">
          {statusLabel(lesson.progress)}
        </span>
      )}
    </>
  );

  if (locked) {
    return (
      <div
        aria-disabled="true"
        title="Con cần hoàn thành bài trước đã nhé!"
        className="flex cursor-not-allowed flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-[#cbd5e1] bg-white/60 p-4 text-center opacity-70 grayscale"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/hoc/${lesson.id}`}
      className={`group flex flex-col items-center gap-2 rounded-3xl border-2 p-4 text-center shadow-lg shadow-sky-200/50 transition-transform hover:scale-[1.03] active:scale-95 ${stateStyle(
        lesson.progress.status,
      )}`}
    >
      {inner}
    </Link>
  );
}
