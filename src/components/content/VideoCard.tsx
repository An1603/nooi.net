import Link from "next/link";
import { cn } from "@/lib/utils";
import { Video, Calendar, Clock, Play } from "lucide-react";

export interface VideoCardData {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
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
  const { id, title, description, status, duration, created_at } = video;

  return (
    <Link
      href={`/app/videos/${id}`}
      className={cn(
        "block p-5 rounded-xl border border-border bg-card hover:border-accent/30 hover:bg-card/80 transition-all group"
      )}
    >
      {/* Thumbnail placeholder */}
      <div className="aspect-video rounded-lg bg-muted mb-3 flex items-center justify-center overflow-hidden relative">
        <Video size={32} className="text-muted-foreground/40" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Play
            size={28}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
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
