import { createAdminClient } from "@/lib/supabase/admin";
import { FolderOpen, Users, Eye, Calendar, Clock } from "lucide-react";
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

  // Get video/doc counts per project
  const projectIds = (projects ?? []).map((p: { id: string }) => p.id);

  const [{ data: videoCounts }, { data: docCounts }] = await Promise.all([
    projectIds.length > 0
      ? supabase.from("videos").select("project_id").in("project_id", projectIds)
      : { data: [] },
    projectIds.length > 0
      ? supabase.from("documents").select("project_id").in("project_id", projectIds)
      : { data: [] },
  ]);

  const videoMap = new Map<string, number>();
  (videoCounts ?? []).forEach((v: { project_id: string }) => {
    videoMap.set(v.project_id, (videoMap.get(v.project_id) || 0) + 1);
  });
  const docMap = new Map<string, number>();
  (docCounts ?? []).forEach((d: { project_id: string }) => {
    docMap.set(d.project_id, (docMap.get(d.project_id) || 0) + 1);
  });

  const statusColors: Record<string, string> = {
    draft: "bg-muted/30 text-muted-foreground",
    in_progress: "bg-amber-500/10 text-amber-400",
    completed: "bg-emerald-500/10 text-emerald-400",
    archived: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dự án</h1>
        <p className="text-sm text-muted-foreground mt-1">Tất cả dự án của người dùng trên hệ thống</p>
      </div>

      <div className="grid gap-3">
        {(projects ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground p-8 text-center">Chưa có dự án nào.</p>
        ) : (
          (projects ?? []).map((p) => (
            <div key={p.id} className="rounded-xl border border-border/50 bg-[#0d0d0d] p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderOpen className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColors[p.status] || statusColors.draft}`}>
                        {p.status === "in_progress" ? "Đang làm" : p.status}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="size-3" /> {ownerNames.get(p.user_id) || p.user_id.slice(0, 8)}</span>
                      <span className="flex items-center gap-1"><Eye className="size-3" /> {videoMap.get(p.id) || 0} video · {docMap.get(p.id) || 0} tài liệu</span>
                      <span><Calendar className="size-3 inline" /> {new Date(p.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>
                <Link href={`/admin/users/${p.user_id}`} className="text-[10px] text-primary hover:underline shrink-0">Xem user</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
