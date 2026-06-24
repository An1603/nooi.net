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
import { updateDocument, deleteDocument } from "../../actions";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  content: z.string().max(10000, "Nội dung quá dài").optional(),
  project_id: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditDocumentPage({
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
      const { id: did } = await params;
      setId(did);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [{ data: doc }, { data: projList }] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .eq("id", did)
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

      if (!doc) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      reset({
        title: doc.title,
        content: doc.content || "",
        project_id: doc.project_id || "",
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
    formData.set("content", data.content || "");
    formData.set("project_id", data.project_id || "");

    const result = await updateDocument(id, formData);
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.")) return;
    setDeleting(true);
    const result = await deleteDocument(id);
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
          <div className="h-32 w-full bg-muted rounded-lg" />
          <div className="h-8 w-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-lg font-semibold mb-2">Không tìm thấy tài liệu</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tài liệu không tồn tại hoặc bạn không có quyền chỉnh sửa.
        </p>
        <Link
          href="/app/library"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Quay lại thư viện
        </Link>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa tài liệu</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cập nhật nội dung tài liệu.
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
            placeholder="Nhập tiêu đề tài liệu"
            {...register("title")}
            aria-invalid={!!errors.title || undefined}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Nội dung</Label>
          <Textarea
            id="content"
            placeholder="Nhập nội dung tài liệu..."
            rows={8}
            {...register("content")}
          />
          {errors.content && (
            <p className="text-xs text-destructive">{errors.content.message}</p>
          )}
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
              href="/app/library"
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
            Xóa tài liệu
          </button>
        </div>
      </form>
    </div>
  );
}
