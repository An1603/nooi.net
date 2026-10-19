// subject.ts — Chủ đề (môn) của bài học eKid: nguồn chuẩn DUY NHẤT cho nhãn + emoji
// + thứ tự hiển thị theo lứa tuổi. Dùng chung cho thẻ bài, bộ lọc thư viện và
// (sau này) chỉ dẫn AI.
//
// Vì sao có lớp này: `core_topic` là chuỗi tự do của người soạn bài ("Đếm số lượng",
// "Đọc hiểu") nên không lọc/nhóm được. Cột `ekid_lessons.subject` giữ SLUG chuẩn
// (không dấu), còn nhãn tiếng Việt + emoji sống ở đây — đổi nhãn không cần sửa DB.
//
// Cách chia theo LỨA TUỔI (không dùng "KH tự nhiên/KH xã hội" cho mầm non–tiểu học:
// đó là phân môn THCS trở lên, chia theo góc nhìn người lớn sẽ khó cho bé).

import type { AgeBand } from "./ekid-system";

export interface SubjectMeta {
  /** Slug lưu trong `ekid_lessons.subject`. */
  slug: string;
  /** Nhãn tiếng Việt hiện cho người lớn/trẻ lớn. */
  label: string;
  /** Nhãn NGẮN cho chip trên thẻ bài của bé (tối đa ~14 ký tự). */
  short: string;
  emoji: string;
  /** Lứa tuổi mà chủ đề này có nghĩa. */
  bands: readonly AgeBand[];
}

export const SUBJECTS: readonly SubjectMeta[] = [
  // ── Mầm non ────────────────────────────────────────────────────────────────
  { slug: "chu-cai", label: "Chữ cái & tập đọc", short: "Chữ cái", emoji: "🔤", bands: ["mam-non"] },
  { slug: "so-dem", label: "Số đếm & hình khối", short: "Số đếm", emoji: "🔢", bands: ["mam-non"] },
  { slug: "mau-sac", label: "Màu sắc & hội hoạ", short: "Màu sắc", emoji: "🎨", bands: ["mam-non"] },
  { slug: "dong-vat", label: "Thế giới động vật", short: "Động vật", emoji: "🐯", bands: ["mam-non"] },
  { slug: "gia-dinh", label: "Gia đình & cơ thể", short: "Gia đình", emoji: "👨‍👩‍👧", bands: ["mam-non"] },

  // ── Tiểu học ───────────────────────────────────────────────────────────────
  { slug: "toan", label: "Toán", short: "Toán", emoji: "➕", bands: ["tieu-hoc", "thieu-nien"] },
  { slug: "tieng-viet", label: "Tiếng Việt", short: "Tiếng Việt", emoji: "🇻🇳", bands: ["tieu-hoc"] },
  {
    slug: "tu-nhien-xa-hoi",
    label: "Tự nhiên & Xã hội",
    short: "Tự nhiên",
    emoji: "🌳",
    bands: ["tieu-hoc"],
  },
  { slug: "tieng-anh", label: "Tiếng Anh", short: "Tiếng Anh", emoji: "🇬🇧", bands: ["tieu-hoc"] },

  // ── Thiếu niên ─────────────────────────────────────────────────────────────
  { slug: "ngu-van", label: "Ngữ văn", short: "Ngữ văn", emoji: "📖", bands: ["thieu-nien"] },
  {
    slug: "khoa-hoc-tu-nhien",
    label: "Khoa học tự nhiên",
    short: "KHTN",
    emoji: "🔬",
    bands: ["thieu-nien"],
  },
  {
    slug: "khoa-hoc-xa-hoi",
    label: "Khoa học xã hội",
    short: "KHXH",
    emoji: "🌏",
    bands: ["thieu-nien"],
  },
  { slug: "tin-hoc-ai", label: "Tin học & AI", short: "Tin học & AI", emoji: "💻", bands: ["thieu-nien"] },

  // ── Dùng chung ─────────────────────────────────────────────────────────────
  {
    slug: "ky-nang-song",
    label: "Kỹ năng sống",
    short: "Kỹ năng sống",
    emoji: "🌱",
    bands: ["mam-non", "tieu-hoc", "thieu-nien"],
  },
];

/** Thứ tự hiển thị chủ đề của từng lứa (chủ đề hay gặp trước). */
export const SUBJECT_ORDER: Record<AgeBand, readonly string[]> = {
  "mam-non": ["chu-cai", "so-dem", "mau-sac", "dong-vat", "gia-dinh", "ky-nang-song"],
  "tieu-hoc": ["toan", "tieng-viet", "tu-nhien-xa-hoi", "tieng-anh", "ky-nang-song"],
  "thieu-nien": [
    "toan",
    "ngu-van",
    "khoa-hoc-tu-nhien",
    "khoa-hoc-xa-hoi",
    "tin-hoc-ai",
    "ky-nang-song",
  ],
};

/** Toàn bộ slug hợp lệ (dùng cho CHECK ở DB và kiểm tra dữ liệu). */
export const SUBJECT_SLUGS: readonly string[] = SUBJECTS.map((s) => s.slug);

const BY_SLUG = new Map<string, SubjectMeta>(SUBJECTS.map((s) => [s.slug, s]));

/** Tra một chủ đề theo slug; slug lạ/trống → null (nơi gọi tự quyết định ẩn chip). */
export function subjectMeta(slug: string | null | undefined): SubjectMeta | null {
  if (!slug) return null;
  return BY_SLUG.get(slug) ?? null;
}

/** Chủ đề của MỘT lứa, theo đúng thứ tự hiển thị. */
export function subjectsForBand(band: AgeBand | null | undefined): SubjectMeta[] {
  if (!band) return [];
  const order = SUBJECT_ORDER[band] ?? [];
  return order.map((slug) => BY_SLUG.get(slug)).filter((s): s is SubjectMeta => !!s);
}

/** Nhãn ngắn để hiện trên chip; slug lạ → giữ nguyên slug đã làm sạch. */
export function subjectShortLabel(slug: string | null | undefined): string | null {
  const meta = subjectMeta(slug);
  if (meta) return meta.short;
  const raw = (slug ?? "").trim();
  return raw ? raw : null;
}
