import { createAdminClient } from "@/lib/supabase/admin";
import { Users, UserPlus, UserCheck, Activity, TrendingUp, BookOpen, Video, FileText, FolderOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createAdminClient();

  // Users
  const { count: totalProfiles } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: completedOnboarding } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_completed", true);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentSignups } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
  const { count: adminCount } = await supabase.from("admin_users").select("*", { count: "exact", head: true });

  // Reports
  const { count: hasNumerology } = await supabase.from("profiles").select("*", { count: "exact", head: true }).not("numerology_report", "is", null);
  const { count: hasTuVi } = await supabase.from("profiles").select("*", { count: "exact", head: true }).not("tuvi_report", "is", null);
  const { count: hasAstrology } = await supabase.from("profiles").select("*", { count: "exact", head: true }).not("chiem_tinh_report", "is", null);

  // Content
  const { count: totalJournals } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("file_type", "journal");
  const { count: totalDocuments } = await supabase.from("documents").select("*", { count: "exact", head: true }).neq("file_type", "journal");
  const { count: totalProjects } = await supabase.from("projects").select("*", { count: "exact", head: true });
  const { count: totalLiveSessions } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("file_type", "live_session");
  const { count: totalVideos } = await supabase.from("videos").select("*", { count: "exact", head: true });

  // Active writers (users with at least 1 journal in last 7 days)
  const { data: activeWriters } = await supabase
    .from("documents")
    .select("user_id")
    .eq("file_type", "journal")
    .gte("created_at", sevenDaysAgo)
    .limit(1000);
  const activeWritersCount = activeWriters ? new Set(activeWriters.map(r => r.user_id)).size : 0;

  // Total N (approximate: each journal = 10N)
  const totalN = (totalJournals ?? 0) * 10;

  return {
    totalProfiles: totalProfiles ?? 0,
    completedOnboarding: completedOnboarding ?? 0,
    recentSignups: recentSignups ?? 0,
    adminCount: adminCount ?? 0,
    hasNumerology: hasNumerology ?? 0,
    hasTuVi: hasTuVi ?? 0,
    hasAstrology: hasAstrology ?? 0,
    totalJournals: totalJournals ?? 0,
    totalDocuments: totalDocuments ?? 0,
    totalProjects: totalProjects ?? 0,
    totalLiveSessions: totalLiveSessions ?? 0,
    totalVideos: totalVideos ?? 0,
    activeWriters: activeWritersCount,
    totalN,
  };
}

async function getRecentLiveSessions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("documents")
    .select("id, title, content, created_at")
    .eq("file_type", "live_session")
    .order("created_at", { ascending: false })
    .limit(5);
  return (data || []).map(d => {
    try {
      const c = JSON.parse(d.content || "{}");
      return {
        id: d.id, title: d.title,
        date: c.date || "", time: c.time || "",
        registered: c.registered || 0, max_participants: c.max_participants || 0,
        mentor: c.mentor_name || "",
      };
    } catch { return { id: d.id, title: d.title, date: "", time: "", registered: 0, max_participants: 0, mentor: "" }; }
  });
}

async function getRecentJournals() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("documents")
    .select("id, title, created_at, user_id")
    .eq("file_type", "journal")
    .order("created_at", { ascending: false })
    .limit(8);
  return data || [];
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const liveSessions = await getRecentLiveSessions();
  const recentJournals = await getRecentJournals();

  const cards = [
    { label: "Tổng người dùng", value: stats.totalProfiles, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Hoàn thành onboarding", value: stats.completedOnboarding, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Đăng ký mới (7 ngày)", value: stats.recentSignups, icon: UserPlus, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Đang tích cực viết", value: stats.activeWriters, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  const contentCards = [
    { label: "Nhật ký", value: stats.totalJournals, sub: `${stats.totalN.toLocaleString("vi-VN")} N`, icon: BookOpen, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Tài liệu", value: stats.totalDocuments, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Dự án", value: stats.totalProjects, icon: FolderOpen, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Video", value: stats.totalVideos, icon: Video, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Lớp Live", value: stats.totalLiveSessions, icon: Users, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  const modules = [
    { label: "Thần số học", value: stats.hasNumerology, total: stats.totalProfiles },
    { label: "Tử Vi", value: stats.hasTuVi, total: stats.totalProfiles },
    { label: "Chiêm tinh", value: stats.hasAstrology, total: stats.totalProfiles },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thống kê hệ thống NOOI.net
        </p>
      </div>

      {/* Hướng dẫn nhanh */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <h3 className="text-sm font-semibold text-amber-400 mb-2">🧭 Sơ đồ quản trị</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div><strong>👥 Người dùng</strong><br/>CRUD, phân quyền, báo cáo</div>
          <div><strong>📖 Bài giảng</strong><br/>Lộ trình 7 cấp, lesson CRUD</div>
          <div><strong>🎥 Lớp Live</strong><br/>Quản lý sessions, đăng ký</div>
          <div><strong>📄 Tài liệu</strong><br/>All documents cross-user</div>
          <div><strong>🌟 Mentor</strong><br/>Quản lý mentor (Lv6+)</div>
          <div><strong>🛡️ Phân quyền</strong><br/>Assign admin roles</div>
          <div><strong>👥 Nhóm</strong><br/>Groups + members</div>
          <div><strong>📈 Hoạt động</strong><br/>Activity feed + stats</div>
          <div><strong>✓ Đánh giá</strong><br/>Evaluate users</div>
          <div><strong>⚙️ Cấu hình</strong><br/>Levels, N points, badges</div>
          <div><strong>📊 Tiến độ</strong><br/>Lesson progress stats</div>
          <div><strong>🎬 Video</strong><br/>All videos overview</div>
        </div>
      </div>

      {/* User stats */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Người dùng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                  <div className={`size-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`size-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{card.value.toLocaleString("vi-VN")}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content stats */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Nội dung</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {contentCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground">{card.label}</span>
                  <div className={`size-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`size-3.5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-lg font-bold">{card.value.toLocaleString("vi-VN")}</p>
                {card.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Module usage */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Sử dụng module thiên văn</h2>
        </div>
        <div className="space-y-3">
          {modules.map((m) => {
            const pct = m.total > 0 ? Math.round((m.value / m.total) * 100) : 0;
            return (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.value} / {m.total} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Sessions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Sessions */}
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Lớp Live gần đây</h2>
            </div>
            <Link href="/admin/users" className="text-[10px] text-primary hover:underline">Quản lý</Link>
          </div>
          {liveSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Chưa có buổi học nào.</p>
          ) : (
            <div className="space-y-2">
              {liveSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {s.date} · {s.time || "—"} · {s.mentor || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {s.registered}/{s.max_participants}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Journals */}
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Nhật ký gần đây</h2>
            </div>
            <Link href="/admin/users" className="text-[10px] text-primary hover:underline">Tất cả user</Link>
          </div>
          {recentJournals.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Chưa có nhật ký nào.</p>
          ) : (
            <div className="space-y-1.5">
              {recentJournals.map((j) => (
                <div key={j.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {(j.title || "N")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{j.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {j.user_id?.slice(0, 8)}... · {new Date(j.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
        <h2 className="text-sm font-semibold mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/users", label: "Quản lý người dùng" },
            { href: "https://supabase.com/dashboard/project/gsnuqrutiauhnsacgzym", label: "Supabase Dashboard", external: true },
            { href: "https://nooi.net/admin-login", label: "Trang đăng nhập Admin", external: true },
            { href: "https://github.com/An1603/nooi.net", label: "GitHub Repo", external: true },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="block px-4 py-3 rounded-lg border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-white/[0.02] transition-all text-center"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
