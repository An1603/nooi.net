import { createAdminClient } from "@/lib/supabase/admin";
import { Activity, BookOpen, UserPlus, Calendar, LogIn, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  journal: { icon: <BookOpen className="size-3.5" />, label: "Nhật ký", color: "text-cyan-400 bg-cyan-500/10" },
  signup: { icon: <UserPlus className="size-3.5" />, label: "Đăng ký", color: "text-emerald-400 bg-emerald-500/10" },
  registration: { icon: <LogIn className="size-3.5" />, label: "Đăng ký Live", color: "text-amber-400 bg-amber-500/10" },
};

export default async function AdminActivityPage() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // Recent journals
  const { data: journals } = await supabase
    .from("documents")
    .select("id, title, created_at, user_id")
    .eq("file_type", "journal")
    .order("created_at", { ascending: false })
    .limit(30);

  // Today stats
  const { count: todayJournals } = await supabase
    .from("documents").select("*", { count: "exact", head: true })
    .eq("file_type", "journal").gte("created_at", today).lt("created_at", tomorrow);
  const { count: todaySignups } = await supabase
    .from("profiles").select("*", { count: "exact", head: true })
    .gte("created_at", today).lt("created_at", tomorrow);

  // Resolve user names
  const userIds = [...new Set((journals ?? []).map((j: { user_id: string }) => j.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]));

  const feed = (journals ?? []).map((j: { id: string; title: string; created_at: string; user_id: string }) => ({
    type: "journal" as const,
    id: j.id,
    user_id: j.user_id,
    user_name: nameMap.get(j.user_id) || j.user_id.slice(0, 8),
    title: j.title || "(no title)",
    created_at: j.created_at,
  }));

  const todayStatCards = [
    { label: "Nhật ký hôm nay", value: todayJournals ?? 0, icon: BookOpen, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Đăng ký hôm nay", value: todaySignups ?? 0, icon: UserPlus, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Tổng hoạt động", value: feed.length, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Hoạt động</h1>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi hoạt động gần đây trên hệ thống</p>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {todayStatCards.map((card) => {
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

      {/* Activity feed */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
        <div className="px-5 py-4 border-b border-border/20">
          <h2 className="text-sm font-semibold">Dòng thời gian</h2>
        </div>
        {feed.length === 0 ? (
          <p className="text-xs text-muted-foreground p-8 text-center">Chưa có hoạt động nào.</p>
        ) : (
          <div className="divide-y divide-border/10">
            {feed.map((item) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.journal;
              return (
                <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.01] transition-colors">
                  <div className={`mt-0.5 size-7 rounded-lg ${cfg.color.split(" ")[1]} flex items-center justify-center shrink-0`}>
                    <span className={cfg.color.split(" ")[0]}>{cfg.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{item.user_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString("vi-VN", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
