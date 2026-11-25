"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const videoSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  description: z.string().max(2000, "Mô tả quá dài").optional(),
  project_id: z.string().uuid("Dự án không hợp lệ").optional().nullable(),
  danh_muc: z.string().max(60, "Mã danh mục quá dài").optional().nullable(),
  url: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["processing", "ready", "failed", "published"]),
  kenh_phat: z.enum(["youtube", "bunny", "truc-tiep"]).default("youtube"),
  cong_khai: z.boolean().default(false),
  khung_hinh: z.enum(["ngang", "doc"]).default("ngang"),
  thu_tu: z.coerce.number().int().min(0).max(9999).default(0),
});

export type VideoFormData = z.infer<typeof videoSchema>;

export async function createVideo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    project_id: formData.get("project_id") || null,
    danh_muc: (formData.get("danh_muc") as string) || null,
    url: formData.get("url") || null,
    status: formData.get("status"),
    kenh_phat: formData.get("kenh_phat") || "youtube",
    cong_khai:
      formData.get("cong_khai") === "on" || formData.get("cong_khai") === "true",
    khung_hinh: formData.get("khung_hinh") || "ngang",
    thu_tu: formData.get("thu_tu") || 0,
  };

  const parsed = videoSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, description, project_id, danh_muc, url, status, kenh_phat, cong_khai, khung_hinh, thu_tu } =
    parsed.data;

  const { error } = await supabase.from("videos").insert({
    user_id: user.id,
    title,
    description: description || null,
    project_id: project_id || null,
    danh_muc: danh_muc || null,
    url: url || null,
    status,
    kenh_phat,
    cong_khai,
    khung_hinh,
    thu_tu,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/videos");
  redirect("/app/videos");
}

export async function updateVideo(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("videos")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Không tìm thấy video hoặc bạn không có quyền chỉnh sửa." };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    project_id: formData.get("project_id") || null,
    danh_muc: (formData.get("danh_muc") as string) || null,
    url: formData.get("url") || null,
    status: formData.get("status"),
    kenh_phat: formData.get("kenh_phat") || "youtube",
    cong_khai:
      formData.get("cong_khai") === "on" || formData.get("cong_khai") === "true",
    khung_hinh: formData.get("khung_hinh") || "ngang",
    thu_tu: formData.get("thu_tu") || 0,
  };

  const parsed = videoSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, description, project_id, danh_muc, url, status, kenh_phat, cong_khai, khung_hinh, thu_tu } =
    parsed.data;

  const { error } = await supabase
    .from("videos")
    .update({
      title,
      description: description || null,
      project_id: project_id || null,
      url: url || null,
      status,
      kenh_phat,
      cong_khai,
      khung_hinh,
      thu_tu,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/videos");
  revalidatePath(`/app/videos/${id}`);
  redirect("/app/videos");
}

export async function deleteVideo(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/videos");
  redirect("/app/videos");
}
