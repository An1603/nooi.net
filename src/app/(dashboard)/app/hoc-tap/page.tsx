"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Play, ChevronRight, Lock, CheckCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LEVELS = [
  {
    id: 1, name: "Người mới", desc: "Bắt đầu hành trình chuyển hóa",
    lessons: [
      { id: "1-1", title: "NOOI là gì?", type: "video", duration: "15:00" },
      { id: "1-2", title: "Vì sao NOOI ra đời?", type: "video", duration: "12:00" },
      { id: "1-3", title: "Bản đồ con người", type: "video", duration: "20:00" },
      { id: "1-4", title: "Bản đồ khổ đau", type: "video", duration: "18:00" },
      { id: "1-5", title: "Bắt đầu thực hành", type: "practice", duration: "10:00" },
    ],
    nRequired: 0,
  },
  {
    id: 2, name: "Người tìm kiếm", desc: "Hiểu rõ bản thân",
    lessons: [
      { id: "2-1", title: "Quan sát thân-tâm", type: "video", duration: "15:00" },
      { id: "2-2", title: "Nhận diện cảm xúc", type: "video", duration: "12:00" },
      { id: "2-3", title: "Thiền căn bản", type: "video", duration: "20:00" },
      { id: "2-4", title: "Bài tập: Nhật ký cảm xúc", type: "practice", duration: "15:00" },
    ],
    nRequired: 100,
  },
  {
    id: 3, name: "Học viên", desc: "Xây nền tảng vững chắc",
    lessons: [
      { id: "3-1", title: "Chánh niệm trong đời sống", type: "video", duration: "20:00" },
      { id: "3-2", title: "Quản trị tâm trí", type: "video", duration: "15:00" },
      { id: "3-3", title: "Thực hành: Đi bộ chánh niệm", type: "practice", duration: "10:00" },
    ],
    nRequired: 300,
  },
  {
    id: 4, name: "Người thực hành", desc: "Chuyển hóa hàng ngày",
    lessons: [
      { id: "4-1", title: "Chuyển hóa cảm xúc", type: "video", duration: "20:00" },
      { id: "4-2", title: "Sống chánh niệm", type: "video", duration: "15:00" },
    ],
    nRequired: 600,
  },
  {
    id: 5, name: "Người đồng hành", desc: "Lan tỏa giá trị",
    lessons: [
      { id: "5-1", title: "Lắng nghe sâu", type: "video", duration: "15:00" },
      { id: "5-2", title: "Đồng hành cùng người khác", type: "video", duration: "20:00" },
    ],
    nRequired: 1000,
  },
  {
    id: 6, name: "Mentor", desc: "Hướng dẫn người khác",
    lessons: [
      { id: "6-1", title: "Kỹ năng Mentor", type: "video", duration: "25:00" },
    ],
    nRequired: 1500,
  },
  { id: 7, name: "Master Mentor", desc: "Làm chủ hành trình", lessons: [], nRequired: 2500 },
];

interface LessonProgress {
  lesson_id: string;
  pct: number;
  completed: boolean;
}

const totalLessons = LEVELS.reduce((sum, l) => sum + l.lessons.length, 0);

export default function LearningHub() {
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [n, setN] = useState(0);

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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
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
        <p className="text-[10px] text-muted-foreground mt-2">
          {n} N · {n < 2500 ? `${n}/2500 N để đạt Master Mentor` : "🏆 Tối đa"}
        </p>
      </div>

      {/* Levels */}
      <div className="space-y-4">
        {LEVELS.map((level) => {
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
                      <span className="text-[10px] text-muted-foreground">{levelDone}/{level.lessons.length} ({levelPct}%)</span>
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
                    return (
                      <Link key={lesson.id} href={`/app/hoc-tap/${lesson.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.completed ? "bg-green-500/10 text-green-400" : "bg-muted/30 text-muted-foreground"}`}>
                          {p.completed ? <CheckCircle className="w-4 h-4" /> : lesson.type === "video" ? <Play className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{lesson.title}</p>
                            {p.pct > 0 && <span className="text-[10px] text-muted-foreground shrink-0">{p.pct}%</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{lesson.duration} · {lesson.type === "video" ? "Video" : "Thực hành"}</p>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-12 h-1.5 bg-muted/30 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${p.pct}%` }} />
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
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
