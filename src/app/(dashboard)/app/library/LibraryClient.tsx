"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { DocumentCard, DocumentCardData } from "@/components/content/DocumentCard";

interface Props {
  documents: DocumentCardData[];
  categories: string[];
}

const TYPE_LABELS: Record<string, string> = {
  document: "📄 Bài viết",
  video: "🎬 Video",
  audio: "🎵 Audio",
  image: "🖼️ Hình ảnh",
  pdf: "📕 PDF",
  note: "📝 Ghi chú",
};

export function LibraryClient({ documents, categories }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      // Search by title
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;

      // Filter by type
      if (type && doc.file_type !== type) return false;

      // Filter by category (from JSON content)
      if (category) {
        try {
          const c = JSON.parse(doc.content || "{}");
          if (c.category !== category) return false;
        } catch { return false; }
      }

      return true;
    });
  }, [documents, search, category, type]);

  const activeFilters = [category, type].filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="page-shell page-shell-wide">
      <div className="flex items-center justify-between mb-6">
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

      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả thể loại</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả loại</option>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Active filter count */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setSearch(""); setCategory(""); setType(""); }}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
            >
              Xóa lọc ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">
            {documents.length === 0 ? (
              <>Chưa có tài liệu nào. Nhấn &ldquo;Tài liệu mới&rdquo; để bắt đầu.</>
            ) : (
              <>Không tìm thấy tài liệu phù hợp.</>
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
