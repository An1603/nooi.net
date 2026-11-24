import { nguonPhat } from "@/lib/video/kenh-phat";

interface VideoPlayerProps {
  video: { title: string; url?: string | null; kenh_phat?: string | null };
  className?: string;
  /**
   * Lớp bảo mật 4 (0 đồng): in mờ thông tin người xem lên khung hình để truy vết khi bị rò rỉ.
   * Truyền email hoặc mã người xem — KHÔNG truyền mật khẩu hay mã bí mật.
   */
  dauChim?: string | null;
}

/**
 * MỘT trình phát cho mọi kênh: đọc `kenh_phat` (hoặc tự đoán theo link) rồi chọn cách hiển thị.
 * YouTube -> iframe youtube-nocookie; Bunny Stream -> iframe nhúng của thư viện;
 * tệp .mp4/.webm -> thẻ video gốc của trình duyệt.
 */
export function VideoPlayer({ video, className = "", dauChim }: VideoPlayerProps) {
  const nguon = nguonPhat(video);

  if (nguon.kieu === "khong") {
    return (
      <div
        className={`aspect-video rounded-xl bg-muted border border-border flex items-center justify-center ${className}`}
      >
        <div className="text-center px-6">
          <p className="text-sm text-muted-foreground">{nguon.lyDo}</p>
          {video.url && (
            <p className="text-xs text-muted-foreground/70 mt-2 break-all">{video.url}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video rounded-xl overflow-hidden border border-border bg-black ${className}`}
    >
      {nguon.kieu === "truc-tiep" ? (
        <video
          src={nguon.src}
          title={video.title}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full"
        />
      ) : (
        <iframe
          src={nguon.src}
          title={video.title}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}

      {dauChim && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="dau-chim-troi absolute text-[11px] font-medium text-white/25 select-none whitespace-nowrap">
            {dauChim}
          </span>
        </div>
      )}
    </div>
  );
}
