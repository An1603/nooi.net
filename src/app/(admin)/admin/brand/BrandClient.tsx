"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, RefreshCw, Image, Loader2, FolderOpen, Check } from "lucide-react";
import { toast } from "sonner";

interface BrandAsset {
  key: string;
  label: string;
  url: string;
  file_type: string;
  updated_at: string;
}
interface BrandConfig { version: number; assets: Record<string, BrandAsset>; }
interface StorageFile { name: string; url: string; size: number; created_at: string; }

const USAGE: Record<string, { where: string; size: string }[]> = {
  favicon: [{ where: "Tab trình duyệt", size: "16×16, 32×32" }, { where: "Bookmark", size: "16×16" }],
  "favicon-png": [{ where: "Tab (fallback)", size: "32×32" }],
  "apple-touch-icon": [{ where: "iOS Home Screen", size: "180×180" }, { where: "iOS Splash", size: "180×180" }],
  "pwa-icon-192": [{ where: "Android Home Screen", size: "192×192" }, { where: "PWA Splash", size: "192×192" }],
  "pwa-icon-512": [{ where: "PWA Install Prompt", size: "512×512" }, { where: "Launcher", size: "512×512" }],
  "logo-horizontal": [
    { where: "Header / Topbar", size: "~200×92 (163:75)" },
    { where: "Public profile", size: "~160×74" },
  ],
  "logo-horizontal-white": [
    { where: "Landing hero", size: "~326×150 (163:75)" },
    { where: "Sidebar", size: "~160×74" },
    { where: "Auth pages", size: "~200×92" },
  ],
  "logo-square": [{ where: "OG Image", size: "1200×1200" }, { where: "Email", size: "~200×200" }],
  "logo-square-white": [{ where: "Footer", size: "~120×120" }],
  "logo-icon": [
    { where: "Sidebar icon (tròn)", size: "40×40" },
    { where: "Loading spinner", size: "32×32" },
    { where: "Thư viện brand card", size: "thumbnail" },
  ],
  "logo-icon-white": [{ where: "Dark mode icon", size: "40×40" }],
};

const LABELS: Record<string, string> = {
  favicon: "Favicon (.ico)", "favicon-png": "Favicon (.png)", "apple-touch-icon": "Apple Touch",
  "pwa-icon-192": "PWA 192", "pwa-icon-512": "PWA 512",
  "logo-horizontal": "Logo ngang màu", "logo-horizontal-white": "Logo ngang trắng",
  "logo-square": "Logo vuông màu", "logo-square-white": "Logo vuông trắng",
  "logo-icon": "Icon tím", "logo-icon-white": "Icon trắng",
};

const GROUPS: Record<string, string[]> = {
  "🌐 Favicon & Web": ["favicon", "favicon-png", "apple-touch-icon"],
  "📱 PWA": ["pwa-icon-192", "pwa-icon-512"],
  "🏷️ Logo": ["logo-horizontal", "logo-horizontal-white", "logo-square", "logo-square-white"],
  "🔣 Icon": ["logo-icon", "logo-icon-white"],
};

