import { createAdminClient } from "@/lib/supabase/admin";
import { Video as VideoIcon, Users, Eye, Calendar, Play } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const supabase = createAdminClient();

  const { data: videos, error } = await supabase
    .from("videos")
    .select("*, profiles!inner(full_name)")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return <div className="p-6 text-red-400">Lỗi: {error.message}</div>;

  const statusColors: Record<string, string> = {
    processing: "bg-amber-500/10 text-amber-400",
    ready: "bg-emerald-500/10 text-emerald-400",
    failed: "bg-red-500/10 text-red-400",
    published: "bg-blue-500/10 text-blue-400",
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Video</h1>
        <p className="text-sm text-muted-foreground mt-1">Tất cả video người dùng đã tải lên</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
        {(videos ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground p-8 text-center">Chưa có video nào.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Video</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Người dùng</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">Thời lượng</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Trạng thái</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {(videos ?? []).map((v) => (
                <tr key={v.id} className="hover:bg-white/[0.01]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Play className="size-4 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{v.title}</p>
                        {v.description && <p className="text-[10px] text-muted-foreground truncate">{v.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    <Link href={`/admin/users/${v.user_id}`} className="hover:text-primary transition-colors">
                      {v.profiles?.full_name || v.user_id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-center text-xs font-mono">
                    {v.duration ? formatDuration(v.duration) : "—"}
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColors[v.status] || statusColors.processing}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-[10px] text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
