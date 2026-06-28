import { createAdminClient } from "@/lib/supabase/admin";
import { Users, UserPlus, UserCheck, Activity, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createAdminClient();

  // Total auth users (via admin API is better, but we can approximate)
  const { count: totalProfiles } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Completed onboarding
  const { count: completedOnboarding } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("onboarding_completed", true);

  // Has numerology
  const { count: hasNumerology } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("numerology_report", "is", null);

  // Has TuVi
  const { count: hasTuVi } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("tuvi_report", "is", null);

  // Has Astrology
  const { count: hasAstrology } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("chiem_tinh_report", "is", null);

  // Admin count
  const { count: adminCount } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true });

  // Recent signups (last 7 days from profiles)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentSignups } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  return {
    totalProfiles: totalProfiles ?? 0,
    completedOnboarding: completedOnboarding ?? 0,
    hasNumerology: hasNumerology ?? 0,
    hasTuVi: hasTuVi ?? 0,
    hasAstrology: hasAstrology ?? 0,
    adminCount: adminCount ?? 0,
    recentSignups: recentSignups ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Tổng người dùng", value: stats.totalProfiles, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Hoàn thành onboarding", value: stats.completedOnboarding, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Đăng ký mới (7 ngày)", value: stats.recentSignups, icon: UserPlus, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Quản trị viên", value: stats.adminCount, icon: Activity, color: "text-purple-400", bg: "bg-purple-500/10" },
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4">
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

      {/* Module usage */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Sử dụng module</h2>
        </div>
        <div className="space-y-3">
          {modules.map((m) => {
            const pct = m.total > 0 ? Math.round((m.value / m.total) * 100) : 0;
            return (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">
                    {m.value} / {m.total} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
        <h2 className="text-sm font-semibold mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/users", label: "Quản lý người dùng" },
            { href: "https://supabase.com/dashboard/project/gsnuqrutiauhnsacgzym", label: "Supabase Dashboard", external: true },
            { href: "https://nooi.net", label: "NOOI.net", external: true },
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
