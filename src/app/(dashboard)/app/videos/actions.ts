"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const videoSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  description: z.string().max(2000, "Mô tả quá dài").optional(),
  project_id: z.string().uuid("Dự án không hợp lệ").optional().nullable(),
  url: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["processing", "ready", "failed", "published"]),
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
    url: formData.get("url") || null,
    status: formData.get("status"),
  };

  const parsed = videoSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, description, project_id, url, status } = parsed.data;

  const { error } = await supabase.from("videos").insert({
    user_id: user.id,
    title,
    description: description || null,
    project_id: project_id || null,
    url: url || null,
    status,
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
    url: formData.get("url") || null,
    status: formData.get("status"),
  };

  const parsed = videoSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, description, project_id, url, status } = parsed.data;

  const { error } = await supabase
    .from("videos")
    .update({
      title,
      description: description || null,
      project_id: project_id || null,
      url: url || null,
      status,
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
