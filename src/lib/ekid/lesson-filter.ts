// lesson-filter.ts — Lọc thư viện bài học theo CHỦ ĐỀ + từ khoá tìm kiếm.
//
// Hàm THUẦN (không React, không fetch) để trang /bai-hoc chỉ còn việc hiển thị và
// để kiểm thử được logic lọc mà không cần dựng DOM.
//
// Nguyên tắc quan trọng: chip chủ đề chỉ sinh ra từ CHỦ ĐỀ CÓ BÀI THẬT trong dữ liệu
// của bé — không bao giờ hiện ô trống (bé bấm vào mà không có gì).

import type { AgeBand } from "./ekid-system";
import { SUBJECT_ORDER, subjectMeta } from "./subject";

/** Một chip chủ đề trên thanh lọc. */
export interface SubjectChip {
  /** `null` = chip "Tất cả". */
  slug: string | null;
  label: string;
  emoji: string;
  count: number;
}

/** Bài tối thiểu để lọc/nhóm (khớp `LibraryLesson` nhưng không phụ thuộc component). */
export interface FilterableLesson {
  title: string;
  subject?: string | null;
  core_topic?: string | null;
}

const ALL_LABEL = "Tất cả";
const OTHER_SLUG = "__khac__";
const OTHER_LABEL = "Khác";
const OTHER_EMOJI = "📚";

/**
 * Dựng danh sách chip chủ đề từ dữ liệu THẬT:
 * - Luôn có "Tất cả" (đứng đầu).
 * - Chỉ chủ đề có ≥ 1 bài, sắp theo thứ tự của lứa tuổi (chủ đề lạ xếp cuối).
 * - Bài chưa gán chủ đề gom vào chip "Khác" — không giấu bài của bé.
 */
export function subjectChips(
  lessons: readonly FilterableLesson[],
  band: AgeBand | null | undefined,
): SubjectChip[] {
  const counts = new Map<string, number>();
  let unassigned = 0;

  for (const l of lessons) {
    const meta = subjectMeta(l.subject);
    if (meta) counts.set(meta.slug, (counts.get(meta.slug) ?? 0) + 1);
    else unassigned += 1;
  }

  const order = (band && SUBJECT_ORDER[band]) || [];
  const rank = (slug: string): number => {
    const i = order.indexOf(slug);
    return i === -1 ? order.length + 1 : i;
  };

  const chips: SubjectChip[] = [
    { slug: null, label: ALL_LABEL, emoji: "🌈", count: lessons.length },
  ];

  const assigned = [...counts.entries()]
    .map(([slug, count]) => {
      const meta = subjectMeta(slug);
      return {
        slug,
        label: meta?.short ?? slug,
        emoji: meta?.emoji ?? "📘",
        count,
      };
    })
    // Ưu tiên theo lứa tuổi, rồi theo slug để thứ tự ổn định giữa các lần tải.
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));

  chips.push(...assigned);

  if (unassigned > 0) {
    chips.push({ slug: OTHER_SLUG, label: OTHER_LABEL, emoji: OTHER_EMOJI, count: unassigned });
  }

  return chips;
}

/**
 * Chế độ hiển thị thư viện theo lứa tuổi:
 * - Mầm non: KHÔNG hiện ô tìm chữ (bé chưa đọc/không gõ bàn phím), chip TO hơn.
 * - Tiểu học trở lên: có ô tìm chữ, chip cỡ thường.
 * Tách thành hàm thuần để kiểm thử được (đây là quyết định sư phạm, không phải style).
 */
export function libraryViewMode(band: AgeBand | null | undefined): {
  showSearch: boolean;
  bigChips: boolean;
} {
  const isPreschool = band === "mam-non";
  return { showSearch: !isPreschool, bigChips: isPreschool };
}

/** Lọc theo chip đang chọn; `null` hoặc slug không còn tồn tại → trả TẤT CẢ. */
export function filterLessonsBySubject<T extends FilterableLesson>(
  lessons: readonly T[],
  slug: string | null,
): T[] {
  if (!slug) return [...lessons];
  if (slug === OTHER_SLUG) return lessons.filter((l) => !subjectMeta(l.subject));
  // Slug lạ (dữ liệu đổi giữa chừng) → không để bé nhìn màn hình trống.
  if (!lessons.some((l) => l.subject === slug)) return [...lessons];
  return lessons.filter((l) => l.subject === slug);
}

/** Lọc theo từ khoá trên tên bài + chủ đề gốc (không phân biệt hoa/thường). */
export function filterLessonsByQuery<T extends FilterableLesson>(
  lessons: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...lessons];
  return lessons.filter((l) =>
    `${l.title} ${l.core_topic ?? ""}`.toLowerCase().includes(needle),
  );
}
