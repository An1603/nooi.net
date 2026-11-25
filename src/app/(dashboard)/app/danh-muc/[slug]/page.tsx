import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VideoFeedDoc } from "@/components/content/VideoFeedDoc";
import { duongDanDanhMuc, tenDanhMuc } from "@/lib/video/danh-muc";
import { type VideoDoc } from "@/lib/video/kenh-phat";
import { ArrowLeft, LayoutGrid } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Luồng xem của MỘT danh mục — trộn cả video dọc lẫn ngang.
 *
 * Khác /app/short (chỉ video dọc): ở đây lấy mọi khổ hình của danh mục. Khung hình tự khớp
 * tỉ lệ nên video ngang không bị cắt, video dọc không bị nhỏ. Thứ tự: thu_tu giảm dần (bài ghim
 * đứng đầu), rồi tới mới nhất. Quyền xem do RLS của bảng `videos` quyết định.
 */
export default async function DanhMucXemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ten = tenDanhMuc(decodeURIComponent(slug));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("videos")
    .select("id, title, description, url, kenh_phat, khung_hinh, duration")
    .eq("danh_muc", slug)
    .order("thu_tu", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(120);

  const videos = (data ?? []) as VideoDoc[];

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm">
        Không đọc được danh mục: {error.message}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-5 text-accent" />
          <h1 className="text-xl font-semibold">Danh mục: {ten}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Danh mục này chưa có video nào. Gán danh mục cho video trong trang{" "}
          <Link href="/app/videos" className="text-accent underline">
            kho video
          </Link>{" "}
          (sửa từng bài, chọn <strong>Danh mục = {ten}</strong>).
        </p>
        <Link
          href="/app/danh-muc"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"
        >
          <ArrowLeft size={16} /> Về danh sách danh mục
        </Link>
      </div>
    );
  }

  return (
    <VideoFeedDoc
      videos={videos}
      nguoiXem={user?.email ?? null}
      tieuDe={ten}
      duongDanDong="/app/danh-muc"
      duongDanDo={duongDanDanhMuc(slug)}
    />
  );
}
