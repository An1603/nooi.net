"use client";

import { useEffect, useState } from "react";
import { Flame, BookHeart, Award, TrendingUp } from "lucide-react";

interface WeekDay { date: string; label: string; active: boolean; }
interface Week { label: string; count: number; }

export default function DashboardStats() {
  const [stats, setStats] = useState<{
    streak: number; totalJournals: number; totalN: number; level: number; levelName: string;
    weekDays: WeekDay[]; weeks: Week[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.streak !== undefined) setStats(data);
      } catch {}
    })();
  }, []);

  if (!stats) return null;

  const maxWeekCount = Math.max(...stats.weeks.map((w) => w.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-xl font-bold">{stats.streak}</p>
          <p className="text-xs text-muted-foreground">Streak</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <BookHeart className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{stats.totalJournals}</p>
          <p className="text-xs text-muted-foreground">Nhật ký</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Award className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{stats.totalN}</p>
          <p className="text-xs text-muted-foreground">N (NOOI)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{stats.level}</p>
          <p className="text-xs text-muted-foreground">{stats.levelName}</p>
        </div>
      </div>

      {/* Heatmap 7 ngày */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Hoạt động 7 ngày qua</h2>
        <div className="flex gap-2 justify-center">
          {stats.weekDays.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium ${
                day.active ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"
              }`}>
                {day.active ? "✓" : "•"}
              </div>
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Nhật ký theo tuần</h2>
        <div className="flex items-end gap-3 h-28">
          {stats.weeks.map((week) => (
            <div key={week.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-xs text-muted-foreground">{week.count}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all"
                style={{ height: `${(week.count / maxWeekCount) * 100}%`, minHeight: week.count > 0 ? "6px" : "2px" }}
              />
              <span className="text-[10px] text-muted-foreground">{week.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
