import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Edit3, Calendar, FileText, FolderOpen, File } from "lucide-react";
import { notFound } from "next/navigation";

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
        {doc.content ? (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{doc.content}</div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Chưa có nội dung. Nhấn &ldquo;Chỉnh sửa&rdquo; để thêm nội dung.
          </p>
        )}
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
