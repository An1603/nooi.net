"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Video, Image, Music, File, BookOpen,
  Search, Eye, User, Loader2, X,
} from "lucide-react";
import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";

interface AdminDocument {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  file_type: string;
  content_preview: string | null;
  created_at: string;
  updated_at: string;
}

interface TypeCounts {
  [key: string]: number;
}

interface ApiResponse {
  documents: AdminDocument[];
  typeCounts: TypeCounts;
}

const FILE_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  journal: { icon: BookOpen, label: "Nhật ký", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  live_session: { icon: Video, label: "Live Session", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  document: { icon: FileText, label: "Tài liệu", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  video: { icon: Video, label: "Video", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  audio: { icon: Music, label: "Audio", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  image: { icon: Image, label: "Hình ảnh", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  pdf: { icon: File, label: "PDF", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  note: { icon: FileText, label: "Ghi chú", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  lesson_progress: { icon: BookOpen, label: "Bài học", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  practice: { icon: FileText, label: "Thực hành", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
};

function getFileTypeConfig(fileType: string) {
  return FILE_TYPE_CONFIG[fileType] || { icon: File, label: fileType, color: "text-muted-foreground bg-white/5 border-border/30" };
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [typeCounts, setTypeCounts] = useState<TypeCounts>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("file_type", filterType);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/documents?${params.toString()}`);
      const data: ApiResponse = await res.json();
      setDocuments(data.documents ?? []);
      setTypeCounts(data.typeCounts ?? {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // Collect all file types that exist in the data
  const allTypes = Object.keys(typeCounts).sort();
  const totalCount = Object.values(typeCounts).reduce((sum, c) => sum + c, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Quản lý tài liệu</h1>
        <p className="text-xs text-muted-foreground">
          {totalCount.toLocaleString("vi-VN")} tài liệu trên hệ thống
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setFilterType(null)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterType === null
              ? "bg-primary/15 text-primary border border-primary/20"
              : "bg-white/5 text-muted-foreground hover:text-foreground border border-border/20 hover:border-border/40"
          }`}
        >
          Tất cả
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            filterType === null
              ? "bg-primary/20 text-primary"
              : "bg-white/10 text-muted-foreground"
          }`}>
            {totalCount}
          </span>
        </button>
        {allTypes.map((type) => {
          const cfg = getFileTypeConfig(type);
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === type
                  ? `${cfg.color} border`
                  : "bg-white/5 text-muted-foreground hover:text-foreground border border-border/20 hover:border-border/40"
              }`}
            >
              <cfg.icon className="size-3.5" />
              {cfg.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filterType === type
                  ? `${cfg.color.split(" ")[0]} bg-white/10`
                  : "bg-white/10 text-muted-foreground"
              }`}>
                {typeCounts[type]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tiêu đề, tên người dùng..."
          value={search}
          onChange={handleSearchChange}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Loading / Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-[#0d0d0d] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tiêu đề</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Loại</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Người dùng</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Cập nhật</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Xem trước</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {documents.map((doc) => {
                  const cfg = getFileTypeConfig(doc.file_type);
                  return (
                    <tr key={doc.id} className="hover:bg-white/[0.01]">
                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`size-8 rounded-lg ${cfg.color.split(" ")[1]} flex items-center justify-center shrink-0`}>
                            <cfg.icon className={`size-4 ${cfg.color.split(" ")[0]}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc.title || "(Không có tiêu đề)"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          <cfg.icon className="size-3" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link
                          href={`/admin/users/${doc.user_id}`}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <User className="size-3.5" />
                          <span className="truncate max-w-[120px]">{doc.user_name}</span>
                        </Link>
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        <LocalTime iso={doc.updated_at} format="short" />
                      </td>

                      {/* Preview */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {doc.content_preview || "—"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/users/${doc.user_id}`}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                            title="Xem người dùng"
                          >
                            <Eye className="size-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {documents.length === 0 && (
            <p className="text-xs text-muted-foreground p-4 text-center">
              Không tìm thấy tài liệu nào.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
