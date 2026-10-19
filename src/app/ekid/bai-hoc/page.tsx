"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LessonCard } from "@/components/ekid/child/LessonCard";
import { KID } from "@/components/ekid/child/kid-theme";
import type { LibraryKid, LibraryLesson } from "@/components/ekid/child/types";
import type { AgeBand } from "@/lib/ekid/ekid-system";
import {
  filterLessonsByQuery,
  filterLessonsBySubject,
  libraryViewMode,
  subjectChips,
} from "@/lib/ekid/lesson-filter";

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const BANDS: readonly string[] = ["mam-non", "tieu-hoc", "thieu-nien"];

function asAgeBand(v: string | null | undefined): AgeBand | null {
  return v && BANDS.includes(v) ? (v as AgeBand) : null;
}

/**
 * Trang bài học riêng của con (eKid) — thư viện + LỌC THEO CHỦ ĐỀ.
 * URL ngắn `/bai-hoc` (middleware rewrite → `/ekid/bai-hoc`).
 *
 * - Chip chủ đề CHỈ sinh ra từ chủ đề CÓ BÀI thật → không bao giờ có ô trống.
 * - Chip lớn, chạm được bằng ngón tay bé; mầm non dùng chip to hơn.
 * - Bé mầm non KHÔNG phải gõ chữ: ô tìm kiếm chỉ hiện từ tiểu học trở lên.
 * - Bộ lọc "Nhóm bài" (chung/riêng) đã BỎ — khái niệm vận hành, không phải của bé.
 */
export default function EkidLibraryPage() {
  const [kid, setKid] = useState<LibraryKid | null>(null);
  const [lessons, setLessons] = useState<LibraryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string | null>(null);

  const band = asAgeBand(kid?.placement_age_band);
  const { showSearch, bigChips } = libraryViewMode(band);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ekid/library", { cache: "no-store" });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không tải được thư viện");
      setKid((d.kid as LibraryKid) ?? null);
      setLessons((d.lessons as LibraryLesson[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi tải thư viện");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chips = useMemo(() => subjectChips(lessons, band), [lessons, band]);

  // Dữ liệu đổi (tải lại/đổi hồ sơ) → bỏ chọn chủ đề không còn tồn tại.
  useEffect(() => {
    if (subject && !chips.some((c) => c.slug === subject)) setSubject(null);
  }, [chips, subject]);

  const filtered = useMemo(() => {
    const bySubject = filterLessonsBySubject(lessons, subject);
    return filterLessonsByQuery(bySubject, showSearch ? q : "");
  }, [lessons, subject, q, showSearch]);

  if (loading) {
    return (
      <p className="py-10 text-center text-xl font-bold text-[#3b2a20]">
        Đang mở thư viện...
      </p>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-[#ff7a59]/50 bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <p className="text-xl font-bold text-[#e15a3a]">{error}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button onClick={load} className={KID.btnPrimary}>
            Thử lại
          </button>
          <Link href="/login" className={KID.btnGhost}>
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={KID.h1}>
          <span aria-hidden className="mr-1">
            {kid?.avatar_emoji ?? "🦊"}
          </span>
          Thư viện của {kid?.name ?? "bé"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className={KID.btnGhost}>
            🎙️ Trò chuyện
          </Link>
          <Link href="/thuong" className={KID.btnTeal}>
            🏆 Thưởng
          </Link>
        </div>
      </div>

      {/* ── Chip chủ đề: chỉ chủ đề CÓ BÀI, chạm lớn, rõ trạng thái đang chọn ── */}
      {chips.length > 1 ? (
        <div role="group" aria-label="Chọn chủ đề" className="flex flex-wrap gap-2 sm:gap-3">
          {chips.map((c) => {
            const active = c.slug === subject;
            const size = bigChips
              ? "min-h-[60px] px-5 py-3 text-lg"
              : "min-h-[48px] px-4 py-2 text-base";
            const tone = active
              ? "border-[#4ecdc4] bg-[#4ecdc4] text-white shadow-md shadow-[#4ecdc4]/40"
              : "border-[#e0f2fe] bg-white/90 text-[#3b2a20] hover:border-[#bae6fd]";
            return (
              <button
                key={c.slug ?? "all"}
                type="button"
                aria-pressed={active}
                data-chip={c.slug ?? "all"}
                onClick={() => setSubject(c.slug)}
                className={`inline-flex items-center justify-center gap-2 rounded-full border-2 font-extrabold transition-transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4ecdc4]/40 ${size} ${tone}`}
              >
                <span aria-hidden className={bigChips ? "text-2xl" : "text-xl"}>
                  {c.emoji}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Ô tìm chữ: chỉ từ tiểu học (bé mầm non không gõ bàn phím). */}
      {showSearch ? (
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Tìm bài học theo tên..."
          className={`w-full ${KID.input}`}
        />
      ) : null}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-xl font-bold text-[#6b5648]">
          {lessons.length === 0
            ? "Chưa có bài học nào cho bé. Bé quay lại sau nhé!"
            : "Không tìm thấy bài học nào khớp."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((l) => (
            <LessonCard key={l.id} lesson={l} />
          ))}
        </div>
      )}
    </div>
  );
}
