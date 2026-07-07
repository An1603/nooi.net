import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileText, Calendar, File } from "lucide-react";

export interface DocumentCardData {
  id: string;
  title: string;
  content: string | null;
  file_type: string | null;
  created_at: string;
  updated_at: string;
}

function getCategory(content: string | null): string | null {
  if (!content) return null;
  try { const p = JSON.parse(content); return p.category || null; } catch { return null; }
}

function getPreview(content: string | null): string | null {
  if (!content) return null;
  try {
    const p = JSON.parse(content);
    if (p.body) return p.body.replace(/#/g, "").trim().slice(0, 80);
    return null;
  } catch { return null; }
}

interface DocumentCardProps {
  document: DocumentCardData;
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const { id, title, content, file_type, created_at } = doc;
  const category = getCategory(content);
  const preview = getPreview(content);

  const typeLabels: Record<string, string> = {
    document: "📄 Bài viết", video: "🎬 Video", audio: "🎵 Audio", note: "📝 Ghi chú",
  };

  return (
    <Link
      href={`/app/library/${id}`}
      className={cn(
        "block p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all group"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
          <File size={18} className="text-secondary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          {file_type && (
            <p className="text-xs text-muted-foreground">{typeLabels[file_type] || file_type}</p>
          )}
        </div>
      </div>
      {category && (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-2">
          {category}
        </span>
      )}
      {preview && (
        <p className="text-xs text-muted-foreground line-clamp-2">{preview}...</p>
      )}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-3">
        <Calendar size={12} />
        {new Date(created_at).toLocaleDateString("vi-VN")}
      </div>
    </Link>
  );
}
