import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tìm hồ sơ bé gắn với TÀI KHOẢN CON đang đăng nhập (ekid_kids.child_user_id = user.id).
 * Dùng khi con gọi API mà không truyền `kid_id` — server tự suy ra hồ sơ của chính bé.
 * Trả null nếu user hiện tại không phải tài khoản con (không có hồ sơ nào gắn).
 */
export async function resolveChildKidId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id")
    .eq("child_user_id", userId)
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
