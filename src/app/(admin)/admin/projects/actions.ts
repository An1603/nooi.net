"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const supabase = createAdminClient();
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const investment_target = parseInt(formData.get("investment_target") as string) || 0;
  const break_even = parseInt(formData.get("break_even") as string) || 0;
  const revenue_share = formData.get("revenue_share") as string;
  const roi_estimate = formData.get("roi_estimate") as string;
  const status = formData.get("status") as string || "draft";

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      description,
      investment_target,
      break_even,
      revenue_share: revenue_share || null,
      roi_estimate: roi_estimate ? roi_estimate : null,
      status,
      user_id: "00000000-0000-0000-0000-000000000000", // System project
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  revalidatePath("/admin/projects");
  return { success: true, id: data.id };
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = createAdminClient();
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const investment_target = parseInt(formData.get("investment_target") as string) || 0;
  const break_even = parseInt(formData.get("break_even") as string) || 0;
  const revenue_share = formData.get("revenue_share") as string;
  const roi_estimate = formData.get("roi_estimate") as string;
  const status = formData.get("status") as string;

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      description,
      investment_target,
      break_even,
      revenue_share: revenue_share || null,
      roi_estimate: roi_estimate ? roi_estimate : null,
      status,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/admin/projects");
  return { success: true };
}
