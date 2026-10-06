import { FileText, ExternalLink, Lock } from "lucide-react";

/**
 * Card "Tài liệu dự án" — thay cho iframe nhúng slides.nooi.net.
 *
 * Vì slides.nooi.net nay là NỘI BỘ (đăng nhập + mật mã riêng từng tài liệu),
 * cookie không được gửi trong iframe khác miền → nhúng sẽ hiện trang đăng nhập.
 * Nên chỉ hiển thị nút mở ở tab mới.
 */
export default function ProjectDocuments({
  docs,
  title,
}: {
  docs: Array<{ label: string; url: string }>;
  title: string;
}) {
  return (
    <div className="bg-glass backdrop-blur-md border border-glass-border rounded-xl p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex gap-3.5 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <FileText className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-lg text-primary">Tài liệu dự án</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
              Bản trình bày đầy đủ của <span className="text-foreground font-medium">{title}</span> —
              mở ở <span className="text-foreground font-medium">slides.nooi.net</span>.
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-1.5 flex items-center gap-1.5">
              <Lock className="size-3" />
              Kho tài liệu nội bộ — cần mật mã do NOOI cấp.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {docs.map((d, i) => (
            <a
              key={d.url}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className={
                i === 0
                  ? "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all border border-primary/40 whitespace-nowrap"
                  : "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-glass text-foreground text-sm font-medium border border-glass-border hover:bg-glass-hover transition-all whitespace-nowrap"
              }
            >
              <ExternalLink className="size-4" /> {d.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}