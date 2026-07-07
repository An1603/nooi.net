"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, FileText, Play, Music, Image, File, BookOpen } from "lucide-react";
import { createDocument } from "../actions";
import { createClient } from "@/lib/supabase/client";

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

export default function NewDocumentPage() {
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [selectedType, setSelectedType] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file_type: "",
      category: "",
      body: "",
      url: "",
      duration: "",
      caption: "",
      pages: 0,
      project_id: "",
    },
  });

  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("projects")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title");
      if (data) setProjects(data);
    }
    loadProjects();
  }, []);

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

    const result = await createDocument(formData);
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/app/library"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài liệu mới</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tạo tài liệu, video, audio, hình ảnh hoặc ghi chú mới.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 p-6 rounded-xl border border-border bg-card"
      >
        {/* File type selector */}
        <div className="space-y-2">
          <Label>Loại tài liệu *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {FILE_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = selectedType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTypeSelect(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-primary" : opt.color}`} />
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {errors.file_type && <p className="text-xs text-destructive">{errors.file_type.message}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input
            id="title"
            placeholder="Nhập tiêu đề tài liệu"
            {...register("title")}
            aria-invalid={!!errors.title || undefined}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Thể loại</Label>
          <Input
            id="category"
            placeholder="VD: Thiền, Tâm lý học, Yoga..."
            {...register("category")}
          />
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </div>

        {/* URL (chỉ hiện cho video/audio/image/pdf) */}
        {requiresUrl && (
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder={
                selectedType === "video"
                  ? "https://youtube.com/watch?v=..."
                  : selectedType === "audio"
                  ? "https://example.com/audio.mp3"
                  : selectedType === "image"
                  ? "https://example.com/image.jpg"
                  : "https://example.com/document.pdf"
              }
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>
        )}

        {/* Duration (chỉ cho video/audio) */}
        {(selectedType === "video" || selectedType === "audio") && (
          <div className="space-y-2">
            <Label htmlFor="duration">Thời lượng</Label>
            <Input
              id="duration"
              placeholder="VD: 15:00"
              {...register("duration")}
            />
            {errors.duration && (
              <p className="text-xs text-destructive">{errors.duration.message}</p>
            )}
          </div>
        )}

        {/* Caption (chỉ cho image) */}
        {selectedType === "image" && (
          <div className="space-y-2">
            <Label htmlFor="caption">Chú thích</Label>
            <Input
              id="caption"
              placeholder="Chú thích cho hình ảnh..."
              {...register("caption")}
            />
            {errors.caption && (
              <p className="text-xs text-destructive">{errors.caption.message}</p>
            )}
          </div>
        )}

        {/* Pages (chỉ cho pdf) */}
        {selectedType === "pdf" && (
          <div className="space-y-2">
            <Label htmlFor="pages">Số trang</Label>
            <Input
              id="pages"
              type="number"
              min={0}
              max={9999}
              placeholder="0"
              {...register("pages")}
            />
            {errors.pages && (
              <p className="text-xs text-destructive">{errors.pages.message}</p>
            )}
          </div>
        )}

        {/* Body content (markdown) */}
        {(!selectedType || selectedType === "document" || selectedType === "note") && (
          <div className="space-y-2">
            <Label htmlFor="body">Nội dung</Label>
            <Textarea
              id="body"
              placeholder="Viết nội dung... hỗ trợ markdown cơ bản (# ## ### - **text**)"
              rows={8}
              {...register("body")}
            />
            {errors.body && (
              <p className="text-xs text-destructive">{errors.body.message}</p>
            )}
          </div>
        )}

        {/* Project */}
        <div className="space-y-2">
          <Label htmlFor="project_id">Dự án</Label>
          <select
            id="project_id"
            {...register("project_id")}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Không thuộc dự án nào</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Save size={16} />
                Tạo tài liệu
              </>
            )}
          </Button>
          <Link
            href="/app/library"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
