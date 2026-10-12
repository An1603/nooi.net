"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EkidTalkScreen, type TalkKid } from "@/components/ekid/child/EkidTalkScreen";
import { KID } from "@/components/ekid/child/kid-theme";
import type { LibraryKid } from "@/components/ekid/child/types";
import type { AgeBand } from "@/lib/ekid/ekid-system";

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Trang chủ con (eKid) — chỉ màn hình trò chuyện + sân khấu trình chiếu.
 * Thư viện bài học đã TÁCH sang trang riêng `/bai-hoc`.
 */
export default function EkidHomePage() {
  const [kid, setKid] = useState<TalkKid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ekid/library", { cache: "no-store" });
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không tải được hồ sơ bé");
      const k = (d.kid as LibraryKid) ?? null;
      if (!k) throw new Error("Không tìm thấy hồ sơ bé");
      setKid({
        id: k.id,
        name: k.name,
        favorite_voice: k.favorite_voice ?? null,
        placement_age_band: (k.placement_age_band as AgeBand | null) ?? null,
        placement_level: k.placement_level ?? null,
        memory: k.memory ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi tải hồ sơ bé");
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
      } catch {
        // Giữ giá trị mặc định.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kid]);

  if (loading) {
    return (
      <p className="py-10 text-center text-xl font-bold text-[#3b2a20]">
        Đang mở phòng trò chuyện...
      </p>
    );
  }

  if (error || !kid) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-[#ff7a59]/50 bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <p className="text-xl font-bold text-[#e15a3a]">{error ?? "Không tìm thấy hồ sơ bé"}</p>
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

  return <EkidTalkScreen kid={kid} remaining={remaining} />;
}
