import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/**
 * Người dùng của phiên hiện tại, đọc từ cookie qua Supabase server client.
 *
 * Dùng cho các route handler cần biết "ai đang gọi" thay vì tin `user_id` do
 * client gửi trong body (audit 01/11/2026: /api/upload/avatar và
 * /api/ref-code/change từng nhận danh tính từ form/body).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}
