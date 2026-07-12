"use client";

import { useEffect, useState } from "react";
import { BarChart3, Flame, BookHeart, Award, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Stats {
  streak: number;
  weekDays: { date: string; label: string; active: boolean }[];
  weeks: { label: string; count: number }[];
  totalJournals: number;
  totalN: number;
  level: number;
  levelName: string;
  badges: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.streak !== undefined) setStats(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

   if (loading) return <div className="page-shell page-shell-narrow"><p className="text-muted-foreground">Đang tải...</p></div>;
  if (!stats) return <div className="page-shell page-shell-narrow"><p className="text-muted-foreground">Không có dữ liệu.</p></div>;

  const maxWeekCount = Math.max(...stats.weeks.map((w) => w.count), 1);

  return (
    <div className="page-shell page-shell-wide space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thống kê</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Hành trình chuyển hóa của bạn qua các con số</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.streak}</p>
          <p className="text-xs text-muted-foreground">Streak</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <BookHeart className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.totalJournals}</p>
          <p className="text-xs text-muted-foreground">Nhật ký</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Award className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.totalN}</p>
          <p className="text-xs text-muted-foreground">N (NOOI)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.level}</p>
          <p className="text-xs text-muted-foreground">{stats.levelName}</p>
        </div>
      </div>

      {/* Weekly heatmap */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Hoạt động 7 ngày qua</h2>
        <div className="flex gap-2 justify-center">
          {stats.weekDays.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                day.active ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"
              }`}>
                {day.active ? "✓" : "•"}
              </div>
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Journal bar chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Nhật ký theo tuần</h2>
        <div className="flex items-end gap-3 h-32">
          {stats.weeks.map((week) => (
            <div key={week.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-xs text-muted-foreground">{week.count}</span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all"
                style={{ height: `${(week.count / maxWeekCount) * 100}%`, minHeight: week.count > 0 ? "8px" : "4px" }}
              />
              <span className="text-[10px] text-muted-foreground">{week.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-2">Huy hiệu</h2>
        <p className="text-xs text-muted-foreground">Đã đạt {stats.badges} huy hiệu</p>
        <Link href="/app/hoc-tap" className="text-xs text-primary hover:underline mt-2 inline-block">Xem lộ trình học tập →</Link>
      </div>
    </div>
  );
}
