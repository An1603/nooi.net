import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { VideoCard } from "@/components/content/VideoCard";

export default async function VideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: videos, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user?.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Thư viện video đã render và xuất bản.
          </p>
        </div>
        <Link
          href="/app/videos/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <Plus size={16} />
          Video mới
        </Link>
      </div>

      {error && (
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
          <p className="text-sm text-destructive">
            Lỗi khi tải video: {error.message}
          </p>
        </div>
      )}

      {!error && (!videos || videos.length === 0) && (
        <div className="p-12 rounded-xl border border-border bg-card text-center">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="text-lg font-semibold mb-2">Chưa có video nào</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Upload video đầu tiên hoặc tạo từ dự án để bắt đầu.
          </p>
          <Link
            href="/app/videos/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <Plus size={16} />
            Thêm video đầu tiên
          </Link>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
