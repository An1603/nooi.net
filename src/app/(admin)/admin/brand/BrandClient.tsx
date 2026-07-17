"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, RefreshCw, Image, Loader2, FolderOpen, Check, X, Info } from "lucide-react";
import { toast } from "sonner";

interface BrandAsset {
  key: string;
  label: string;
  url: string;
  file_type: string;
  updated_at: string;
}

interface BrandConfig {
  version: number;
  assets: Record<string, BrandAsset>;
}

interface StorageFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

const USAGE_LOCATIONS: Record<string, { where: string; size: string; note: string }[]> = {
  favicon: [
    { where: "Tab trình duyệt", size: "16×16, 32×32", note: "File .ico (đa kích thước)" },
    { where: "Bookmark", size: "16×16", note: "" },
  ],
  "favicon-png": [
    { where: "Tab trình duyệt (fallback)", size: "32×32", note: "Dùng khi .ico không được hỗ trợ" },
  ],
  "apple-touch-icon": [
    { where: "iOS Home Screen", size: "180×180", note: "Không bo góc (iOS tự bo)" },
    { where: "iOS Splash", size: "180×180", note: "" },
  ],
  "pwa-icon-192": [
    { where: "Android Home Screen", size: "192×192", note: "Padding ~12% tránh cắt" },
    { where: "PWA Splash", size: "192×192", note: "" },
  ],
  "pwa-icon-512": [
    { where: "PWA Install Prompt", size: "512×512", note: "Padding ~12%" },
    { where: "Android Launcher", size: "512×512", note: "Maskable: padding 20%" },
  ],
  "logo-horizontal": [
    { where: "Header (web)", size: "~200×92", note: "Tỉ lệ 163:75" },
    { where: "Topbar (mobile)", size: "~130×60", note: "Tỉ lệ 163:75" },
    { where: "Public profile", size: "~160×74", note: "" },
    { where: "Login page", size: "~300×138", note: "" },
  ],
  "logo-horizontal-white": [
    { where: "Landing hero", size: "~326×150", note: "Trên nền tím đậm" },
    { where: "Sidebar (collapsed)", size: "~160×74", note: "" },
    { where: "Auth pages", size: "~200×92", note: "" },
  ],
  "logo-square": [
    { where: "OG Image", size: "1200×1200", note: "Social share" },
    { where: "Email signature", size: "~200×200", note: "" },
  ],
  "logo-square-white": [
    { where: "Footer", size: "~120×120", note: "Trên nền tối" },
  ],
  "logo-icon": [
    { where: "Dashboard sidebar (icon)", size: "40×40", note: "Icon tròn" },
    { where: "Loading spinner", size: "32×32", note: "" },
    { where: "Notification icon", size: "24×24", note: "" },
  ],
  "logo-icon-white": [
    { where: "Dark mode sidebar", size: "40×40", note: "" },
  ],
};

const DEFAULT_LABELS: Record<string, string> = {
  favicon: "Favicon (.ico)",
  "favicon-png": "Favicon (.png)",
  "apple-touch-icon": "Apple Touch Icon",
  "pwa-icon-192": "PWA Icon 192×192",
  "pwa-icon-512": "PWA Icon 512×512",
  "logo-horizontal": "Logo ngang (màu)",
  "logo-horizontal-white": "Logo ngang (trắng)",
  "logo-square": "Logo vuông (màu)",
  "logo-square-white": "Logo vuông (trắng)",
  "logo-icon": "Icon (tím)",
  "logo-icon-white": "Icon (trắng/nền tím)",
};

const ASSET_GROUPS = [
  { title: "🌐 Favicon & Web", keys: ["favicon", "favicon-png", "apple-touch-icon"] },
  { title: "📱 PWA Icons", keys: ["pwa-icon-192", "pwa-icon-512"] },
  { title: "🏷️ Logo chính", keys: ["logo-horizontal", "logo-horizontal-white", "logo-square", "logo-square-white"] },
  { title: "🔣 Icon", keys: ["logo-icon", "logo-icon-white"] },
];

