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
import { createDocument } from "../actions";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  content: z.string().max(10000, "Nội dung quá dài").optional(),
  project_id: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewDocumentPage() {
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
      content: "",
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

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("content", data.content || "");
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
            Tạo một tài liệu hoặc ghi chú mới.
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
            placeholder="Nhập tiêu đề tài liệu"
            {...register("title")}
            aria-invalid={!!errors.title || undefined}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Content */}
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
