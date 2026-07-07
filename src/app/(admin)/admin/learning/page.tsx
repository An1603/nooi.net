import { createAdminClient } from "@/lib/supabase/admin";
import { BookOpen, Users, CheckCircle, BarChart3, TrendingUp, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLearningPage() {
  const supabase = createAdminClient();

  // Get all lesson_progress entries
  const { data: progress } = await supabase
    .from("documents")
    .select("id, user_id, title, content")
    .eq("file_type", "lesson_progress")
    .limit(5000);

  // Stats
  const lessonCounts = new Map<string, { total: number; completed: number }>();
  const userSet = new Set<string>();

  (progress ?? []).forEach((p: { id: string; user_id: string; title: string; content: string | null }) => {
    userSet.add(p.user_id);
    const c = lessonCounts.get(p.title) || { total: 0, completed: 0 };
    c.total++;
    try {
      const d = JSON.parse(p.content || "{}");
      if (d.completed) c.completed++;
    } catch {
      if (p.content === "completed") c.completed++;
    }
    lessonCounts.set(p.title, c);
  });

  const totalLessons = 22;
  const completedAll = Array.from(lessonCounts.values()).filter((c) => c.completed > 0).length;

  // User completion stats
  const userLessonMap = new Map<string, number>();
  (progress ?? []).forEach((p: { user_id: string; title: string; content: string | null }) => {
    let completed = false;
    try {
      const d = JSON.parse(p.content || "{}");
      completed = d.completed;
    } catch { completed = p.content === "completed"; }
    if (completed) {
      userLessonMap.set(p.user_id, (userLessonMap.get(p.user_id) || 0) + 1);
    }
  });

  const topUsers = Array.from(userLessonMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Get names for top users
  const topUserIds = topUsers.map(([id]) => id);
  const { data: topProfiles } = topUserIds.length > 0
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", topUserIds)
    : { data: [] };
  const nameMap = new Map((topProfiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]));

  const statsCards = [
    { label: "Tổng bài học", value: totalLessons, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "User đang học", value: userSet.size, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Bài đã hoàn thành", value: completedAll, icon: CheckCircle, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Tổng progress records", value: (progress ?? []).length, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Nội dung học tập</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý lộ trình học và tiến độ người dùng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <div className={`size-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`size-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Lessons */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
        <div className="px-5 py-4 border-b border-border/20">
          <h2 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="size-4 text-primary" /> Chi tiết từng bài</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Bài học</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Người học</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Đã hoàn thành</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Tỉ lệ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {Array.from(lessonCounts.entries())
                .sort((a, b) => b[1].total - a[1].total)
                .map(([lessonId, stats]) => {
                  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  return (
                    <tr key={lessonId} className="hover:bg-white/[0.01]">
                      <td className="px-5 py-3 text-sm font-medium">{lessonId}</td>
                      <td className="px-5 py-3 text-center text-xs">{stats.total}</td>
                      <td className="px-5 py-3 text-center text-xs">{stats.completed}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top learners */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-4 text-amber-400" />
          <h2 className="text-sm font-semibold">Top người học</h2>
        </div>
        {topUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Chưa có dữ liệu học tập.</p>
        ) : (
          <div className="space-y-2">
            {topUsers.map(([userId, count], i) => (
              <div key={userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02]">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right">#{i + 1}</span>
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {(nameMap.get(userId) || "?")[0].toUpperCase()}
                </div>
                <span className="text-xs flex-1">{nameMap.get(userId) || userId.slice(0, 8)}</span>
                <span className="text-[10px] text-muted-foreground">{count} bài</span>
                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((count / totalLessons) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
