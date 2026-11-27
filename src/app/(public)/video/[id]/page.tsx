import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoFeedDoc } from "@/components/content/VideoFeedDoc";
import { xetQuyenXem } from "@/lib/video/quyen-xem";
import { nguoiDangXem } from "@/lib/video/nguoi-xem";
import type { VideoDoc } from "@/lib/video/kenh-phat";

export const dynamic = "force-dynamic";

/** Video trong luồng — có đường phát, kèm `cong_khai` để cổng gác xét quyền. */
type VideoLuong = VideoDoc & { cong_khai?: boolean | null; thu_tu?: number | null };

async function layMotVideo(id: string): Promise<VideoLuong | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("videos")
    .select("id, title, description, thumbnail_url, duration, khung_hinh, danh_muc, cong_khai")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return (data as unknown as VideoLuong) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = await layMotVideo(id);
  if (!video) return { title: "Không tìm thấy video · NOOI" };
  return {
    title: `${video.title} · Kho video NOOI`,
    description: video.description?.slice(0, 160) || "Video trong kho NOOI.",
    openGraph: {
      title: video.title,
      description: video.description?.slice(0, 160) || "Video trong kho NOOI.",
      images: video.thumbnail_url ? [video.thumbnail_url] : undefined,
      locale: "vi_VN",
      type: "video.other",
      siteName: "NOOI",
    },
  };
}

/**
 * Xem video công khai `/video/<mã>` — mở thẳng vào LUỒNG VUỐT, đứng đúng bài vừa bấm.
 *
 * Vì sao là luồng chứ không một trang lẻ: Ngài An chốt 26/11/2026 — bấm xem một video thì
 * “thông tin thu gọn để ưu tiên màn hình video, bấm xem chi tiết mới hiện đầy đủ, và có thể vuốt
 * để xem các video tiếp”. Dùng lại `VideoFeedDoc` (thành phần luồng xem của khu nội bộ, đã xử lý
 * sẵn các bẫy chạm – vuốt – khung hình tự khớp) thay vì viết bản sao.
 *
 * CHỐT CHẶN NẰM Ở MÁY CHỦ: video chưa mở quyền thì `url`/`kenh_phat` bị BỎ NGAY TRƯỚC KHI gửi
 * xuống trình duyệt — không có cách nào moi được đường phát khi chưa qua cổng gác.
 */
export default async function XemVideoCongKhaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nguoi = await nguoiDangXem();
  const admin = createAdminClient();

  const { data } = await admin
    .from("videos")
    .select(
      "id, title, description, url, kenh_phat, thumbnail_url, duration, khung_hinh, danh_muc, cong_khai, created_at, thu_tu"
    )
    .eq("status", "published")
    // THỨ TỰ LUỒNG = thứ tự người quản trị đã xếp (`thu_tu`, số lớn trước); chưa xếp thì bài mới
    // nhất trước. Nhờ vậy vuốt và phím ← → đi đúng thứ tự khán giả thấy trong lưới, không nhảy
    // lung tung theo ngày đăng.
    .order("thu_tu", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const tatCa = (data ?? []) as unknown as VideoLuong[];
  if (!tatCa.some((v) => v.id === id)) notFound();

  // Bỏ ĐƯỜNG PHÁT của mọi video chưa mở quyền cho người này (giữ `kenh_phat` để hiện đúng nhãn
  // kênh — nhãn không phải đường phát, bỏ đi thì thông tin trong luồng thành "Chưa rõ kênh")
  const videos: VideoLuong[] = tatCa.map((v) => (xetQuyenXem(v, nguoi).mo ? v : { ...v, url: null }));

  return (
    <VideoFeedDoc
      videos={videos}
      tieuDe="Kho video NOOI"
      duongDanDong="/video"
      duongDanDo="/video"
      tienToBai="/video"
      batDauId={id}
      nguoiCongKhai={nguoi}
      quayLaiDangNhap={`/video/${id}`}
    />
  );
}
