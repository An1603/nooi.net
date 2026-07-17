"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Trash2, Loader2, FileText, Play, Music, Image, File, BookOpen } from "lucide-react";
import { updateDocument, deleteDocument } from "../../actions";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  file_type: z.string().optional(),
  category: z.string().max(100, "Thể loại quá dài").optional(),
  body: z.string().max(10000, "Nội dung quá dài").optional(),
  url: z.string().max(500, "URL quá dài").optional(),
  duration: z.string().max(20, "Thời lượng quá dài").optional(),
  caption: z.string().max(300, "Chú thích quá dài").optional(),
  pages: z.any().optional(),
  project_id: z.string().optional().nullable(),
});

type FormValues = {
  title: string;
  file_type?: string;
  category?: string;
  body?: string;
  url?: string;
  duration?: string;
  caption?: string;
  pages?: number | string;
  project_id?: string | null;
};

const FILE_TYPE_OPTIONS = [
  { value: "document", label: "Bài viết", icon: FileText, color: "text-blue-400" },
  { value: "video", label: "Video", icon: Play, color: "text-red-400" },
  { value: "audio", label: "Audio", icon: Music, color: "text-green-400" },
  { value: "image", label: "Hình ảnh", icon: Image, color: "text-yellow-400" },
  { value: "pdf", label: "PDF", icon: File, color: "text-orange-400" },
  { value: "note", label: "Ghi chú", icon: BookOpen, color: "text-purple-400" },
];

function parseContent(content: string | null) {
  if (!content) return { body: "", category: "", url: "", duration: "", caption: "", pages: 0 };
  try {
    const p = JSON.parse(content);
    return { body: p.body || "", category: p.category || "", url: p.url || "", duration: p.duration || "", caption: p.caption || "", pages: p.pages || 0 };
  } catch {
    return { body: content, category: "", url: "", duration: "", caption: "", pages: 0 };
  }
}

export default function EditDocumentClient({
  doc,
  projects,
}: {
  doc: any;
  projects: { id: string; title: string }[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedType, setSelectedType] = useState(doc.file_type || "");

  const parsed = parseContent(doc.content);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: doc.title,
      file_type: doc.file_type || "",
      category: parsed.category,
      body: parsed.body,
      url: parsed.url,
      duration: parsed.duration,
      caption: parsed.caption,
      pages: parsed.pages,
      project_id: doc.project_id || "",
    },
  });

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setValue("file_type", type);
  };

  const requiresUrl = ["video", "audio", "image", "pdf"].includes(selectedType);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("file_type", data.file_type || "");
    formData.set("category", data.category || "");
    formData.set("body", data.body || "");
    formData.set("url", data.url || "");
    formData.set("duration", data.duration || "");
    formData.set("caption", data.caption || "");
    formData.set("pages", String(data.pages || 0));
    formData.set("project_id", data.project_id || "");

    const result = await updateDocument(doc.id, formData);
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.")) return;
    setDeleting(true);
    const result = await deleteDocument(doc.id);
    if (result?.error) {
      toast.error(result.error);
      setDeleting(false);
    }
  };

  return (
    <div className="page-shell page-shell-narrow">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/app/library" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa tài liệu</h1>
          <p className="text-muted-foreground mt-1 text-sm">Cập nhật nội dung và thông tin tài liệu.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 rounded-xl border border-border bg-card">
        {/* File type */}
        <div className="space-y-2">
          <Label>Loại tài liệu *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {FILE_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = selectedType === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => handleTypeSelect(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}>
                  <Icon className={`w-5 h-5 ${active ? "text-primary" : opt.color}`} />
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input id="title" placeholder="Nhập tiêu đề tài liệu" {...register("title")} aria-invalid={!!errors.title || undefined} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Thể loại</Label>
          <Input id="category" placeholder="VD: Thiền, Tâm lý học, Yoga..." {...register("category")} />
        </div>

        {/* URL */}
        {requiresUrl && (
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" placeholder={selectedType === "video" ? "https://youtube.com/watch?v=..." : selectedType === "image" ? "https://example.com/image.jpg" : "https://..."} {...register("url")} />
          </div>
        )}

        {/* Duration */}
        {(selectedType === "video" || selectedType === "audio") && (
          <div className="space-y-2">
            <Label htmlFor="duration">Thời lượng</Label>
            <Input id="duration" placeholder="VD: 15:00" {...register("duration")} />
          </div>
        )}

        {/* Caption */}
        {selectedType === "image" && (
          <div className="space-y-2">
            <Label htmlFor="caption">Chú thích</Label>
            <Input id="caption" placeholder="Chú thích cho hình ảnh..." {...register("caption")} />
          </div>
        )}

        {/* Pages */}
        {selectedType === "pdf" && (
          <div className="space-y-2">
            <Label htmlFor="pages">Số trang</Label>
            <Input id="pages" type="number" min={0} max={9999} placeholder="0" {...register("pages")} />
          </div>
        )}

        {/* Body */}
        {(!selectedType || selectedType === "document" || selectedType === "note") && (
          <div className="space-y-2">
            <Label htmlFor="body">Nội dung</Label>
            <Textarea id="body" placeholder="Viết nội dung... hỗ trợ markdown cơ bản" rows={8} {...register("body")} />
          </div>
        )}

        {/* Project */}
        <div className="space-y-2">
          <Label htmlFor="project_id">Dự án</Label>
          <select id="project_id" {...register("project_id")} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">Không thuộc dự án nào</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Đang lưu...</> : <><Save size={16} /> Lưu thay đổi</>}
            </Button>
            <Link href="/app/library" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">Hủy</Link>
          </div>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 size={16} />} Xóa tài liệu
          </button>
        </div>
      </form>
    </div>
  );
}