export default function BrandClient() {
  const [config, setConfig] = useState<BrandConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [res, fres] = await Promise.all([
        fetch("/api/admin/brand"),
        fetch("/api/admin/brand/files"),
      ]);
      if (res.ok) setConfig(await res.json());
      if (fres.ok) setStorageFiles((await fres.json()).files || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function doUpload(key: string, file: File) {
    setUploading(key);
    const fd = new FormData();
    fd.append("key", key); fd.append("label", LABELS[key] || key); fd.append("file", file);
    try {
      const res = await fetch("/api/admin/brand", { method: "PUT", body: fd });
      if (res.ok) { toast.success(`✅ ${LABELS[key]}`); await loadAll(); }
      else toast.error(`❌ ${(await res.json()).error || "Lỗi"}`);
    } catch { toast.error("❌ Lỗi"); }
    finally { setUploading(null); }
  }

  async function doPick(key: string, url: string, name: string) {
    setUploading(key); setPickerFor(null);
    try {
      const res = await fetch("/api/admin/brand", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label: LABELS[key] || key, url }),
      });
      if (res.ok) { toast.success(`✅ ${name}`); loadAll(); }
      else toast.error("❌ Lỗi");
    } catch { toast.error("❌ Lỗi"); }
    finally { setUploading(null); }
  }

  async function doReset(key: string) {
    setUploading(key);
    const fd = new FormData();
    fd.append("key", key); fd.append("label", LABELS[key] || key); fd.append("url", "");
    try {
      const res = await fetch("/api/admin/brand", { method: "PUT", body: fd });
      if (res.ok) { toast.success("Đã reset"); loadAll(); }
    } catch { toast.error("Lỗi"); }
    finally { setUploading(null); }
  }

  function fmtSize(b: number) { return b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`; }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎨 Thương hiệu</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload hoặc chọn file từ kho cho từng vị trí.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">v{config?.version || 1}</span>
          <button onClick={loadAll} className="p-2 rounded-lg hover:bg-muted/50"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Kho file */}
      <div className="mb-6 p-3 rounded-xl border border-border bg-card/30 flex items-center gap-3 flex-wrap">
        <FolderOpen size={16} className="text-primary shrink-0" />
        <span className="text-xs text-muted-foreground">{storageFiles.length} file:</span>
        {storageFiles.length === 0 ? (
          <span className="text-xs text-muted-foreground">trống</span>
        ) : (
          storageFiles.map((f) => (
            <div key={f.name} className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-xs">
              <img src={f.url} className="w-4 h-4 object-contain rounded" />
              <span className="truncate max-w-[100px]">{f.name}</span>
              <span className="text-[10px] text-muted-foreground/50">{fmtSize(f.size)}</span>
            </div>
          ))
        )}
      </div>

      {/* Bảng Vị trí sử dụng */}
      {Object.entries(GROUPS).map(([group, keys]) => (
        <div key={group} className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left py-2.5 px-4 font-medium text-xs text-muted-foreground w-[180px]">Asset</th>
                  <th className="text-left py-2.5 px-4 font-medium text-xs text-muted-foreground">Vị trí</th>
                  <th className="text-left py-2.5 px-4 font-medium text-xs text-muted-foreground w-[100px]">Kích thước</th>
                  <th className="text-left py-2.5 px-4 font-medium text-xs text-muted-foreground w-[80px]">Preview</th>
                  <th className="text-right py-2.5 px-4 font-medium text-xs text-muted-foreground w-[180px]">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => {
                  const locations = USAGE[key] || [];
                  const asset = config?.assets?.[key];
                  const busy = uploading === key;
                  const pickerOpen = pickerFor === key;

                  return locations.map((loc, i) => (
                    <tr key={`${key}-${i}`} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                      {i === 0 && (
                        <td className="py-2.5 px-4 font-medium" rowSpan={locations.length}>
                          <div className="flex items-center gap-2">
                            {asset?.url ? (
                              <img src={asset.url} className="w-6 h-6 object-contain rounded" />
                            ) : (
                              <Image size={16} className="text-muted-foreground" />
                            )}
                            <span>{LABELS[key] || key}</span>
                            {asset && <Check size={12} className="text-emerald-400" />}
                          </div>
                        </td>
                      )}
                      <td className="py-2.5 px-4 text-muted-foreground">{loc.where}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-primary/70">{loc.size}</td>
                      <td className="py-2.5 px-4">
                        {asset?.url ? (
                          <img src={asset.url} className="max-h-8 max-w-[60px] object-contain rounded" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">mặc định</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {i === 0 && (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Upload */}
                            <label className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20 cursor-pointer">
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                              Up
                              <input type="file" accept="image/*,.ico" className="hidden" disabled={busy}
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) doUpload(key, f); }} />
                            </label>
                            {/* Chọn từ kho */}
                            <button onClick={() => { loadAll(); setPickerFor(pickerOpen ? null : key); }} disabled={busy}
                              className="px-2 py-1 rounded bg-muted/30 text-muted-foreground text-xs hover:bg-muted/50" title="Chọn từ kho">
                              <FolderOpen size={12} />
                            </button>
                            {/* Reset */}
                            {asset?.url && (
                              <button onClick={() => doReset(key)} disabled={busy}
                                className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Reset">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>

            {/* File picker dropdown cho key đang mở */}
            {pickerFor && keys.includes(pickerFor) && (
              <div className="border-t border-border p-2 bg-background/50 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {storageFiles.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground p-1">Kho trống</span>
                  ) : (
                    storageFiles.map((f) => (
                      <button key={f.name}
                        onClick={() => doPick(pickerFor, f.url, f.name)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors">
                        <img src={f.url} className="w-5 h-5 object-contain rounded" />
                        <span className="truncate max-w-[100px]">{f.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
        <strong>💡 Cách dùng:</strong> Upload file mới → áp dụng ngay toàn hệ thống. Chọn từ kho để dùng lại file đã upload. Reset để về mặc định. Sau khi đổi favicon/PWA icon, user cần <strong>Cài lại</strong> PWA.
      </div>
    </div>
  );
}
