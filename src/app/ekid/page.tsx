"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LessonCard } from "@/components/ekid/child/LessonCard";
import type { LibraryKid, LibraryLesson } from "@/components/ekid/child/types";

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ekid/library");
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
      <p className="py-10 text-center text-xl font-bold text-foreground">
        Đang mở thư viện...
      </p>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-destructive/50 bg-card p-6 text-center">
        <p className="text-xl font-bold text-destructive">{error}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={load}
            className="rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground"
          >
            Thử lại
          </button>
          <Link
            href="/login"
            className="rounded-full border-2 border-primary px-6 py-3 text-lg font-extrabold text-primary"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-foreground">
          <span aria-hidden className="mr-1">
            {kid?.avatar_emoji ?? "🦊"}
          </span>
          Thư viện của {kid?.name ?? "bé"}
        </h1>
        <Link
          href="/ekid/thuong"
          className="rounded-full bg-primary px-6 py-3 text-xl font-extrabold text-primary-foreground shadow-md"
        >
          🏆 Thưởng
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Tìm bài học theo tên..."
          className="flex-1 rounded-2xl border-2 border-border bg-card px-4 py-3 text-xl text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
        />
        {parts.length > 0 ? (
          <select
            value={part}
            onChange={(e) => setPart(e.target.value)}
            className="rounded-2xl border-2 border-border bg-card px-4 py-3 text-xl font-bold text-foreground focus:border-primary focus:outline-none"
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
        <p className="py-10 text-center text-xl font-bold text-foreground/70">
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
