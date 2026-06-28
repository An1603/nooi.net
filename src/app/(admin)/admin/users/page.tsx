import { createAdminClient } from "@/lib/supabase/admin";
import { Shield, Mail, Calendar, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminUserRow {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export default async function AdminUsersPage() {
  const supabase = createAdminClient();

  // Fetch admin_users
  const { data: adminUsers } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, onboarding_completed, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const adminMap = new Map(
    (adminUsers as AdminUserRow[] | null)?.map((a) => [a.user_id, a]) ?? []
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Người dùng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tài khoản người dùng trên NOOI.net
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Hiển thị {(profiles as ProfileRow[] | null)?.length ?? 0} người dùng gần đây nhất
        </div>
      </div>

      {/* Admin users section */}
      <div className="rounded-xl border border-primary/20 bg-[#0d0d0d] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Quản trị viên</h2>
          <span className="text-xs text-muted-foreground">
            ({(adminUsers as AdminUserRow[] | null)?.length ?? 0})
          </span>
        </div>
        <div className="space-y-2">
          {(adminUsers as AdminUserRow[] | null)?.map((a) => (
            <div
              key={a.user_id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-border/20"
            >
              <Shield className="size-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.email}</p>
                <p className="text-[10px] text-muted-foreground">
                  {a.role === "super_admin" ? "Super Admin" : "Admin"}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
          ))}
          {(!adminUsers || (adminUsers as AdminUserRow[]).length === 0) && (
            <p className="text-xs text-muted-foreground py-2">Chưa có quản trị viên nào.</p>
          )}
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Người dùng</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Vai trò</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {(profiles as ProfileRow[] | null)?.map((p) => {
                const admin = adminMap.get(p.user_id);
                return (
                  <tr key={p.user_id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(p.full_name || "U")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.full_name || "Chưa đặt tên"}
                            {admin && (
                              <Shield className="size-3 text-primary inline ml-1.5 -mt-0.5" />
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {p.onboarding_completed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="size-3" /> Hoàn thành
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                          <XCircle className="size-3" /> Chưa setup
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {admin ? (
                        <span className="text-xs text-primary font-medium">
                          {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(p.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!profiles || (profiles as ProfileRow[]).length === 0) && (
          <p className="text-xs text-muted-foreground p-4 text-center">
            Chưa có người dùng nào.
          </p>
        )}
      </div>
    </div>
  );
}
