import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoFeedDoc } from "@/components/content/VideoFeedDoc";
import { xetQuyenXem } from "@/lib/video/quyen-xem";
import { nguoiDangXem } from "@/lib/video/nguoi-xem";
import type { VideoDoc } from "@/lib/video/kenh-phat";

export const dynamic = "force-dynamic";

/** Video trong luồng — có đường phát, kèm `cong_khai` để cổng gác xét quyền + ngày tạo để sắp xếp. */
type VideoLuong = VideoDoc & {
  cong_khai?: boolean | null;
  created_at?: string | null;
  thu_tu?: number | null;
};

/**
 * XEM VIDEO TRONG KHU THÀNH VIÊN `/app/videos/<mã>`.
 *
 * Ngài An chốt 27/11/2026: trong `/app` chỉ còn MỘT cửa video. Trang này chính là bản thành viên
 * của `/video/<mã>` — dùng đúng thành phần luồng xem (`VideoFeedDoc`), đúng cách tính quyền, chỉ
 * khác đường về (`/app/videos`). Không có bản sao giao diện nào để lệch nhau về sau.
 *
 * Danh sách nạp vào luồng = bài đã xuất bản + bài CỦA CHÍNH MÌNH (kể cả nháp, để xem trước).
 * CHỐT CHẶN Ở MÁY CHỦ: video chưa mở quyền thì `url` bị bỏ NGAY trước khi gửi xuống trình duyệt.
 */
export default async function XemVideoTrongAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const COT =
    "id, title, description, url, kenh_phat, thumbnail_url, duration, khung_hinh, danh_muc, cong_khai, created_at, thu_tu";

  const [nguoi, { data: xuatBan }, { data: cuaToi }] = await Promise.all([
    nguoiDangXem(),
    createAdminClient()
      .from("videos")
      .select(COT)
      .eq("status", "published")
      .order("thu_tu", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("videos")
      .select(COT)
      .eq("user_id", user?.id ?? "")
      .order("thu_tu", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const theoMa = new Map<string, VideoLuong>();
  for (const v of (xuatBan ?? []) as unknown as VideoLuong[]) theoMa.set(v.id, v);
  for (const v of (cuaToi ?? []) as unknown as VideoLuong[]) theoMa.set(v.id, v);

  // Gộp hai nguồn rồi xếp lại: ưu tiên `thu_tu` (số lớn trước), hoà thì bài mới nhất trước —
  // đúng thứ tự lưới để vuốt / phím ← → không lệch.
  const tatCa = [...theoMa.values()].sort(
    (a, b) =>
      (b.thu_tu ?? 0) - (a.thu_tu ?? 0) || (b.created_at || "").localeCompare(a.created_at || "")
  );
  if (!tatCa.some((v) => v.id === id)) notFound();

  // Bỏ ĐƯỜNG PHÁT của mọi video chưa mở quyền cho người này (giữ `kenh_phat` để hiện đúng nhãn kênh)
  const videos: VideoLuong[] = tatCa.map((v) => (xetQuyenXem(v, nguoi).mo ? v : { ...v, url: null }));

  return (
    <VideoFeedDoc
      videos={videos}
      tieuDe="Kho video NOOI"
      duongDanDong="/app/videos"
      duongDanDo="/app/videos"
      tienToBai="/app/videos"
      batDauId={id}
      nguoiCongKhai={nguoi}
      quayLaiDangNhap={`/app/videos/${id}`}
    />
  );
}
