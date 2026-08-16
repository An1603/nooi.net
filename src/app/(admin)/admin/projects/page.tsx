import { createAdminClient } from "@/lib/supabase/admin";
import { FolderOpen, Users, Eye, Calendar, DollarSign, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const supabase = createAdminClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  const ownerNames = new Map<string,string>();
  if (!error && (projects ?? []).length > 0) {
    const userIds = Array.from(new Set((projects ?? []).map((p: { user_id: string }) => p.user_id)));
    const { data: users } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    (users ?? []).forEach((u: { user_id?: string; full_name?: string }) => {
      if (u.user_id) ownerNames.set(u.user_id, u.full_name || u.user_id.slice(0, 8));
    });
  }

  if (error) return <div className="p-6 text-red-400">Lỗi: {error.message}</div>;

  const statusColors: Record<string, string> = {
    draft: "bg-muted/30 text-muted-foreground",
    in_progress: "bg-n-green/15 text-n-green",
    completed: "bg-n-teal/15 text-n-teal",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quản lý dự án</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý tất cả dự án đầu tư trong hệ thống</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <Plus size={16} />
          Thêm dự án
        </Link>
      </div>

      <div className="grid gap-3">
        {(projects ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground p-8 text-center">Chưa có dự án nào.</p>
        ) : (
          (projects ?? []).map((p) => (
            <div key={p.id} className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderOpen className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${statusColors[p.status] || statusColors.draft}`}>
                        {p.status === "in_progress" ? "Đang mở" : p.status}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="size-3" /> {ownerNames.get(p.user_id) || p.user_id?.slice(0, 8)}</span>
                      {p.investment_target > 0 && (
                        <span className="flex items-center gap-1"><DollarSign className="size-3" /> {new Intl.NumberFormat("vi-VN").format(p.investment_target)}đ</span>
                      )}
                      <span><Calendar className="size-3 inline" /> {new Date(p.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>
                <Link href={`/admin/projects/${p.id}`} className="text-[11px] text-primary hover:underline shrink-0">
                  Chỉnh sửa
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
