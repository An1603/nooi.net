// kid-theme.ts — Bảng màu + class tiện ích cho UI phân hệ con (eKid).
//
// Tone SÁNG, SINH ĐỘNG dành riêng cho trẻ em — KHÁC hẳn tone tối của NOOI
// (người lớn dùng `#1a0a2e` / `bg-background` / `text-foreground` trên nền tối).
// Các file UI của con CHỈ nên dùng hằng/class ở đây (hoặc màu hex tường minh),
// tuyệt đối KHÔNG dùng lại token tối của NOOI.
//
// Cách dùng:
//   import { KID } from "@/components/ekid/child/kid-theme";
//   <div className={KID.page}>…</div>
//   <button className={KID.btnPrimary}>…</button>
//   <div className={KID.cardPad}>…</div>

/** Bảng màu gốc — tươi sáng, thân thiện với trẻ. */
export const KID_COLORS = {
  sky: "#e0f2fe",
  skyDeep: "#bae6fd",
  skyLine: "#c7e8ff",
  cream: "#fffbeb",
  coral: "#ff7a59",
  teal: "#4ecdc4",
  yellow: "#ffd93d",
  purple: "#a78bfa",
  ink: "#3b2a20",
  inkSoft: "#6b5648",
  inkFaint: "#9c8b7e",
  white: "#ffffff",
} as const;

/** Class tiện ích tái dùng cho toàn bộ phân hệ con. */
export const KID = {
  // ── Nền & chữ ────────────────────────────────────────────────
  /** Nền gradient trời → kem cho cả trang. */
  page: "flex min-h-screen flex-col bg-gradient-to-b from-[#e0f2fe] via-[#f7fcff] to-[#fffbeb] text-[#3b2a20]",
  /** Vùng nội dung (không min-h-screen) cùng tông nền. */
  pageInner: "min-h-full bg-gradient-to-b from-[#e0f2fe] via-[#f7fcff] to-[#fffbeb] text-[#3b2a20]",
  text: "text-[#3b2a20]",
  textSoft: "text-[#6b5648]",
  h1: "text-2xl font-extrabold text-[#3b2a20]",
  h2: "text-2xl font-extrabold text-[#3b2a20]",

  // ── Nút (chạm ≥ 48px, bo tròn, đổ bóng nhẹ) ─────────────────
  /** Nút chính — cam san hô. */
  btnPrimary:
    "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#ff7a59] px-7 py-4 text-xl font-extrabold text-white shadow-lg shadow-[#ff7a59]/40 transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
  /** Nút phụ — teal. */
  btnTeal:
    "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#4ecdc4] px-7 py-4 text-xl font-extrabold text-white shadow-lg shadow-[#4ecdc4]/40 transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
  /** Nút viền — nền trắng mờ, chữ teal đậm. */
  btnGhost:
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-[#4ecdc4] bg-white/90 px-5 py-3 text-lg font-extrabold text-[#0d9488] transition-transform hover:scale-[1.03] active:scale-95",
  /** Nút lớn dùng cho CTA chính giữa trang. */
  btnHero:
    "inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-[#ff7a59] px-8 py-4 text-2xl font-extrabold text-white shadow-lg shadow-[#ff7a59]/40 transition-transform hover:scale-[1.03] active:scale-95",

  // ── Thẻ & khối ───────────────────────────────────────────────
  /** Thẻ nền trắng mờ, bo tròn mạnh. */
  card: "rounded-3xl border-2 border-white bg-white/85 shadow-lg shadow-sky-200/50",
  /** Thẻ có padding. */
  cardPad: "rounded-3xl border-2 border-white bg-white/85 p-5 shadow-lg shadow-sky-200/50",

  // ── Biểu mẫu ─────────────────────────────────────────────────
  /** Ô nhập lớn, viền trời, focus teal. */
  input:
    "min-h-[52px] rounded-2xl border-2 border-[#bae6fd] bg-white px-4 py-3 text-xl font-semibold text-[#3b2a20] placeholder:text-[#9c8b7e] focus:border-[#4ecdc4] focus:ring-4 focus:ring-[#4ecdc4]/20 focus:outline-none",
  /** Nhãn trường nhập. */
  label: "text-lg font-bold text-[#3b2a20]",
} as const;
