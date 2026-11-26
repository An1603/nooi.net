import Link from "next/link";
import { cn } from "@/lib/utils";
import { Video, Calendar, Clock, Play, FolderOpen } from "lucide-react";
import { layYoutubeId } from "@/lib/video/kenh-phat";
import { tenDanhMuc } from "@/lib/video/danh-muc";

export interface VideoCardData {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  thumbnail_url?: string | null;
  kenh_phat?: string | null;
  cong_khai?: boolean | null;
  khung_hinh?: string | null;
  danh_muc?: string | null;
  thu_tu?: number | null;
  status: "processing" | "ready" | "failed" | "published";
  duration: number;
  created_at: string;
}

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

interface VideoCardProps {
  video: VideoCardData;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoCard({ video }: VideoCardProps) {
  const { id, title, description, status, duration, created_at, thumbnail_url, kenh_phat, cong_khai, khung_hinh, danh_muc } = video;

  const laBunny = kenh_phat === "bunny";
  const laDoc = khung_hinh === "doc";
  const nhanKenh = laBunny ? "Bunny Stream" : kenh_phat === "truc-tiep" ? "Tệp trực tiếp" : "YouTube";
  // Ảnh thu nhỏ của YouTube chỉ dùng được khi video thật sự phát từ YouTube
  const maYoutube = laBunny || kenh_phat === "truc-tiep" ? null : layYoutubeId(video.url);
  const anhThumb =
    thumbnail_url || (maYoutube ? `https://i.ytimg.com/vi/${maYoutube}/mqdefault.jpg` : null);

  return (
    <Link
      href={`/app/videos/${id}`}
      className={cn(
        "block p-5 rounded-xl border border-border bg-card hover:border-accent/30 hover:bg-card/80 transition-all group"
      )}
    >
      {/* Ảnh đại diện: dùng thumbnail_url, nếu trống thì lấy ảnh thu nhỏ của YouTube */}
      <div
        className={cn(
          "rounded-lg bg-muted mb-3 flex items-center justify-center overflow-hidden relative",
          laDoc ? "aspect-[9/16] max-w-[120px] mx-auto" : "aspect-video"
        )}
      >
        {anhThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anhThumb} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <Video size={32} className="text-muted-foreground/40" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Play
            size={28}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      {/* Cửa phát + phạm vi: đọc trực tiếp từ bản ghi, không nhìn đường dẫn mà đoán */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded border",
            laBunny
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : kenh_phat === "truc-tiep"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
          )}
        >
          {nhanKenh}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded border",
            cong_khai
              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
              : "bg-muted text-muted-foreground border-border"
          )}
        >
          {cong_khai ? "Công khai" : "Nội bộ"}
        </span>
        {laDoc && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">
            9:16
          </span>
        )}
        {danh_muc && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">
            <FolderOpen size={10} />
            {tenDanhMuc(danh_muc)}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-sm truncate mb-1 group-hover:text-accent transition-colors">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-muted-foreground mb-2.5 line-clamp-1">
          {description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full border",
              STATUS_COLORS[status] || STATUS_COLORS.processing
            )}
          >
            {STATUS_LABELS[status] || status}
          </span>
          {duration > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock size={11} />
              {formatDuration(duration)}
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar size={11} />
          {new Date(created_at).toLocaleDateString("vi-VN")}
        </span>
      </div>
    </Link>
  );
}
