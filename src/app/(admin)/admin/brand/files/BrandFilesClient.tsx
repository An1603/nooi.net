"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, RefreshCw, Loader2, Copy, Check, Search, X } from "lucide-react";
import { toast } from "sonner";

interface StorageFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
  bucket: string;
  path: string;
}

export default function BrandFilesClient() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/brand/files");
      if (res.ok) setFiles((await res.json()).files || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("key", "temp");
      fd.append("label", file.name);
      fd.append("file", file);
      // Upload qua brand API (lưu vào brand/uploads/)
      const res = await fetch("/api/admin/brand", { method: "PUT", body: fd });
      if (res.ok) {
        toast.success(`✅ Đã upload ${file.name}`);
        loadFiles();
      } else {
        const err = await res.json();
        toast.error(`❌ ${err.error || "Lỗi"}`);
      }
    } catch { toast.error("❌ Lỗi"); }
    finally { setUploading(false); }
  }

  async function handleDelete(file: StorageFile) {
    if (!confirm(`Xóa ${file.name}?`)) return;
    setDeleting(file.path);
    try {
      const res = await fetch(`/api/admin/brand/files?bucket=${file.bucket}&path=${encodeURIComponent(file.path)}`, { method: "DELETE" });
      if (res.ok) { toast.success("Đã xóa"); loadFiles(); }
      else toast.error("❌ Lỗi xóa");
    } catch { toast.error("❌ Lỗi"); }
    finally { setDeleting(null); }
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("Đã copy URL");
    setTimeout(() => setCopied(null), 2000);
  }

  function fmtSize(b: number) {
    return b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`;
  }

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📁 Kho file thương hiệu</h1>
          <p className="text-muted-foreground text-sm mt-1">{files.length} file — dùng chung cho toàn bộ brand assets.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadFiles} className="p-2 rounded-lg hover:bg-muted/50"><RefreshCw size={14} /></button>
          <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors ${uploading ? "opacity-50" : ""}`}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload file
            <input type="file" accept="image/*,.ico" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text" placeholder="Tìm file..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:border-primary"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* File grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((f) => (
          <div key={f.path} className="rounded-xl border border-border bg-card overflow-hidden group">
            {/* Preview */}
            <div className="aspect-square bg-muted/30 flex items-center justify-center p-4 relative">
              <img src={f.url} alt={f.name} className="max-w-full max-h-full object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button onClick={() => handleCopy(f.url)}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title="Copy URL">
                  {copied === f.url ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            {/* Info */}
            <div className="p-3 border-t border-border">
              <p className="text-sm font-medium truncate" title={f.name}>{f.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-muted-foreground">{fmtSize(f.size)}</span>
                <span className="text-[10px] text-muted-foreground/50">{f.bucket}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => handleCopy(f.url)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[11px] bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors">
                  <Copy size={11} /> Copy URL
                </button>
                <button onClick={() => handleDelete(f)}
                  disabled={deleting === f.path}
                  className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Xóa">
                  {deleting === f.path ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">
            {search ? "Không tìm thấy file." : "Chưa có file nào. Upload file đầu tiên!"}
          </p>
        </div>
      )}
    </div>
  );
}
