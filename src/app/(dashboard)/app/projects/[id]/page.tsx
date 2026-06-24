import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Edit3, Calendar, FolderOpen, Video, FileText } from "lucide-react";
import { notFound } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  in_progress: "Đang tiến hành",
  completed: "Hoàn thành",
  archived: "Đã lưu trữ",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted-foreground/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  archived: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (!project) {
    notFound();
  }

  // Fetch related videos and documents
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, status, created_at")
    .eq("project_id", id)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, created_at")
    .eq("project_id", id)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/app/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Danh sách dự án
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen size={20} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
          </div>
          <div className="flex items-center gap-3 ml-[52px]">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] || STATUS_COLORS.draft}`}
            >
              {STATUS_LABELS[project.status] || project.status}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              Cập nhật: {new Date(project.updated_at).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
        <Link
          href={`/app/projects/${id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/30 hover:text-primary transition-colors"
        >
          <Edit3 size={14} />
          Chỉnh sửa
        </Link>
      </div>

      {/* Description */}
      {project.description && (
        <div className="p-6 rounded-xl border border-border bg-card mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Mô tả</h2>
          <p className="text-sm whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Related content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Videos */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Video size={16} className="text-accent" />
              Video liên quan
            </h2>
            {videos && videos.length > 0 && (
              <Link
                href={`/app/videos`}
                className="text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                Xem tất cả →
              </Link>
            )}
          </div>
          {videos && videos.length > 0 ? (
            <ul className="space-y-2">
              {videos.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/app/videos/${v.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  >
                    <span className="truncate">{v.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-3">
                      {new Date(v.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Chưa có video nào cho dự án này.
            </p>
          )}
        </div>

        {/* Documents */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <FileText size={16} className="text-secondary" />
              Tài liệu liên quan
            </h2>
            {documents && documents.length > 0 && (
              <Link
                href={`/app/library`}
                className="text-xs text-muted-foreground hover:text-secondary transition-colors"
              >
                Xem tất cả →
              </Link>
            )}
          </div>
          {documents && documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/app/library/${d.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  >
                    <span className="truncate">{d.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-3">
                      {new Date(d.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Chưa có tài liệu nào cho dự án này.
            </p>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-8 p-4 rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Ngày tạo</span>
            <p>{new Date(project.created_at).toLocaleDateString("vi-VN")}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Cập nhật lần cuối</span>
            <p>{new Date(project.updated_at).toLocaleDateString("vi-VN")}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Video</span>
            <p>{videos?.length || 0} video</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Tài liệu</span>
            <p>{documents?.length || 0} tài liệu</p>
          </div>
        </div>
      </div>
    </div>
  );
}
