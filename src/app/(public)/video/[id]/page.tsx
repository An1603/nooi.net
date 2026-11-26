import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoPlayer } from "@/components/content/VideoPlayer";
import { ManKhoaVideo } from "@/components/video/ManKhoaVideo";
import { xetQuyenXem, type VideoCongKhai } from "@/lib/video/quyen-xem";
import { tenDanhMuc } from "@/lib/video/danh-muc";
import { nguoiDangXem } from "@/lib/video/nguoi-xem";

export const dynamic = "force-dynamic";

/** Video kèm đường phát — chỉ dùng ở trang này, sau khi đã qua cổng gác. */
interface VideoDayDu extends VideoCongKhai {
  url?: string | null;
  kenh_phat?: string | null;
}

function phutGiay(giay?: number | null): string | null {
  if (!giay || giay <= 0) return null;
  const m = Math.floor(giay / 60);
  const s = Math.round(giay % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function layVideo(id: string): Promise<VideoDayDu | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("videos")
    .select("id, title, description, url, kenh_phat, thumbnail_url, duration, khung_hinh, danh_muc, cong_khai")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return (data as unknown as VideoDayDu) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = await layVideo(id);
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
 * Trang xem công khai `/video/<mã>`.
 *
 * Cổng gác ở đây là chốt chặn thật: video không công khai mà người xem chưa đăng nhập thì KHÔNG
 * bao giờ lấy `url` ra để phát — chỉ hiện màn khoá kèm nút đăng nhập. Đăng nhập xong quay lại
 * đúng địa chỉ này (`quayLai`), lúc đó mới có phiên và mở được.
 */
export default async function XemVideoCongKhaiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await layVideo(id);
  if (!video) notFound();

  const nguoi = await nguoiDangXem();
  const kq = xetQuyenXem(video, nguoi);

  if (!kq.mo) {
    return (
      <main className="min-h-[100dvh] bg-background">
        <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <ManKhoaVideo
            tieuDe={video.title}
            moTa={kq.moTa}
            anhBia={video.thumbnail_url}
            nhan={kq.nhan}
            quayLai={`/video/${video.id}`}
          />
        </div>
      </main>
    );
  }

  const thoiLuong = phutGiay(video.duration);

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto w-full max-w-[1000px] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <Link
          href="/video"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Về kho video
        </Link>

        <VideoPlayer
          video={{ title: video.title, url: video.url, kenh_phat: video.kenh_phat }}
          khungHinh={video.khung_hinh}
          // Lớp bảo mật in mờ: chỉ in khi biết người xem là ai (đã đăng nhập)
          dauChim={nguoi.email || undefined}
        />

        <div className="mt-5">
          <h1 className="text-lg font-semibold leading-snug sm:text-xl">{video.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {video.danh_muc && <span>{tenDanhMuc(video.danh_muc)}</span>}
            <span>{video.khung_hinh === "doc" ? "Dọc 9:16" : "Ngang 16:9"}</span>
            {thoiLuong && <span>{thoiLuong}</span>}
            {nguoi.daDangNhap && <span>Xem với tư cách {nguoi.email}</span>}
          </p>
          {video.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
