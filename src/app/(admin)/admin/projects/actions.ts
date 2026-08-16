"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const FIELD_LIST = [
  "title", "description", "status",
  "investment_target", "break_even", "revenue_share",
  "cover_image", "gallery_images", "video_url", "video_poster",
  "html_content", "highlights", "location", "timeline",
  "financial_capex", "financial_opex", "revenue_phases", "cashflow", "financial_summary",
];

function parseField(value: string | null, field: string) {
  if (!value && value !== "0") return null;
  const jsonFields = ["gallery_images", "highlights", "timeline", "financial_capex", "financial_opex", "revenue_phases", "cashflow", "financial_summary"];
  const numFields = ["investment_target", "break_even"];
  if (jsonFields.includes(field)) {
    try { return JSON.parse(value); } catch { return null; }
  }
  if (numFields.includes(field)) return parseInt(value) || 0;
  return value;
}

export async function createProject(formData: FormData) {
  const supabase = createAdminClient();
  const data: Record<string, unknown> = { user_id: "00000000-0000-0000-0000-000000000000" };

  for (const field of FIELD_LIST) {
    const raw = formData.get(field) as string | null;
    const val = parseField(raw, field);
    if (val !== null) data[field] = val;
  }

  // Also handle roi_estimate (legacy field)
  const roiRaw = formData.get("roi_estimate") as string | null;
  if (roiRaw) {
    try { data.roi_estimate = JSON.parse(roiRaw); } catch { data.roi_estimate = roiRaw; }
  }

  const { data: created, error } = await supabase.from("projects").insert(data).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
  return { success: true, id: created.id };
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const data: Record<string, unknown> = {};

  for (const field of FIELD_LIST) {
    const raw = formData.get(field) as string | null;
    const val = parseField(raw, field);
    if (val !== null) data[field] = val;
  }

  const roiRaw = formData.get("roi_estimate") as string | null;
  if (roiRaw) {
    try { data.roi_estimate = JSON.parse(roiRaw); } catch { data.roi_estimate = roiRaw; }
  }

  const { error } = await supabase.from("projects").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
  return { success: true };
}
