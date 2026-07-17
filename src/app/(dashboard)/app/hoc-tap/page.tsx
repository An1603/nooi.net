"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Play, ChevronRight, Lock, CheckCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Level metadata (names, descriptions, unlock thresholds) ───────────────
// These are business config, not yet in the database.
const LEVEL_META = [
  { id: 1, name: "🌰 Member", desc: "Bắt đầu hành trình chuyển hóa", nRequired: 0 },
  { id: 2, name: "Seeker 🌱", desc: "Hiểu rõ bản thân", nRequired: 100 },
  { id: 3, name: "Grower 🌿", desc: "Xây nền tảng vững chắc", nRequired: 300 },
  { id: 4, name: "Giver 🌳", desc: "Chuyển hóa hàng ngày", nRequired: 700 },
  { id: 5, name: "Guider 🌲", desc: "Lan tỏa giá trị", nRequired: 1200 },
  { id: 6, name: "Mentor 🌳", desc: "Hướng dẫn người khác", nRequired: 2200 },
  { id: 7, name: "Master 👑", desc: "Làm chủ hành trình", nRequired: 3500 },
];

// ─── Hardcoded fallback lessons (used when API is unavailable) ──────────────
const FALLBACK_LESSONS: Record<number, Array<{
  id: string; title: string; type: string; duration: string; free?: boolean;
}>> = {
  1: [
    { id: "1-1", title: "NOOI là gì?", type: "video", duration: "15:00", free: true },
    { id: "1-2", title: "Vì sao NOOI ra đời?", type: "video", duration: "12:00" },
    { id: "1-3", title: "Bản đồ con người", type: "video", duration: "20:00" },
    { id: "1-4", title: "Bản đồ khổ đau", type: "video", duration: "18:00" },
    { id: "1-5", title: "Bắt đầu thực hành", type: "practice", duration: "10:00", free: true },
  ],
  2: [
    { id: "2-1", title: "Quan sát thân-tâm", type: "video", duration: "15:00" },
    { id: "2-2", title: "Nhận diện cảm xúc", type: "video", duration: "12:00" },
    { id: "2-3", title: "Thiền căn bản", type: "video", duration: "20:00" },
    { id: "2-4", title: "Bài tập: Nhật ký cảm xúc", type: "practice", duration: "15:00" },
  ],
  3: [
    { id: "3-1", title: "Chánh niệm trong đời sống", type: "video", duration: "20:00" },
    { id: "3-2", title: "Quản trị tâm trí", type: "video", duration: "15:00" },
    { id: "3-3", title: "Thực hành: Đi bộ chánh niệm", type: "practice", duration: "10:00" },
  ],
  4: [
    { id: "4-1", title: "Chuyển hóa cảm xúc", type: "video", duration: "20:00" },
    { id: "4-2", title: "Sống chánh niệm", type: "video", duration: "15:00" },
  ],
  5: [
    { id: "5-1", title: "Lắng nghe sâu", type: "video", duration: "15:00" },
    { id: "5-2", title: "Đồng hành cùng người khác", type: "video", duration: "20:00" },
  ],
  6: [
    { id: "6-1", title: "Kỹ năng Mentor", type: "video", duration: "25:00" },
  ],
  7: [],
};

type LessonShape = { id: string; title: string; type: string; duration: string; free?: boolean };
type LevelShape = { id: number; name: string; desc: string; lessons: LessonShape[]; nRequired: number };

interface LessonProgress {
  lesson_id: string;
  pct: number;
  completed: boolean;
}

/** Build LEVELS array from level metadata + lesson records keyed by level_id */
function buildLevels(lessonsByLevel: Record<number, LessonShape[]>): LevelShape[] {
  return LEVEL_META.map((meta) => ({
    ...meta,
    lessons: lessonsByLevel[meta.id] ?? [],
  }));
}

const defaultLevels = buildLevels(FALLBACK_LESSONS);
const totalLessons = defaultLevels.reduce((sum, l) => sum + l.lessons.length, 0);

