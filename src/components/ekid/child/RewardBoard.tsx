"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { badgesForProgress } from "@/lib/ekid/ekid-system";
import { KID } from "./kid-theme";

interface Badge {
  code: string;
  label: string;
  earned_at: string;
}

interface RecentItem {
  id: string;
  kind: string;
  label: string;
  points: number;
  created_at: string;
}

interface RewardsData {
  total_points: number;
  badges: Badge[];
  recent: RecentItem[];
}

async function readJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const KIND_EMOJI: Record<string, string> = {
  diem: "⭐",
  "huy-hieu": "🏅",
  sticker: "🌟",
};

/**
 * Bảng thưởng của bé — tổng điểm, các huy hiệu (sáng nếu đã đạt), và hoạt động gần đây.
 * Tự tải `/api/ekid/rewards` (không cần kid_id — server tự suy ra hồ sơ của bé).
 */
export function RewardBoard() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ekid/rewards");
      const d = await readJson(r);
      if (!r.ok) throw new Error((d.error as string) || "Không tải được phần thưởng");
      setData({
        total_points: (d.total_points as number) ?? 0,
        badges: (d.badges as Badge[]) ?? [],
        recent: (d.recent as RecentItem[]) ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi tải phần thưởng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Tất cả mốc huy hiệu (sáng nếu bé đã đạt).
  const allBadges = badgesForProgress(Number.MAX_SAFE_INTEGER);
  const earnedCodes = new Set((data?.badges ?? []).map((b) => b.code));

  if (loading) {
    return <p className="text-center text-xl font-bold text-[#3b2a20]">Đang tải phần thưởng...</p>;
  }

  if (error) {
    return (
      <div className="rounded-3xl border-2 border-[#ff7a59]/50 bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <p className="text-xl font-bold text-[#e15a3a]">{error}</p>
        <button onClick={load} className={`mt-4 ${KID.btnPrimary}`}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border-2 border-[#ffd93d] bg-white/85 p-6 text-center shadow-lg shadow-sky-200/60">
        <p className="text-lg font-bold text-[#6b5648]">Tổng điểm thưởng của bé</p>
        <p className="text-6xl font-extrabold text-[#ff7a59]">
          ⭐ {data?.total_points ?? 0}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={KID.h2}>🏅 Huy hiệu</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {allBadges.map((b) => {
            const earned = earnedCodes.has(b.code);
            return (
              <div
                key={b.code}
                className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-4 text-center ${
                  earned
                    ? "border-[#4ecdc4] bg-[#e6fffb]"
                    : "border-[#e0f2fe] bg-white/80 opacity-50 grayscale"
                }`}
              >
                <span className="text-5xl" aria-hidden>
                  {earned ? "🏅" : "🔒"}
                </span>
                <span className="text-base font-extrabold text-[#3b2a20]">{b.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={KID.h2}>🌟 Hoạt động gần đây</h2>
        {(data?.recent ?? []).length === 0 ? (
          <p className="text-lg font-bold text-[#6b5648]">
            Bé chưa có phần thưởng nào. Làm bài thi để nhận điểm nhé!
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data?.recent.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#e0f2fe] bg-white/85 px-4 py-3 shadow-sm shadow-sky-100"
              >
                <span className="flex items-center gap-2 text-lg font-bold text-[#3b2a20]">
                  <span aria-hidden>{KIND_EMOJI[item.kind] ?? "✨"}</span>
                  {item.label}
                </span>
                {item.kind === "diem" ? (
                  <span className="text-lg font-extrabold text-[#ff7a59]">+{item.points} ⭐</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/ekid" className={`self-center ${KID.btnPrimary}`}>
        ⬅ Về thư viện
      </Link>
    </div>
  );
}
