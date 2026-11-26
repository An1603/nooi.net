import Link from "next/link";
import { Smartphone, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VideoFeedDoc } from "@/components/content/VideoFeedDoc";
import { type VideoDoc } from "@/lib/video/kenh-phat";

export const dynamic = "force-dynamic";

/**
 * Luồng xem dọc — vuốt như TikTok.
 *
 * Chỉ lấy video KHUNG HÌNH DỌC (khung_hinh = 'doc'). Thứ tự: thu_tu giảm dần,
 * rồi tới thời gian tạo giảm dần — nên bài ghim (thu_tu lớn) luôn đứng đầu.
 * Quyền xem do RLS của bảng `videos` quyết định, trang chỉ hiển thị cái đã được cấp.
 */
export default async function ShortPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("videos")
    .select("id, title, description, url, kenh_phat, khung_hinh, duration, thumbnail_url")
    .eq("khung_hinh", "doc")
    .order("thu_tu", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  const videos = (data ?? []) as VideoDoc[];

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm">
        Không đọc được kho video: {error.message}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-accent" />
          <h1 className="text-xl font-semibold">Luồng xem dọc</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Chưa có video dọc nào. Luồng này chỉ chạy khi có video được đánh dấu{" "}
          <strong>Khung hình = Dọc (9:16)</strong>.
        </p>

        <div className="rounded-xl border border-border bg-card p-5 text-sm">
          <p className="mb-3 font-medium">Cách đưa một clip dọc vào luồng</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            <li>Vào <strong>Thêm video</strong>, dán đường dẫn video.</li>
            <li>
              Chọn <strong>Kênh phát = Bunny Stream</strong> (hoặc “Tệp trực tiếp” nếu là tệp .mp4
              đã có sẵn, dùng để thử).
            </li>
            <li>
              Chọn <strong>Khung hình = Dọc (9:16)</strong>.
            </li>
            <li>Ô <strong>Thứ tự</strong>: số lớn hơn đứng trước (bài ghim để 1000).</li>
          </ol>
        </div>

        <Link
          href="/app/videos/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Upload size={16} />
          Thêm video dọc
        </Link>
      </div>
    );
  }

  return <VideoFeedDoc videos={videos} nguoiXem={user?.email ?? null} />;
}
