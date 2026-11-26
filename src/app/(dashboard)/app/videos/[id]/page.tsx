import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Edit3, Clock, FolderOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/content/VideoPlayer";
import { KENH_PHAT_LABELS, laKenhPhat, type KenhPhat } from "@/lib/video/kenh-phat";

const STATUS_LABELS: Record<string, string> = {
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Thất bại",
  published: "Đã xuất bản",
};

const STATUS_COLORS: Record<string, string> = {
  processing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ready: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  published: "bg-accent/10 text-accent border-accent/20",
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (!video) {
    notFound();
  }

  // Fetch associated project
  let projectTitle = "—";
  if (video.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", video.project_id)
      .single();
    if (project) projectTitle = project.title;
  }

  const kenh: KenhPhat = laKenhPhat(video.kenh_phat) ? (video.kenh_phat as KenhPhat) : "youtube";

  return (
    <div className="page-shell page-shell-wide">
      <Link
        href="/app/videos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Thư viện video
      </Link>

      {/* Trình phát dùng chung: chọn cửa phát theo trường kenh_phat.
          Dấu chìm NOOI được trình phát tự vẽ (trước đây in email người xem). */}
      <VideoPlayer
        video={{ title: video.title, url: video.url, kenh_phat: video.kenh_phat }}
        className="mb-6"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{video.title}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[video.status] || STATUS_COLORS.processing}`}
            >
              {STATUS_LABELS[video.status] || video.status}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              {KENH_PHAT_LABELS[kenh]}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                video.cong_khai
                  ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {video.cong_khai ? "Công khai" : "Nội bộ"}
            </span>
            {video.duration > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(video.duration)}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/app/videos/${id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-accent/30 hover:text-accent transition-colors"
        >
          <Edit3 size={14} />
          Chỉnh sửa
        </Link>
      </div>

      {/* Description */}
      {video.description && (
        <div className="p-5 rounded-xl border border-border bg-card mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Mô tả</h2>
          <p className="text-sm whitespace-pre-wrap">{video.description}</p>
        </div>
      )}

      {/* Meta */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Dự án</span>
            <p className="flex items-center gap-1.5">
              <FolderOpen size={13} className="text-muted-foreground" />
              {video.project_id ? (
                <Link
                  href={`/app/projects/${video.project_id}`}
                  className="hover:text-primary transition-colors"
                >
                  {projectTitle}
                </Link>
              ) : (
                projectTitle
              )}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Kênh phát</span>
            <p>{KENH_PHAT_LABELS[kenh]}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Ngày tạo</span>
            <p>{new Date(video.created_at).toLocaleDateString("vi-VN")}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Cập nhật</span>
            <p>{new Date(video.updated_at).toLocaleDateString("vi-VN")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
