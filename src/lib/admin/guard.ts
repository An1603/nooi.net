import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  userId: string;
  email: string | null;
  role: "super_admin" | "admin" | "moderator" | null;
};

/**
 * Cổng phân quyền của MỌI API quản trị.
 *
 * Vì sao bắt buộc: middleware chỉ chặn được ở tầng request theo host, còn route
 * handler chạy với service-role (bỏ qua RLS). Mỗi handler phải tự kiểm người gọi.
 *
 * Quy tắc: có phiên + có dòng trong `admin_users` → cho qua; còn lại → null.
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    userId: user.id,
    email: (data.email as string | null) ?? user.email ?? null,
    role: (data.role as AdminUser["role"]) ?? null,
  };
}

/** Như requireAdmin nhưng giới hạn thêm vai trò (vd chỉ super_admin được cấp quyền). */
export async function requireAdminRole(
  ...roles: Array<NonNullable<AdminUser["role"]>>
): Promise<AdminUser | null> {
  const admin = await requireAdmin();
  if (!admin || !admin.role) return null;
  return roles.includes(admin.role) ? admin : null;
}
