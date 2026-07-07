import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Edit3, Calendar, FileText, FolderOpen, File, Music } from "lucide-react";
import { notFound } from "next/navigation";

function parseContent(content: string | null) {
  if (!content) return { body: "", category: "", url: "", duration: "", caption: "", pages: 0 };
  try {
    const p = JSON.parse(content);
    return {
      body: p.body || "",
      category: p.category || "",
      url: p.url || "",
      duration: p.duration || "",
      caption: p.caption || "",
      pages: p.pages || 0,
    };
  } catch {
    return { body: content, category: "", url: "", duration: "", caption: "", pages: 0 };
  }
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function renderBody(body: string): React.ReactNode[] {
  if (!body) return [];
  return body.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith("### ")) return <h3 key={i} className="font-bold text-primary mt-4 mb-2">{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-5 mb-2">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-5 mb-3">{trimmed.slice(2)}</h1>;
    if (trimmed.startsWith("- **")) return <p key={i} className="text-sm"><strong>{trimmed.replace(/^- \*\*|\*\*/g, "")}</strong></p>;
    if (trimmed.startsWith("- ")) return <li key={i} className="text-sm ml-4 list-disc">{trimmed.slice(2)}</li>;
    if (trimmed.match(/^\d+\. /)) return <li key={i} className="text-sm ml-4 list-decimal">{trimmed.replace(/^\d+\. /, "")}</li>;
    return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
  });
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (!doc) {
    notFound();
  }

  // Fetch associated project
  let projectTitle = "—";
  if (doc.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", doc.project_id)
      .single();
    if (project) projectTitle = project.title;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/app/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Thư viện
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              {doc.file_type ? (
                <File size={20} className="text-secondary" />
              ) : (
                <FileText size={20} className="text-secondary" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
          </div>
          <div className="flex items-center gap-3 ml-[52px]">
            {doc.file_type && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-secondary/10 text-secondary border-secondary/20 uppercase">
                {doc.file_type}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              Cập nhật: {new Date(doc.updated_at).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
        <Link
          href={`/app/library/${id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-secondary/30 hover:text-secondary transition-colors"
        >
          <Edit3 size={14} />
          Chỉnh sửa
        </Link>
      </div>

      {/* Content */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">Nội dung</h2>
        {(() => {
          const c = parseContent(doc.content);
          return (
            <>
              {c.category && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-3">{c.category}</span>
              )}
              {c.url && (
                <div className="rounded-lg border border-border bg-muted/20 p-3 mb-4">
                  {/* Video: YouTube embed */}
                  {doc.file_type === "video" && getYoutubeId(c.url) ? (
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(c.url)}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : doc.file_type === "image" ? (
                    /* Image: full display */
                    <div>
                      <img src={c.url} alt={doc.title} className="w-full rounded-lg object-cover max-h-96" />
                      {c.caption && <p className="text-xs text-muted-foreground mt-2 text-center">{c.caption}</p>}
                    </div>
                  ) : doc.file_type === "audio" ? (
                    /* Audio: player */
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">🎵 Audio · {c.duration}</p>
                      <audio controls className="w-full" src={c.url}>
                        Trình duyệt của bạn không hỗ trợ audio.
                      </audio>
                    </div>
                  ) : doc.file_type === "pdf" ? (
                    /* PDF: embed viewer */
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">📕 PDF · {c.pages || "?"} trang</p>
                      <a href={c.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 rounded-lg text-sm text-primary-foreground mb-3"
                      >
                        📕 Mở PDF
                      </a>
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(c.url)}&embedded=true`}
                        className="w-full h-96 rounded-lg border border-border"
                      />
                    </div>
                  ) : (
                    /* Other: link */
                    <>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        {doc.file_type === "video" ? "🎬 Video" : "🎵 Audio"} · {c.duration}
                      </p>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">{c.url}</a>
                    </>
                  )}
                </div>
              )}
              {c.body ? (
                <div className="text-sm leading-relaxed space-y-1">{renderBody(c.body)}</div>
              ) : null}
            </>
          );
        })()}
      </div>

      {/* File link */}
      {doc.file_url && (
        <div className="p-5 rounded-xl border border-border bg-card mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Tệp đính kèm</h2>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <File size={14} />
            {doc.file_url}
          </a>
        </div>
      )}

      {/* Meta */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Dự án</span>
            <p className="flex items-center gap-1.5">
              <FolderOpen size={13} className="text-muted-foreground" />
              {doc.project_id ? (
                <Link
                  href={`/app/projects/${doc.project_id}`}
                  className="hover:text-primary transition-colors"
                >
                  {projectTitle}
                </Link>
              ) : (
                projectTitle
              )}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Ngày tạo</span>
            <p>{new Date(doc.created_at).toLocaleDateString("vi-VN")}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Cập nhật</span>
            <p>{new Date(doc.updated_at).toLocaleDateString("vi-VN")}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Định dạng</span>
            <p>{doc.file_type || "Văn bản"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
