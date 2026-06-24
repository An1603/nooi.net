import Link from "next/link";
import { cn } from "@/lib/utils";
import { FolderOpen, Calendar, Edit3 } from "lucide-react";

export interface ProjectCardData {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "in_progress" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  in_progress: "Đang tiến hành",
  completed: "Hoàn thành",
  archived: "Đã lưu trữ",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted-foreground/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  archived: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

interface ProjectCardProps {
  project: ProjectCardData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { id, title, description, status, created_at } = project;

  return (
    <Link
      href={`/app/projects/${id}`}
      className={cn(
        "block p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all group"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen size={18} className="text-primary" />
          </div>
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
        <span
          className={cn(
            "shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border",
            STATUS_COLORS[status] || STATUS_COLORS.draft
          )}
        >
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar size={11} />
          {new Date(created_at).toLocaleDateString("vi-VN")}
        </span>
        <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Edit3 size={11} />
          Chi tiết
        </span>
      </div>
    </Link>
  );
}
