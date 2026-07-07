import Link from "next/link";
import { cn } from "@/lib/utils";
import { Calendar, Play, Music, FileText, Image } from "lucide-react";

export interface DocumentCardData {
  id: string;
  title: string;
  content: string | null;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

function parseContent(content: string | null) {
  if (!content) return { category: "", body: "", url: "", duration: "", pages: 0, caption: "" };
  try { const p = JSON.parse(content); return { category: p.category || "", body: p.body || "", url: p.url || "", duration: p.duration || "", pages: p.pages || 0, caption: p.caption || "" }; }
  catch { return { category: "", body: content, url: "", duration: "", pages: 0, caption: "" }; }
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getCleanPreview(body: string): string {
  return body
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\n{2,}/g, " · ")
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 120);
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; border: string }> = {
  document: { icon: <FileText className="w-5 h-5" />, label: "Bài viết", border: "border-l-blue-500/50" },
  video: { icon: <Play className="w-5 h-5" />, label: "Video", border: "border-l-red-500/50" },
  audio: { icon: <Music className="w-5 h-5" />, label: "Audio", border: "border-l-green-500/50" },
  image: { icon: <Image className="w-5 h-5" />, label: "Hình ảnh", border: "border-l-yellow-500/50" },
  pdf: { icon: <FileText className="w-5 h-5" />, label: "PDF", border: "border-l-orange-500/50" },
  note: { icon: <FileText className="w-5 h-5" />, label: "Ghi chú", border: "border-l-purple-500/50" },
};

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const { id, title, content, file_type, created_at } = doc;
  const parsed = parseContent(content);
  const ytId = parsed.url ? getYoutubeId(parsed.url) : null;
  const type = TYPE_CONFIG[file_type || "document"] || TYPE_CONFIG.document;

  return (
    <Link
      href={`/app/library/${id}`}
      className={cn(
        "block rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all group overflow-hidden",
        `border-l-2 ${type.border}`
      )}
    >
      {/* Video thumbnail */}
      {ytId && (
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </div>
          {parsed.duration && (
            <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
              {parsed.duration}
            </span>
          )}
        </div>
      )}

      {/* Image thumbnail */}
      {!ytId && file_type === "image" && parsed.url && (
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={parsed.url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}

      <div className="p-4">
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground">{type.icon}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{type.label}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Category */}
        {parsed.category && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-2">
            {parsed.category}
          </span>
        )}

        {/* Preview text (only for non-video) */}
        {!ytId && parsed.body && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{getCleanPreview(parsed.body)}...</p>
        )}

        {/* Audio player placeholder */}
        {file_type === "audio" && parsed.url && (
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <Music className="w-3 h-3" />
            <span className="flex-1 truncate">{parsed.duration || "Audio"}</span>
          </div>
        )}

        {/* PDF badge */}
        {file_type === "pdf" && (
          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground bg-orange-500/10 rounded-lg px-3 py-2">
            <FileText className="w-3 h-3 text-orange-400" />
            <span className="flex-1">PDF · {parsed.pages || "?"} trang</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/50">
          <Calendar size={12} />
          {new Date(created_at).toLocaleDateString("vi-VN")}
        </div>
      </div>
    </Link>
  );
}

interface DocumentCardProps {
  document: DocumentCardData;
}
