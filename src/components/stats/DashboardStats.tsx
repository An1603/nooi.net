"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, BookHeart, Award, TrendingUp, FolderOpen, Video, FileText, Book } from "lucide-react";
import { LevelInfoModal } from "@/components/LevelInfoModal";
import { LevelCard } from "@/components/LevelCard";

interface WeekDay { date: string; label: string; active: boolean; }
interface Week { label: string; count: number; }

interface Props {
  projectCount?: number;
  videoCount?: number;
  docCount?: number;
  journalCount?: number;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500];

const CONTENT_STATS = [
  { label: "Dự án", icon: FolderOpen, color: "text-blue-400", href: "/app/projects" },
  { label: "Video", icon: Video, color: "text-red-400", href: "/app/videos" },
  { label: "Tài liệu", icon: FileText, color: "text-purple-400", href: "/app/library" },
  { label: "Nhật ký", icon: Book, color: "text-cyan-400", href: "/app/journal" },
];

export default function DashboardStats({ projectCount = 0, videoCount = 0, docCount = 0, journalCount = 0 }: Props) {
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

  const counts = [projectCount, videoCount, docCount, journalCount];

  if (!stats) return null;

  const maxWeekCount = Math.max(...stats.weeks.map((w) => w.count), 1);
  const nForNext = LEVEL_THRESHOLDS[Math.min(stats.level, 6)];
  const nCurrent = LEVEL_THRESHOLDS[stats.level - 1];
  const progressPercent = stats.totalN >= 2500
    ? 100
    : Math.min(100, Math.round(((stats.totalN - nCurrent) / (nForNext - nCurrent)) * 100));

  return (
    <div className="space-y-6">
      {/* Content stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CONTENT_STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}
              className="p-4 rounded-xl border border-border bg-card hover:bg-card/80 hover:border-primary/30 transition-all touch-target block"
            >
              <Icon className={`w-5 h-5 ${s.color} mb-1.5`} />
              <div className="text-xl font-bold">{counts[i]}</div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">{s.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Summary row */}
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
        <LevelInfoModal
          currentN={stats.totalN}
          currentLevel={stats.level}
          currentLevelName={stats.levelName}
          trigger={
            <div className="rounded-xl border border-border bg-card p-4 text-center cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-all">
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{stats.level}</p>
              <p className="text-xs text-muted-foreground">Cấp độ</p>
              <p className="text-[10px] text-primary mt-0.5">{stats.levelName}</p>
            </div>
          }
        />
      </div>

      {/* Level Card chi tiết */}
      <LevelInfoModal
        currentN={stats.totalN}
        currentLevel={stats.level}
        currentLevelName={stats.levelName}
        trigger={
          <div className="cursor-pointer">
            <LevelCard
              level={stats.level}
              levelName={stats.levelName}
              n={stats.totalN}
              nForNext={nForNext}
              progressPercent={progressPercent}
            />
          </div>
        }
      />

      {/* Heatmap */}
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
