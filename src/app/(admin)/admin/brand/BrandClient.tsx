"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, RefreshCw, Image, Globe, Smartphone, FileImage, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface BrandAsset {
  key: string;
  label: string;
  url: string;
  file_type: string;
  width?: number;
  height?: number;
  updated_at: string;
}

interface BrandConfig {
  version: number;
  assets: Record<string, BrandAsset>;
}

const ASSET_GROUPS = [
  {
    title: "🌐 Favicon & Web",
    keys: ["favicon", "favicon-png", "apple-touch-icon"],
  },
  {
    title: "📱 PWA Icons",
    keys: ["pwa-icon-192", "pwa-icon-512"],
  },
  {
    title: "🏷️ Logo chính",
    keys: ["logo-horizontal", "logo-horizontal-white", "logo-square", "logo-square-white"],
  },
  {
    title: "🔣 Icon",
    keys: ["logo-icon", "logo-icon-white"],
  },
];

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

export default function AdminBrandPage() {
  const [config, setConfig] = useState<BrandConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/brand");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load brand config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
        loadConfig();
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

  async function handleReset(key: string) {
    setUploading(key);
    try {
      const formData = new FormData();
      formData.append("key", key);
      formData.append("label", DEFAULT_LABELS[key] || key);
      formData.append("url", ""); // Reset về mặc định

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🎨 Thương hiệu</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quản lý logo, icon, favicon cho toàn hệ thống. Upload file mới để thay đổi ngay lập tức.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Version {config?.version || 1}</span>
          <button
            onClick={loadConfig}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            title="Tải lại"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

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
                <div
                  key={key}
                  className="relative rounded-xl border border-border bg-card overflow-hidden group"
                >
                  {/* Preview */}
                  <div className="aspect-square bg-muted/30 flex items-center justify-center p-4">
                    {asset?.url ? (
                      <img
                        src={asset.url}
                        alt={label}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Image size={32} />
                        <span className="text-xs">Chưa có</span>
                      </div>
                    )}
                  </div>

                  {/* Info & Actions */}
                  <div className="p-3 border-t border-border">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {asset ? key : "Dùng mặc định"}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      {/* Upload button */}
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 cursor-pointer transition-colors">
                        {isUploading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(key, file);
                          }}
                          disabled={isUploading}
                        />
                      </label>

                      {/* Reset */}
                      {asset?.url && (
                        <button
                          onClick={() => handleReset(key)}
                          disabled={isUploading}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Reset về mặc định"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Info box */}
      <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Cách hoạt động</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Upload ảnh mới → thay đổi ngay trên toàn hệ thống (không cần deploy)</li>
          <li>File được lưu trên Supabase Storage, phục vụ qua CDN toàn cầu</li>
          <li>Bấm 🗑️ để reset về file mặc định trong <code className="text-primary">/public/</code></li>
          <li>Sau khi đổi favicon/PWA icon, người dùng cần <strong>Cài lại</strong> để thấy thay đổi</li>
        </ul>
      </div>
    </div>
  );
}
