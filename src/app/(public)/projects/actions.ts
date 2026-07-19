"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const investmentSchema = z.object({
  projectId: z.string().uuid(),
  investorName: z.string().min(2, "Tên chưa hợp lệ"),
  investorEmail: z.string().email("Email chưa hợp lệ"),
  investorPhone: z.string().min(1, "Số điện thoại là bắt buộc"),
  amount: z.coerce.number().min(1000000, "Minimum investment: 1.000.000 VND"),
  notes: z.string().max(500).optional().or(z.string().max(500, "Notes quá dài").optional()),
});

export async function createInvestment(formData: FormData): Promise<{ 
  success?: boolean; 
  error?: string;
  redirectUrl?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const raw = {
    projectId: formData.get("projectId"),
    investorName: formData.get("investorName"),
    investorEmail: formData.get("investorEmail"),
    investorPhone: formData.get("investorPhone"),
    amount: formData.get("amount"),
    notes: formData.get("notes"),
  };

  const parsed = investmentSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat().join(", ") };
  }

  const { projectId, investorName, investorEmail, investorPhone, amount, notes } = parsed.data;

  // Kiểm tra dự án tồn tại
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, investment_target")
    .eq("id", projectId)
    .single();

  if (!project) {
    return { error: "Dự án không tồn tại" };
  }

  // Kiểm tra đã đầu tư chưa
  const { data: existingInvestment } = await supabase
    .from("investments")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user?.id)
    .single();

  if (existingInvestment && user) {
    return { error: "Bạn đã đầu tư vào dự án này rồi" };
  }

  // Kiểm tra xem user không đã đăng ký chưa (nếu không login, dùng email)
  const { data: existingEmailInvestment } = await supabase
    .from("investments")
    .select("id")
    .eq("project_id", projectId)
    .eq("investor_email", investorEmail)
    .eq("payment_status", "pending")
    .single();

  if (existingEmailInvestment) {
    return { error: "Email này đã có yêu cầu đầu tư cho dự án này. Vui lòng kiểm tra email của bạn." };
  }

  const { error } = await supabase.from("investments").insert({
    project_id: projectId,
    user_id: user?.id,
    investor_name: investorName,
    investor_email: investorEmail,
    investor_phone: investorPhone,
    amount,
    notes: notes || null,
    payment_status: "pending",
    payment_method: formData.get("paymentMethod") || "bank_transfer",
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    redirectUrl: `/app/investments/${projectId}`,
  };
}

export async function getUserInvestment(projectId: string, userId: string) {
  const supabase = await createClient();
  
  const { data: investment } = await supabase
    .from("investments")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("payment_status", "paid")
    .single();

  return investment;
}
