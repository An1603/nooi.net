"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const projectSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  description: z.string().max(2000, "Mô tả quá dài").optional(),
  status: z.enum(["draft", "in_progress", "completed", "archived"]),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
  };

  const parsed = projectSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, description, status } = parsed.data;

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    title,
    description: description || null,
    status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/projects");
  redirect("/app/projects");
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Không tìm thấy dự án hoặc bạn không có quyền chỉnh sửa." };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
  };

  const parsed = projectSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, description, status } = parsed.data;

  const { error } = await supabase
    .from("projects")
    .update({ title, description: description || null, status })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${id}`);
  redirect("/app/projects");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/projects");
  redirect("/app/projects");
}