export default function BrandClient() {
  const [config, setConfig] = useState<BrandConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [filePickerKey, setFilePickerKey] = useState<string | null>(null);
  const [showUsage, setShowUsage] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/brand");
      if (res.ok) setConfig(await res.json());
    } catch (err) {
      console.error("Failed to load brand config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStorageFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/brand/files");
      if (res.ok) {
        const data = await res.json();
        setStorageFiles(data.files || []);
      }
    } catch {}
  }, []);

  useEffect(() => { loadConfig(); loadStorageFiles(); }, [loadConfig, loadStorageFiles]);

  async function handleUpload(key: string, file: File) {
    setUploading(key);
    try {
      const formData = new FormData();
      formData.append("key", key);
      formData.append("label", DEFAULT_LABELS[key] || key);
      formData.append("file", file);

      const res = await fetch("/api/admin/brand", { method: "PUT", body: formData });
      if (res.ok) {
        toast.success(`✅ Đã cập nhật ${DEFAULT_LABELS[key]}`);
        await Promise.all([loadConfig(), loadStorageFiles()]);
      } else {
        const err = await res.json();
        toast.error(`❌ ${err.error || "Lỗi upload"}`);
      }
    } catch {
      toast.error("❌ Lỗi kết nối");
    } finally {
      setUploading(null);
    }
  }

  async function handlePickFile(key: string, url: string, fileName: string) {
    setUploading(key);
    setFilePickerKey(null);
    try {
      const res = await fetch("/api/admin/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          label: DEFAULT_LABELS[key] || key,
          url,
        }),
      });
      if (res.ok) {
        toast.success(`✅ Đã chọn ${fileName} cho ${DEFAULT_LABELS[key]}`);
        loadConfig();
      } else {
        toast.error("❌ Lỗi");
      }
    } catch {
      toast.error("❌ Lỗi");
    } finally {
      setUploading(null);
    }
  }

  async function handleReset(key: string) {
    setUploading(key);
    try {
      const formData = new FormData();
      formData.append("key", key);
      formData.append("label", DEFAULT_LABELS[key] || key);
      formData.append("url", "");

      const res = await fetch("/api/admin/brand", { method: "PUT", body: formData });
      if (res.ok) {
        toast.success(`Đã reset ${DEFAULT_LABELS[key]} về mặc định`);
        loadConfig();
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setUploading(null);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🎨 Thương hiệu</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quản lý logo, icon, favicon cho toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUsage(!showUsage)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showUsage ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Info size={13} />
            Vị trí sử dụng
          </button>
          <span className="text-xs text-muted-foreground">v{config?.version || 1}</span>
          <button onClick={() => { loadConfig(); loadStorageFiles(); }} className="p-2 rounded-lg hover:bg-muted/50" title="Tải lại">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Usage locations table */}
      {showUsage && (
        <div className="mb-8 p-4 rounded-xl border border-border bg-card/50">
          <h2 className="text-sm font-semibold mb-3">📋 Vị trí sử dụng & kích thước khuyến nghị</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Asset</th>
                  <th className="text-left py-2 pr-4 font-medium">Vị trí</th>
                  <th className="text-left py-2 pr-4 font-medium">Kích thước</th>
                  <th className="text-left py-2 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(USAGE_LOCATIONS).map(([key, locations]) => (
                  locations.map((loc, i) => (
                    <tr key={`${key}-${i}`} className="border-b border-border/30">
                      {i === 0 ? (
                        <td className="py-2 pr-4 font-medium text-primary" rowSpan={locations.length}>
                          {DEFAULT_LABELS[key] || key}
                        </td>
                      ) : null}
                      <td className="py-2 pr-4">{loc.where}</td>
                      <td className="py-2 pr-4 font-mono text-primary/70">{loc.size}</td>
                      <td className="py-2 text-muted-foreground">{loc.note}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kho file */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={16} className="text-primary" />
          <h2 className="text-sm font-semibold">📁 Kho file đã upload ({storageFiles.length})</h2>
        </div>
        {storageFiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có file nào. Upload ảnh bên dưới để thêm vào kho.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {storageFiles.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border text-xs group hover:border-primary/30 transition-colors"
              >
                <img src={f.url} alt={f.name} className="w-5 h-5 object-contain rounded" />
                <span className="text-muted-foreground truncate max-w-[120px]">{f.name}</span>
                <span className="text-[10px] text-muted-foreground/50">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset groups */}
      {ASSET_GROUPS.map((group) => (
        <div key={group.title} className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {group.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.keys.map((key) => {
              const asset = config?.assets?.[key];
              const label = DEFAULT_LABELS[key] || key;
              const isUploading = uploading === key;

              return (
                <div key={key} className="relative rounded-xl border border-border bg-card overflow-hidden group">
                  {/* Preview */}
                  <div className="aspect-square bg-muted/30 flex items-center justify-center p-4">
                    {asset?.url ? (
                      <img src={asset.url} alt={label} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Image size={32} />
                        <span className="text-xs">Mặc định</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 border-t border-border">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {asset ? asset.url.split("/").pop() : "Dùng file trong /public/"}
                    </p>

                    {/* Kích thước khuyến nghị */}
                    {USAGE_LOCATIONS[key] && (
                      <p className="text-[10px] text-primary/60 mt-1">
                        📐 {USAGE_LOCATIONS[key][0].size}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3">
                      <label className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 cursor-pointer transition-colors">
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        Upload
                        <input
                          type="file"
                          accept="image/*,.ico"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(key, file);
                          }}
                          disabled={isUploading}
                        />
                      </label>

                      {/* Chọn từ kho */}
                      <button
                        onClick={() => { loadStorageFiles(); setFilePickerKey(filePickerKey === key ? null : key); }}
                        disabled={isUploading}
                        className="px-2 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs hover:bg-muted/50 hover:text-foreground transition-colors"
                        title="Chọn từ kho"
                      >
                        <FolderOpen size={12} />
                      </button>

                      {asset?.url && (
                        <button
                          onClick={() => handleReset(key)}
                          disabled={isUploading}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Reset"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* File picker dropdown */}
                    {filePickerKey === key && (
                      <div className="mt-2 p-2 rounded-lg border border-border bg-background max-h-40 overflow-y-auto space-y-1">
                        {storageFiles.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground p-1">Chưa có file trong kho</p>
                        ) : (
                          storageFiles.map((f) => (
                            <button
                              key={f.name}
                              onClick={() => handlePickFile(key, f.url, f.name)}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-primary/10 transition-colors text-left"
                            >
                              <img src={f.url} alt={f.name} className="w-5 h-5 object-contain rounded" />
                              <span className="flex-1 truncate">{f.name}</span>
                              <span className="text-[10px] text-muted-foreground">{formatSize(f.size)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Info */}
      <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Cách hoạt động</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Upload</strong> → file được lưu vào Supabase Storage, có thể dùng lại cho asset khác qua nút 📁</li>
          <li><strong>Chọn từ kho</strong> → dùng file đã upload trước đó, không cần upload lại</li>
          <li><strong>🗑️ Reset</strong> → xóa custom, dùng file mặc định trong <code className="text-primary">/public/</code></li>
          <li>Sau khi đổi favicon/PWA icon, user cần <strong>Cài lại</strong> PWA để thấy</li>
        </ul>
      </div>
    </div>
  );
}
