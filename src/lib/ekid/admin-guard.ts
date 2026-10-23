import { createClient } from "@/lib/supabase/server";

/**
 * Chỉ người có trong `admin_users` mới được duyệt nội dung.
 *
 * Middleware đã chặn TRANG /admin theo host admin.nooi.net, nhưng route /api/admin/*
 * không đi qua bước kiểm đó — nên mọi API quản trị phải tự kiểm tại đây.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return { userId: user.id, email: (data.email as string | null) ?? user.email ?? null };
}
