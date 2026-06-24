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

interface DocumentCardProps {
  document: DocumentCardData;
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const { id, title, content, file_type, created_at } = doc;

  return (
    <Link
      href={`/app/library/${id}`}
      className={cn(
        "block p-5 rounded-xl border border-border bg-card hover:border-secondary/30 hover:bg-card/80 transition-all group"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
          {file_type ? (
            <File size={18} className="text-secondary" />
          ) : (
            <FileText size={18} className="text-secondary" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-secondary transition-colors">
            {title}
          </h3>
          {file_type && (
            <span className="text-[11px] text-muted-foreground uppercase">
              {file_type}
            </span>
          )}
        </div>
      </div>

      {content && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {content}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar size={11} />
          {new Date(created_at).toLocaleDateString("vi-VN")}
        </span>
        <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Xem chi tiết →
        </span>
      </div>
    </Link>
  );
}
