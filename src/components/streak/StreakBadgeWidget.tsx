"use client";

import { useEffect, useState } from "react";
import { Flame, Award, Sparkles } from "lucide-react";
import Link from "next/link";

interface Badge {
  id: string; name: string; icon: string; require: number; earned: boolean; earned_at: string | null;
}

export default function StreakBadgeWidget() {
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newBadge, setNewBadge] = useState<{ name: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Auto check-in + get streak
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
  }, []);

  const earned = badges.filter((b) => b.earned);
  const nextBadge = badges.find((b) => !b.earned);
  const nextRequire = nextBadge?.require || 0;
  const progress = nextRequire > 0 ? Math.min(100, Math.round((streak / nextRequire) * 100)) : 100;

  return (
    <>
      {/* Streak bar */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="font-semibold text-sm">Chuỗi ngày</h2>
          </div>
          <span className={`text-lg font-bold ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`}>
            {streak} ngày
          </span>
        </div>
        {nextBadge && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Huy hiệu tiếp theo: {nextBadge.icon} {nextBadge.name}</span>
              <span>{streak}/{nextRequire}</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {/* Badge row */}
        {earned.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/50">
            {earned.slice(-5).map((b) => (
              <span key={b.id} className="text-[10px] px-2 py-1 rounded-full bg-muted/30" title={b.name}>
                {b.icon} {b.name}
              </span>
            ))}
            {earned.length > 5 && <span className="text-[10px] text-muted-foreground">+{earned.length - 5}</span>}
          </div>
        )}
      </div>

      {/* New badge notification */}
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
