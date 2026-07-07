import { createAdminClient } from "@/lib/supabase/admin";
import { BookOpen, Play, Sparkles, Lock, CheckCircle, Users, Film } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ─── Lesson structure mirroring hoc-tap/page.tsx ──────────────────────────
const LEVELS = [
  {
    id: 1, name: "Người mới", desc: "Bắt đầu hành trình chuyển hóa",
    lessons: [
      { id: "1-1", title: "NOOI là gì?", type: "video", duration: "15:00", youtubeId: "" },
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

export default async function AdminLessonsPage() {
  const supabase = createAdminClient();

  // Fetch lesson progress stats
  const { data: progress } = await supabase
    .from("documents")
    .select("title, content")
    .eq("file_type", "lesson_progress")
    .limit(5000);

  const lessonStats = new Map<string, { total: number; completed: number }>();
  (progress ?? []).forEach((p: { title: string; content: string | null }) => {
    const c = lessonStats.get(p.title) || { total: 0, completed: 0 };
    c.total++;
    try { const d = JSON.parse(p.content || "{}"); if (d.completed) c.completed++; }
    catch { if (p.content === "completed") c.completed++; }
    lessonStats.set(p.title, c);
  });

  const totalLessons = LEVELS.reduce((sum, l) => sum + l.lessons.length, 0);
  const completedCount = Array.from(lessonStats.values()).filter(c => c.completed > 0).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bài giảng Học tập</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý video bài giảng trong lộ trình chuyển hóa 7 cấp
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Film className="size-4 text-primary" />
          <span>{totalLessons} bài · </span>
          {completedCount} đã có người học
        </div>
      </div>

      {/* Note */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-400 font-medium">📌 Hiện tại bài giảng đang được định nghĩa trong code.</p>
        <p className="text-[10px] text-amber-400/70 mt-1">
          Các video YouTube cần được cập nhật youtubeId trong file <code className="bg-amber-500/10 px-1 rounded">hoc-tap/page.tsx</code>.
          Trang này hiển thị cấu trúc để tham khảo và theo dõi tiến độ.
        </p>
      </div>

      {/* Levels */}
      {LEVELS.map((level) => {
        const levelProgress = level.lessons.map(l => ({
          ...l,
          stats: lessonStats.get(l.id) || { total: 0, completed: 0 },
        }));
        const levelDone = levelProgress.filter(l => l.stats.completed > 0).length;
        const levelPct = level.lessons.length > 0 ? Math.round((levelDone / level.lessons.length) * 100) : 0;

        return (
          <div key={level.id} className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
            {/* Level header */}
            <div className="px-5 py-4 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Level {level.id}</span>
                <h2 className="text-sm font-semibold">{level.name}</h2>
                <span className="text-[10px] text-muted-foreground">{level.desc}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>Người học: {levelProgress.reduce((s, l) => s + l.stats.total, 0)}</span>
                <span>Cần {level.nRequired} N</span>
                {level.lessons.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${levelPct}%` }} />
                    </div>
                    <span>{levelPct}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lessons */}
            {level.lessons.length === 0 ? (
              <div className="px-5 py-4 text-[10px] text-muted-foreground text-center">Chưa có bài học</div>
            ) : (
              <div className="divide-y divide-border/10">
                {levelProgress.map((lesson) => {
                  const pct = lesson.stats.total > 0 ? Math.round((lesson.stats.completed / lesson.stats.total) * 100) : 0;
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.01] transition-colors">
                      {/* Type icon */}
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                        lesson.type === "video" ? "bg-red-500/10" : "bg-purple-500/10"
                      }`}>
                        {lesson.type === "video" ? <Play className="size-4 text-red-400" /> : <Sparkles className="size-4 text-purple-400" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{lesson.title}</span>
                          <span className="text-[10px] text-muted-foreground">({lesson.id})</span>
                          {lesson.type === "video" && !(lesson as {youtubeId?: string}).youtubeId && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400">Chưa có video</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{lesson.type === "video" ? "📹 Video" : "✏️ Thực hành"}</span>
                          <span>⏱ {lesson.duration}</span>
                          <span>👤 {lesson.stats.total} học viên</span>
                          {lesson.stats.completed > 0 && <span>✓ {lesson.stats.completed} hoàn thành</span>}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {lesson.stats.total > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
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
  );
}
