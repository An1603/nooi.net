"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const documentSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề quá dài"),
  file_type: z.enum(["document", "video", "audio", "image", "pdf", "note", ""]).optional(),
  category: z.string().max(100, "Thể loại quá dài").optional(),
  body: z.string().max(10000, "Nội dung quá dài").optional(),
  url: z.string().max(500, "URL quá dài").optional(),
  duration: z.string().max(20, "Thời lượng quá dài").optional(),
  caption: z.string().max(300, "Chú thích quá dài").optional(),
  pages: z.any().optional(),
  project_id: z.string().uuid("Dự án không hợp lệ").optional().nullable(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;

function buildContent(data: z.infer<typeof documentSchema>): string {
  const { body, category, url, duration, caption, pages } = data;
  return JSON.stringify({
    body: body || "",
    category: category || "",
    url: url || "",
    duration: duration || "",
    caption: caption || "",
    pages: pages || 0,
  });
}

export async function createDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw: Record<string, FormDataEntryValue | null> = {};
  for (const key of ["title", "file_type", "category", "body", "url", "duration", "caption", "pages", "project_id"]) {
    raw[key] = formData.get(key);
  }

  const parsed = documentSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const data = parsed.data;
  const content = buildContent(data);

  const { error } = await supabase.from("documents").insert({
    user_id: user.id,
    title: data.title,
    file_type: data.file_type || null,
    content,
    project_id: data.project_id || null,
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

  const raw: Record<string, FormDataEntryValue | null> = {};
  for (const key of ["title", "file_type", "category", "body", "url", "duration", "caption", "pages", "project_id"]) {
    raw[key] = formData.get(key);
  }

  const parsed = documentSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const data = parsed.data;
  const content = buildContent(data);

  const { error } = await supabase
    .from("documents")
    .update({
      title: data.title,
      file_type: data.file_type || null,
      content,
      project_id: data.project_id || null,
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
