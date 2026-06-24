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
import { updateProject, deleteProject } from "../../actions";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  description: z.string().max(2000, "Mô tả quá dài").optional(),
  status: z.enum(["draft", "in_progress", "completed", "archived"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
      const { id: pid } = await params;
      setId(pid);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", pid)
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;
      if (!project) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      reset({
        title: project.title,
        description: project.description || "",
        status: project.status,
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
    formData.set("status", data.status);

    const result = await updateProject(id, formData);
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.")) return;
    setDeleting(true);
    const result = await deleteProject(id);
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
          <div className="h-24 w-full bg-muted rounded-lg" />
          <div className="h-8 w-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-lg font-semibold mb-2">Không tìm thấy dự án</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Dự án không tồn tại hoặc bạn không có quyền chỉnh sửa.
        </p>
        <Link
          href="/app/projects"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách dự án
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/app/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa dự án</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cập nhật thông tin dự án của bạn.
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
            placeholder="Nhập tiêu đề dự án"
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
            placeholder="Mô tả ngắn về dự án"
            rows={4}
            {...register("description")}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select id="status" {...register("status")}>
            <option value="draft">Bản nháp</option>
            <option value="in_progress">Đang tiến hành</option>
            <option value="completed">Hoàn thành</option>
            <option value="archived">Đã lưu trữ</option>
          </Select>
        </div>

        {/* Actions */}
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
              href="/app/projects"
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
            Xóa dự án
          </button>
        </div>
      </form>
    </div>
  );
}
