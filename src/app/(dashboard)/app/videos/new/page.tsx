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
import { DANH_MUC } from "@/lib/video/danh-muc";

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  description: z.string().max(2000, "Mô tả quá dài").optional(),
  project_id: z.string().optional().nullable(),
  danh_muc: z.string().max(60, "Mã danh mục quá dài").optional(),
  url: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["processing", "ready", "failed", "published"]),
  kenh_phat: z.enum(["youtube", "bunny", "truc-tiep"]),
  cong_khai: z.boolean(),
  khung_hinh: z.enum(["ngang", "doc"]),
  thu_tu: z.number().int().min(0).max(9999),
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
      danh_muc: "",
      url: "",
      status: "processing",
      kenh_phat: "youtube",
      cong_khai: false,
      khung_hinh: "ngang",
      thu_tu: 0,
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
    formData.set("danh_muc", data.danh_muc || "");
    formData.set("url", data.url || "");
    formData.set("status", data.status);
    formData.set("kenh_phat", data.kenh_phat);
    formData.set("cong_khai", data.cong_khai ? "on" : "");
    formData.set("khung_hinh", data.khung_hinh);
    formData.set("thu_tu", String(data.thu_tu ?? 0));

    const result = await createVideo(formData);
    if (result?.error) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell page-shell-narrow">
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

        {/* Danh mục kho video */}
        <div className="space-y-2">
          <Label htmlFor="danh_muc">Danh mục</Label>
          <Select id="danh_muc" {...register("danh_muc")}>
            <option value="">Không xếp danh mục</option>
            {DANH_MUC.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.ten}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Video cùng danh mục nằm chung một luồng vuốt (Ảnh→ mục “Danh mục video”), xem được cả
            video dọc lẫn ngang.
          </p>
        </div>

        {/* Kênh phát */}
        <div className="space-y-2">
          <Label htmlFor="kenh_phat">Kênh phát</Label>
          <Select id="kenh_phat" {...register("kenh_phat")}>
            <option value="youtube">YouTube — video cần người lạ tìm thấy</option>
            <option value="bunny">Bunny Stream — video phục vụ người trong hệ sinh thái</option>
            <option value="truc-tiep">Tệp trực tiếp (.mp4) — dùng để thử nhanh</option>
          </Select>
          <p className="text-xs text-muted-foreground">
            Quy ước: cần thu hút người mới → YouTube; cần khoá quyền, tặng theo cấp độ → Bunny.
          </p>
        </div>

        {/* Khung hình: dọc thì vào luồng vuốt */}
        <div className="space-y-2">
          <Label htmlFor="khung_hinh">Khung hình</Label>
          <Select id="khung_hinh" {...register("khung_hinh")}>
            <option value="ngang">Ngang 16:9 — video thường</option>
            <option value="doc">Dọc 9:16 — vào luồng vuốt</option>
          </Select>
          <p className="text-xs text-muted-foreground">
            Video dọc xuất hiện trong luồng vuốt kiểu TikTok ở mục “Vuốt dọc”.
          </p>
        </div>

        {/* Thứ tự trong luồng vuốt */}
        <div className="space-y-2">
          <Label htmlFor="thu_tu">Thứ tự trong luồng</Label>
          <Input
            id="thu_tu"
            type="number"
            min={0}
            placeholder="0"
            {...register("thu_tu", { valueAsNumber: true })}
          />
          <p className="text-xs text-muted-foreground">
            Số lớn hơn đứng trước. Bài ghim để 1000; để 0 thì theo thời gian đăng.
          </p>
        </div>

        {/* Công khai */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
          <input
            id="cong_khai"
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--accent)]"
            {...register("cong_khai")}
          />
          <div>
            <Label htmlFor="cong_khai">Công khai</Label>
            <p className="text-xs text-muted-foreground">
              Bỏ trống = nội bộ (chỉ hiện trong thư viện của mình).
            </p>
          </div>
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