export default function LearningHub() {
  const [levels, setLevels] = useState<LevelShape[]>(defaultLevels);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [n, setN] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // ── Fetch lessons from public API ──────────────────────────────
        const res = await fetch("/api/lessons");
        if (res.ok) {
          const { lessons } = await res.json() as {
            lessons: Array<{
              level_id: number;
              lesson_id: string;
              title: string;
              type: string;
              duration: string;
            }>;
          };
          // Group by level_id
          const grouped: Record<number, LessonShape[]> = {};
          for (const l of lessons) {
            if (!grouped[l.level_id]) grouped[l.level_id] = [];
            grouped[l.level_id].push({
              id: l.lesson_id,
              title: l.title,
              type: l.type,
              duration: l.duration,
            });
          }
          setLevels(buildLevels(grouped));
        }
      } catch {
        // API failed — keep fallback (defaultLevels)
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { count } = await supabase.from("documents")
          .select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("file_type", "journal");
        setN((count ?? 0) * 10);

        const { data } = await supabase.from("documents")
          .select("title, content").eq("user_id", user.id).eq("file_type", "lesson_progress");
        if (data) {
          setProgress(data.map((d) => {
            try {
              const c = JSON.parse(d.content);
              return { lesson_id: d.title, pct: c.pct || 0, completed: c.completed || false };
            } catch { return { lesson_id: d.title, pct: 0, completed: d.content === "completed" }; }
          }));
        }
      } catch {}
    })();
  }, []);

  const getLesson = (id: string) => {
    const p = progress.find((p) => p.lesson_id === id);
    return p || { pct: 0, completed: false };
  };

  const completedCount = progress.filter((p) => p.completed).length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isUnlocked = (nRequired: number) => n >= nRequired;

  // Flat list of all lessons in order for prev-lesson check
  const allLessons = levels.flatMap((l) => l.lessons.map((lesson) => ({ ...lesson, levelNRequired: l.nRequired })));
  const isLessonAccessible = (lessonId: string, nRequired: number) => {
    if (n >= nRequired) {
      const idx = allLessons.findIndex((l) => l.id === lessonId);
      if (idx <= 0) return true; // first lesson or free
      const prev = allLessons[idx - 1];
      if (prev.free) return true;
      const prevProgress = progress.find((p) => p.lesson_id === prev.id);
      return prevProgress?.completed || false;
    }
    return false;
  };

  return (
    <div className="page-shell page-shell-wide space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Học tập</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Lộ trình chuyển hóa từ cơ bản đến nâng cao</p>
        </div>
      </div>

      {/* Progress overview */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Tiến trình tổng thể</p>
          <p className="text-xs text-muted-foreground">{completedCount}/{totalLessons} bài · {overallPct}%</p>
        </div>
        <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {n} N · {n < 3500 ? `${n}/3500 N để đạt Master 👑` : "🏆 Tối đa"}
        </p>
      </div>

      {/* Levels */}
      <div className="space-y-4">
        {levels.map((level) => {
          const unlocked = isUnlocked(level.nRequired);
          const levelDone = level.lessons.filter((l) => getLesson(l.id).completed).length;
          const levelPct = level.lessons.length > 0 ? Math.round((levelDone / level.lessons.length) * 100) : 0;
          return (
            <div key={level.id} className={`rounded-xl border ${unlocked ? "border-border bg-card" : "border-border/50 bg-card/50 opacity-60"} overflow-hidden`}>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${unlocked ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"}`}>Level {level.id}</span>
                    {!unlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                    {unlocked && level.lessons.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">{levelDone}/{level.lessons.length} ({levelPct}%)</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mt-2">{level.name}</h3>
                  <p className="text-xs text-muted-foreground">{level.desc}</p>
                </div>
                {!unlocked && <p className="text-xs text-muted-foreground text-right">Cần {level.nRequired} N</p>}
              </div>
              {unlocked && level.lessons.length > 0 && (
                <div className="border-t border-border/50 divide-y divide-border/30">
                  {level.lessons.map((lesson) => {
                    const p = getLesson(lesson.id);
                    const accessible = isLessonAccessible(lesson.id, level.nRequired);
                    return (
                      <div key={lesson.id} className={`${accessible ? "" : "opacity-50"}`}>
                        {accessible ? (
                          <Link href={`/app/hoc-tap/${lesson.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.completed ? "bg-green-500/10 text-green-400" : "bg-muted/30 text-muted-foreground"}`}>
                              {p.completed ? <CheckCircle className="w-4 h-4" /> : lesson.type === "video" ? <Play className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{lesson.title}</p>
                                {p.pct > 0 && <span className="text-[11px] text-muted-foreground shrink-0">{p.pct}%</span>}
                              </div>
                              <p className="text-[11px] text-muted-foreground">{lesson.duration} · {lesson.type === "video" ? "Video" : "Thực hành"}</p>
                            </div>
                            <div className="w-12 h-1.5 bg-muted/30 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${p.pct}%` }} />
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-5 py-3 cursor-not-allowed">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/30 text-muted-foreground">
                              <Lock className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-muted-foreground">{lesson.title}</p>
                              <p className="text-[11px] text-muted-foreground">Cần hoàn thành bài trước</p>
                            </div>
                            {lesson.free && <span className="text-[11px] text-primary">Free</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
