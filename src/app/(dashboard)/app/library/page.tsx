import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DocumentCard } from "@/components/content/DocumentCard";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user?.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thư viện</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tài liệu, assets và học liệu của bạn.
          </p>
        </div>
        <Link
          href="/app/library/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <Plus size={16} />
          Tài liệu mới
        </Link>
      </div>

      {error && (
        <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
          <p className="text-sm text-destructive">
            Lỗi khi tải tài liệu: {error.message}
          </p>
        </div>
      )}

      {!error && (!documents || documents.length === 0) && (
        <div className="p-12 rounded-xl border border-border bg-card text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2">Thư viện trống</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Tài liệu và assets sẽ xuất hiện ở đây sau khi bạn tạo hoặc upload.
          </p>
          <Link
            href="/app/library/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <Plus size={16} />
            Tạo tài liệu đầu tiên
          </Link>
        </div>
      )}

      {documents && documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
