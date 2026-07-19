"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Trash2, Plus, X } from "lucide-react";

type ProjectData = Record<string, unknown>;

interface FieldSection {
  title: string;
  fields: Array<{
    key: string;
    label: string;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    type?: string;
    hint?: string;
    defaultValue?: string;
  }>;
}

const SECTIONS: FieldSection[] = [
  {
    title: "Cơ bản",
    fields: [
      { key: "title", label: "Tên dự án *", placeholder: "NOOI Forest" },
      { key: "description", label: "Mô tả ngắn", multiline: true, rows: 3, placeholder: "Mô tả..." },
      { key: "location", label: "Địa điểm", placeholder: "Măng Đen, Kon Tum" },
      { key: "status", label: "Trạng thái", type: "select", defaultValue: "draft" },
    ],
  },
  {
    title: "Tài chính",
    fields: [
      { key: "investment_target", label: "Mục tiêu huy động (VNĐ)", type: "number", placeholder: "500000000" },
      { key: "break_even", label: "Điểm hòa vốn (VNĐ)", type: "number", placeholder: "200000000" },
      { key: "revenue_share", label: "Chia lợi nhuận", placeholder: "60-40" },
      { key: "roi_estimate", label: "ROI (JSON)", multiline: true, rows: 2, placeholder: '[{"year":1,"rate":8}]', hint: "JSON array" },
    ],
  },
  {
    title: "Media",
    fields: [
      { key: "cover_image", label: "Ảnh bìa (URL)", placeholder: "https://..." },
      { key: "video_url", label: "Video URL", placeholder: "https://youtube.com/..." },
      { key: "video_poster", label: "Poster video (URL)", placeholder: "https://..." },
    ],
  },
  {
    title: "Nội dung HTML",
    fields: [
      { key: "html_content", label: "HTML slide", multiline: true, rows: 10, placeholder: "<h2>Về dự án</h2>...", hint: "HTML slide trình bày" },
    ],
  },
];

export default function ProjectForm({
  initialData,
  onSave,
  onDelete,
  saving,
  deleting,
  error,
}: {
  initialData?: ProjectData;
  onSave: (formData: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
  deleting?: boolean;
  error: string;
}) {
  const isEdit = !!initialData?.id;
  const [showAdvanced, setShowAdvanced] = useState(false);

  // JSON arrays
  const [gallery, setGallery] = useState<string[]>((initialData?.gallery_images as string[]) || []);
  const [highlights, setHighlights] = useState<Array<{ icon: string; title: string; desc: string }>>(
    (initialData?.highlights as Array<{ icon: string; title: string; desc: string }>) || []
  );
  const [timeline, setTimeline] = useState<Array<{ date: string; title: string; desc: string; done: boolean }>>(
    (initialData?.timeline as Array<{ date: string; title: string; desc: string; done: boolean }>) || []
  );

  function appendJSON(formData: FormData, key: string, arr: unknown[]) {
    if (arr.length > 0) formData.set(key, JSON.stringify(arr));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    appendJSON(formData, "gallery_images", gallery);
    appendJSON(formData, "highlights", highlights);
    appendJSON(formData, "timeline", timeline);
    await onSave(formData);
  }

  const inputClass = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft size={14} /> Quay lại danh sách
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight">{isEdit ? "Chỉnh sửa" : "Thêm"} dự án</h1>
        {isEdit && onDelete && (
          <button onClick={onDelete} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Xóa
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
            {section.fields.map((f) => {
              let defVal = "";
              if (initialData && initialData[f.key] !== undefined && initialData[f.key] !== null) {
                const val = (initialData as Record<string, unknown>)[f.key];
                defVal = typeof val === "object" ? JSON.stringify(val) : String(val);
              }
              return (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">{f.label}</label>
                  {f.key === "html_content" && (
    <div className="mb-2">
      <input 
        type="file" 
        accept=".html" 
        className="block w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const target = document.querySelector('textarea[name="html_content"]') as HTMLTextAreaElement;
            if (target) target.value = ev.target?.result as string;
          };
          reader.readAsText(file);
        }} 
      />
    </div>
  )}
  {f.type === "select" ? (
                    <select name={f.key} defaultValue={defVal || f.defaultValue || "draft"} className={inputClass}>
                      <option value="draft">Nháp</option>
                      <option value="in_progress">Đang mở đầu tư</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  ) : f.multiline ? (
                    <textarea name={f.key} rows={f.rows || 4} defaultValue={defVal} placeholder={f.placeholder} className={`${inputClass} resize-none`} />
                  ) : (
                    <input name={f.key} type={f.type || "text"} defaultValue={defVal} placeholder={f.placeholder} className={inputClass} />
                  )}
                  {f.hint && <p className="text-[10px] text-muted-foreground mt-0.5">{f.hint}</p>}
                </div>
              );
            })}
          </div>
        ))}

        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary hover:underline">
          {showAdvanced ? "▲ Ẩn" : "▼ Hiện"} các trường nâng cao (gallery, highlights, timeline)
        </button>

        {showAdvanced && (
          <div className="space-y-4">
            {/* Gallery */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Gallery ảnh</h3>
              {gallery.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input value={url} onChange={(e) => { const n = [...gallery]; n[i] = e.target.value; setGallery(n); }} placeholder="URL ảnh..." className={`${inputClass} flex-1`} />
                  <button type="button" onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="text-destructive shrink-0"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setGallery([...gallery, ""])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12} /> Thêm ảnh</button>
            </div>

            {/* Highlights */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Điểm nổi bật</h3>
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input value={h.icon} onChange={(e) => { const n = [...highlights]; n[i] = { ...n[i], icon: e.target.value }; setHighlights(n); }} placeholder="🌟" className="w-14 px-2 py-2 bg-muted border border-border rounded-lg text-center text-sm" />
                  <input value={h.title} onChange={(e) => { const n = [...highlights]; n[i] = { ...n[i], title: e.target.value }; setHighlights(n); }} placeholder="Tiêu đề" className={`${inputClass} flex-1`} />
                  <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="text-destructive shrink-0"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setHighlights([...highlights, { icon: "🌟", title: "", desc: "" }])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12} /> Thêm</button>
            </div>

            {/* Timeline */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Lộ trình</h3>
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={t.date} onChange={(e) => { const n = [...timeline]; n[i] = { ...n[i], date: e.target.value }; setTimeline(n); }} placeholder="2026-01" className="w-24 px-2 py-2 bg-muted border border-border rounded-lg text-sm text-foreground" />
                  <input value={t.title} onChange={(e) => { const n = [...timeline]; n[i] = { ...n[i], title: e.target.value }; setTimeline(n); }} placeholder="Tiêu đề" className={`${inputClass} flex-1`} />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0"><input type="checkbox" checked={t.done} onChange={(e) => { const n = [...timeline]; n[i] = { ...n[i], done: e.target.checked }; setTimeline(n); }} className="rounded" /> Xong</label>
                  <button type="button" onClick={() => setTimeline(timeline.filter((_, j) => j !== i))} className="text-destructive shrink-0"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setTimeline([...timeline, { date: "", title: "", desc: "", done: false }])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12} /> Thêm</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/80 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo dự án"}
          </button>
          <Link href="/admin/projects" className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
