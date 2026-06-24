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
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createVideo } from "../actions";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  description: z.string().max(2000, "Mô tả quá dài").optional(),
  project_id: z.string().optional().nullable(),
  url: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["processing", "ready", "failed", "published"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewVideoPage() {
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      project_id: "",
      url: "",
      status: "processing",
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

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description || "");
    formData.set("project_id", data.project_id || "");
    formData.set("url", data.url || "");
    formData.set("status", data.status);

    const result = await createVideo(formData);
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/app/videos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video mới</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Thêm video mới vào thư viện.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 p-6 rounded-xl border border-border bg-card"
      >
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input
            id="title"
            placeholder="Nhập tiêu đề video"
            {...register("title")}
            aria-invalid={!!errors.title || undefined}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            placeholder="Mô tả về video"
            rows={3}
            {...register("description")}
          />
        </div>

        {/* Project */}
        <div className="space-y-2">
          <Label htmlFor="project_id">Dự án</Label>
          <Select id="project_id" {...register("project_id")}>
            <option value="">Không thuộc dự án nào</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="url">URL Video</Label>
          <Input
            id="url"
            placeholder="https://example.com/video.mp4"
            {...register("url")}
            aria-invalid={!!errors.url || undefined}
          />
          {errors.url && (
            <p className="text-xs text-destructive">{errors.url.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select id="status" {...register("status")}>
            <option value="processing">Đang xử lý</option>
            <option value="ready">Sẵn sàng</option>
            <option value="published">Đã xuất bản</option>
            <option value="failed">Thất bại</option>
          </Select>
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
                Thêm video
              </>
            )}
          </Button>
          <Link
            href="/app/videos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
