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
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { updateVideo, deleteVideo } from "../../actions";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  description: z.string().max(2000, "Mô tả quá dài").optional(),
  project_id: z.string().optional().nullable(),
  url: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["processing", "ready", "failed", "published"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { id: vid } = await params;
      setId(vid);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [{ data: video }, { data: projList }] = await Promise.all([
        supabase
          .from("videos")
          .select("*")
          .eq("id", vid)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("projects")
          .select("id, title")
          .eq("user_id", user.id)
          .order("title"),
      ]);

      if (cancelled) return;
      if (projList) setProjects(projList);

      if (!video) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      reset({
        title: video.title,
        description: video.description || "",
        project_id: video.project_id || "",
        url: video.url || "",
        status: video.status,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [params, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description || "");
    formData.set("project_id", data.project_id || "");
    formData.set("url", data.url || "");
    formData.set("status", data.status);

    const result = await updateVideo(id, formData);
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.")) return;
    setDeleting(true);
    const result = await deleteVideo(id);
    if (result?.error) {
      toast.error(result.error);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6 p-6 rounded-xl border border-border bg-card">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-8 w-full bg-muted rounded-lg" />
          <div className="h-20 w-full bg-muted rounded-lg" />
          <div className="h-8 w-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-lg font-semibold mb-2">Không tìm thấy video</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Video không tồn tại hoặc bạn không có quyền chỉnh sửa.
        </p>
        <Link
          href="/app/videos"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Quay lại thư viện video
        </Link>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa video</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cập nhật thông tin video.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 p-6 rounded-xl border border-border bg-card"
      >
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

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            placeholder="Mô tả về video"
            rows={3}
            {...register("description")}
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select id="status" {...register("status")}>
            <option value="processing">Đang xử lý</option>
            <option value="ready">Sẵn sàng</option>
            <option value="published">Đã xuất bản</option>
            <option value="failed">Thất bại</option>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu thay đổi
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
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Xóa video
          </button>
        </div>
      </form>
    </div>
  );
}
