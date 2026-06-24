"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const documentSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  content: z.string().max(10000, "Nội dung quá dài").optional(),
  project_id: z.string().uuid("Dự án không hợp lệ").optional().nullable(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;

export async function createDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
    project_id: formData.get("project_id") || null,
  };

  const parsed = documentSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, content, project_id } = parsed.data;

  const { error } = await supabase.from("documents").insert({
    user_id: user.id,
    title,
    content: content || null,
    project_id: project_id || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/library");
  redirect("/app/library");
}

export async function updateDocument(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Không tìm thấy tài liệu hoặc bạn không có quyền chỉnh sửa." };
  }

  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
    project_id: formData.get("project_id") || null,
  };

  const parsed = documentSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { title, content, project_id } = parsed.data;

  const { error } = await supabase
    .from("documents")
    .update({
      title,
      content: content || null,
      project_id: project_id || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/library");
  redirect("/app/library");
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/library");
  redirect("/app/library");
}
