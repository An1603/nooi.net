import { createAdminClient } from "@/lib/supabase/admin";
import { Play, Users, Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const supabase = createAdminClient();

  // Bước 1: lấy videos
  const { data: videos, error } = await supabase
    .from("videos")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return <div className="p-6 text-red-400">Lỗi: {error.message}</div>;

  // Bước 2: lấy tên user riêng (không join do thiếu FK)
  const userIds = [...new Set((videos ?? []).map((v: { user_id: string }) => v.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
    : { data: [] };
  const nameMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]));

  // Bước 3: đếm videos theo project
  const projectIds = [...new Set((videos ?? []).map((v: { project_id: string | null }) => v.project_id).filter(Boolean))];
  const { data: projects } = projectIds.length > 0
    ? await supabase.from("projects").select("id, title").in("id", projectIds)
    : { data: [] };
  const projectMap = new Map((projects ?? []).map((p: { id: string; title: string }) => [p.id, p.title]));

  const statusColors: Record<string, string> = {
    processing: "bg-amber-500/10 text-amber-400",
    ready: "bg-emerald-500/10 text-emerald-400",
    failed: "bg-red-500/10 text-red-400",
    published: "bg-blue-500/10 text-blue-400",
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Video người dùng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Video do người dùng tải lên từ menu Video · Tổng số: {(videos ?? []).length}
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
        {(videos ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground p-8 text-center">Chưa có video nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Video</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Người dùng</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Dự án</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Thời lượng</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Trạng thái</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {(videos ?? []).map((v: Record<string, unknown>) => {
                  const vid = v as { id: string; user_id: string; title: string; description?: string; project_id?: string | null; duration?: number | null; status?: string; created_at: string; url?: string };
                  return (
                    <tr key={vid.id} className="hover:bg-white/[0.01]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <Play className="size-4 text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[200px]">{vid.title}</p>
                            {vid.description && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{vid.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-xs">
                        <Link href={`/admin/users/${vid.user_id}`} className="hover:text-primary transition-colors flex items-center gap-1">
                          <Users className="size-3 text-muted-foreground" />
                          {nameMap.get(vid.user_id) || vid.user_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {vid.project_id ? (projectMap.get(vid.project_id) || "—") : "—"}
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-mono">
                        {formatDuration(vid.duration ?? null)}
                      </td>
                      <td className="px-5 py-3 text-center hidden sm:table-cell">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${statusColors[vid.status || ""] || "bg-muted/30 text-muted-foreground"}`}>
                          {vid.status || "unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 justify-end"><Calendar className="size-3" />{new Date(vid.created_at).toLocaleDateString("vi-VN")}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
