import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  LogOut,
  Activity,
  UserPlus,
  Users2,
  UserCheck,
  BookOpen,
  FileText,
  Video,
  FolderOpen,
  TrendingUp,
} from "lucide-react";
import { RouteLoader } from "@/components/Loading";

const NAV_ITEMS = [
  // Dashboard
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },

  // Quản lý con người
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/mentors", label: "Mentor (Lv6+)", icon: UserPlus },
  { href: "/admin/groups", label: "Nhóm", icon: Users2 },
  { href: "/admin/roles", label: "Phân quyền", icon: Shield },

  // Quản lý nội dung
  { href: "/admin/live", label: "Lớp Live", icon: Video },
  { href: "/admin/lessons", label: "Bài giảng", icon: BookOpen },
  { href: "/admin/learning", label: "Tiến độ học", icon: TrendingUp },
  { href: "/admin/documents", label: "Tài liệu", icon: FileText },
  { href: "/admin/videos", label: "Video", icon: Video },
  { href: "/admin/projects", label: "Dự án", icon: FolderOpen },

  // Theo dõi & Cấu hình
  { href: "/admin/activity", label: "Hoạt động", icon: Activity },
  { href: "/admin/evaluate", label: "Đánh giá", icon: UserCheck },
  { href: "/admin/settings", label: "Cấu hình", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin-login");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <Shield className="size-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400">403 — Cấm truy cập</h1>
          <p className="text-muted-foreground mt-2">Bạn không có quyền quản trị.</p>
          <Link href="/app" className="text-primary hover:underline mt-4 inline-block">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = adminUser.role === "super_admin";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <RouteLoader />
      {/* Sidebar */}
      <aside className="w-60 bg-[#0d0d0d] border-r border-border/30 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-border/20">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <span className="font-bold text-sm tracking-wide">
              NOOI <span className="text-primary">Admin</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
            {user.email}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-primary font-medium uppercase tracking-wider">
              {adminUser.role === "super_admin" ? "Super Admin" : adminUser.role === "admin" ? "Admin" : "Mod"}
            </span>
            {isSuperAdmin && (
              <Link href="/admin/roles" className="text-[12px] text-primary hover:underline">Quản trị</Link>
            )}
          </div>
          <a
            href="/auth/logout"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 mt-2 transition-colors"
          >
            <LogOut className="size-3" />
            Đăng xuất
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
