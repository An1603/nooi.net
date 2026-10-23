import { createAdminClient } from "@/lib/supabase/admin";

export interface KidAccessRow {
  id: string;
  name: string;
  user_id: string;
  child_user_id: string | null;
  daily_limit_min: number;
  placement_level: number | null;
}

/**
 * Quyền ĐỌC hồ sơ bé: chủ hồ sơ (cha/mẹ) | chính tài khoản con | người chăm sóc đã liên kết.
 * Trả null nếu không có quyền — route tự trả 403/404.
 */
export async function readKid(userId: string, kidId: string): Promise<KidAccessRow | null> {
  const admin = createAdminClient();
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, name, user_id, child_user_id, daily_limit_min, placement_level")
    .eq("id", kidId)
    .maybeSingle();
  if (!kid) return null;
  if (kid.user_id === userId || kid.child_user_id === userId) return kid as KidAccessRow;

  const { data: link } = await admin
    .from("ekid_caregivers")
    .select("id")
    .eq("kid_id", kidId)
    .eq("caregiver_user_id", userId)
    .eq("status", "linked")
    .maybeSingle();
  return link ? (kid as KidAccessRow) : null;
}

/** Quyền GHI dữ liệu học: chủ hồ sơ hoặc chính bé. Người chăm sóc không ghi. */
export async function writeKid(userId: string, kidId: string): Promise<KidAccessRow | null> {
  const admin = createAdminClient();
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, name, user_id, child_user_id, daily_limit_min, placement_level")
    .eq("id", kidId)
    .maybeSingle();
  if (!kid) return null;
  if (kid.user_id === userId || kid.child_user_id === userId) return kid as KidAccessRow;
  return null;
}

/** Chỉ chủ hồ sơ (cha/mẹ) — dùng cho nhập mục tiêu, đặt phần thưởng, đồng thuận. */
export async function ownerKid(userId: string, kidId: string): Promise<KidAccessRow | null> {
  const admin = createAdminClient();
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, name, user_id, child_user_id, daily_limit_min, placement_level")
    .eq("id", kidId)
    .eq("user_id", userId)
    .maybeSingle();
  return (kid as KidAccessRow | null) ?? null;
}
