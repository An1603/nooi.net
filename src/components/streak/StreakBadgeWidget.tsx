"use client";

import { useEffect, useState } from "react";
import { Flame, Award, Sparkles, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

interface Badge {
  id: string; name: string; icon: string; require: number; earned: boolean; earned_at: string | null;
}

const BADGE_COLORS: Record<number, string> = {
  1: "from-amber-400 to-yellow-500",
  7: "from-orange-400 to-red-500",
  14: "from-red-400 to-pink-500",
  21: "from-pink-400 to-purple-500",
  30: "from-purple-400 to-indigo-500",
  60: "from-cyan-400 to-blue-500",
  100: "from-yellow-300 to-amber-500",
};

const BADGE_BG: Record<number, string> = {
  1: "bg-amber-500/10 border-amber-500/20",
  7: "bg-orange-500/10 border-orange-500/20",
  14: "bg-red-500/10 border-red-500/20",
  21: "bg-pink-500/10 border-pink-500/20",
  30: "bg-purple-500/10 border-purple-500/20",
  60: "bg-cyan-500/10 border-cyan-500/20",
  100: "bg-yellow-500/10 border-yellow-500/20",
};

export default function StreakBadgeWidget() {
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newBadge, setNewBadge] = useState<{ name: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekDays, setWeekDays] = useState<{ date: string; label: string; active: boolean }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/streak", { method: "POST" });
        const data = await res.json();
        if (data.streak !== undefined) setStreak(data.streak);
        if (data.badges) setBadges(data.badges);
        if (data.newBadges?.length > 0) {
          setNewBadge(data.newBadges[0]);
          setTimeout(() => setNewBadge(null), 5000);
        }
      } catch {}
      setLoading(false);
    })();

    // Fetch 7-day activity from stats
    (async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.weekDays) setWeekDays(data.weekDays);
      } catch {}
    })();
  }, []);

  const earned = badges.filter((b) => b.earned);
  const nextBadge = badges.find((b) => !b.earned);
  const nextRequire = nextBadge?.require || 0;
  const progress = nextRequire > 0 ? Math.min(100, Math.round((streak / nextRequire) * 100)) : 100;

  return (
    <>
      <div className="rounded-xl border border-orange-500/15 bg-gradient-to-br from-orange-500/5 via-card to-red-500/5 p-5 card-elevated relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${streak > 0 ? "bg-orange-500/15 border border-orange-500/20" : "bg-muted/20 border border-border"} transition-all`}>
              <Flame className={`w-5 h-5 ${streak > 0 ? "text-orange-400 animate-pulse" : "text-muted-foreground"}`} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Chuỗi ngày</h2>
              <p className="text-[12px] text-muted-foreground">Duy trì mỗi ngày để nhận thưởng</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`}>
              {streak}
            </span>
            <span className="text-xs text-muted-foreground ml-1">ngày</span>
          </div>
        </div>

        {/* 7-day activity dots */}
        {weekDays.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 justify-center mb-4">
            {weekDays.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  day.active
                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                    : "bg-muted/20 text-muted-foreground/50 border border-border/50"
                }`}>
                  {day.active ? <Flame className="w-3.5 h-3.5" /> : "·"}
                </div>
                <span className="text-[12px] text-muted-foreground">{day.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress to next badge */}
        {nextBadge && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Huy hiệu tiếp theo: {nextBadge.icon} {nextBadge.name}</span>
              <span className="font-mono">{streak}/{nextRequire}</span>
            </div>
            <div className="h-2.5 bg-muted/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-primary rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Badge collection */}
        {earned.length > 0 && (
          <div className="pt-3 border-t border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="w-3 h-3" /> Huy hiệu ({earned.length}/{badges.length})
              </span>
              <Link href="/app/kho-vat-pham" className="text-[12px] text-primary hover:underline flex items-center gap-0.5">
                Xem tất cả <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {earned.slice(-6).map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${BADGE_BG[b.require] || "bg-muted/20 border-border"} transition-all hover:scale-105`}
                  title={`${b.name} — Đạt ${b.require} ngày`}
                >
                  <span className="text-base">{b.icon}</span>
                  <span className="font-medium">{b.require}d</span>
                </div>
              ))}
              {earned.length > 6 && (
                <span className="text-xs text-muted-foreground self-center">+{earned.length - 6}</span>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && streak === 0 && earned.length === 0 && (
          <div className="text-center py-2">
            <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Bắt đầu streak hôm nay!</p>
          </div>
        )}
      </div>

      {/* New badge popup */}
      {newBadge && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in-up rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 shadow-2xl backdrop-blur-md max-w-[calc(100vw-32px)]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{newBadge.icon}</span>
            <div>
              <p className="text-xs text-yellow-400 font-medium">🏅 Huy hiệu mới!</p>
              <p className="text-sm font-bold">{newBadge.name}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
