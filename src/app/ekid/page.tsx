"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LessonCard } from "@/components/ekid/child/LessonCard";
import { EkidTalkCard } from "@/components/ekid/child/EkidTalkCard";
import { KID } from "@/components/ekid/child/kid-theme";
import type { LibraryKid, LibraryLesson } from "@/components/ekid/child/types";
import type { AgeBand } from "@/lib/ekid/ekid-system";

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const PART_LABEL: Record<string, string> = {
  chung: "Bài chung",
  rieng: "Bài riêng",
};

/** Thư viện bài học của bé — lưới thẻ bài, ô tìm theo tên, nhóm theo phần. */
export default function EkidLibraryPage() {
  const [kid, setKid] = useState<LibraryKid | null>(null);
  const [lessons, setLessons] = useState<LibraryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [part, setPart] = useState<string>("all");
  const [remaining, setRemaining] = useState(30);

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

  // Số phút còn lại hôm nay — lấy từ /api/ekid/session, fallback daily_limit_min.
  useEffect(() => {
    if (!kid?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/ekid/session?kid_id=${encodeURIComponent(kid.id)}`, {
          cache: "no-store",
        });
        const d = await readJson(r);
        if (cancelled) return;
        if (r.ok && typeof d.remaining === "number") setRemaining(d.remaining);
        else setRemaining(kid.daily_limit_min ?? 30);
      } catch {
        if (!cancelled) setRemaining(kid.daily_limit_min ?? 30);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kid]);

  // Danh sách nhóm có thật trong dữ liệu (để dựng bộ lọc).
  const parts = useMemo(() => {
    const set = new Set<string>();
    for (const l of lessons) if (l.part) set.add(l.part);
    return Array.from(set);
  }, [lessons]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lessons.filter((l) => {
      if (part !== "all" && l.part !== part) return false;
      if (!needle) return true;
      const hay = `${l.title} ${l.core_topic ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [lessons, q, part]);

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
        <Link href="/thuong" className={KID.btnTeal}>
          🏆 Thưởng
        </Link>
      </div>

      {/* Đầu trang: khung trò chuyện AI (kiểu NOOI AI Mentor). */}
      {kid ? (
        <EkidTalkCard
          kid={{
            name: kid.name,
            favorite_voice: kid.favorite_voice ?? null,
            placement_age_band: (kid.placement_age_band as AgeBand | null) ?? null,
            placement_level: kid.placement_level ?? null,
          }}
          remaining={remaining}
        />
      ) : null}

      {/* Link nhỏ dẫn xuống thư viện bài học bên dưới. */}
      <a
        href="#thu-vien"
        className={`${KID.btnGhost} w-full text-center sm:w-auto sm:self-start`}
      >
        📚 Xem bài học
      </a>

      <div id="thu-vien" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Tìm bài học theo tên..."
          className={`flex-1 ${KID.input}`}
        />
        {parts.length > 0 ? (
          <select
            value={part}
            onChange={(e) => setPart(e.target.value)}
            className="min-h-[52px] rounded-2xl border-2 border-[#bae6fd] bg-white px-4 py-3 text-xl font-bold text-[#3b2a20] focus:border-[#4ecdc4] focus:ring-4 focus:ring-[#4ecdc4]/20 focus:outline-none"
          >
            <option value="all">Tất cả nhóm</option>
            {parts.map((p) => (
              <option key={p} value={p}>
                {PART_LABEL[p] ?? p}
              </option>
            ))}
          </select>
        ) : null}
      </div>

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
