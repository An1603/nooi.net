import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Nguoi = {
  user_id: string;
  ten: string;
  email: string;
  dien_thoai: string;
  cap_do?: number;
  ngay_tao?: string;
  avatar?: string;
  slug?: string;
};

async function laQuanTri(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data && ["super_admin", "admin"].includes(data.role);
}

/** Tìm người trong hệ thống nooi.net theo tên / email / số điện thoại. */
export async function GET(req: NextRequest) {
  if (!(await laQuanTri())) return NextResponse.json({ loi: "Không có quyền" }, { status: 403 });

  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const admin = createAdminClient();

  // 1. Danh sách tài khoản (email + số điện thoại nằm ở auth.users)
  const taiKhoan: { id: string; email: string; phone: string; ten: string; tao: string }[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data?.users ?? [];
    for (const u of users) {
      taiKhoan.push({
        id: u.id,
        email: (u.email || "").toLowerCase(),
        phone: (u.phone || "").toLowerCase(),
        ten: String((u.user_metadata as Record<string, unknown> | null)?.full_name || ""),
        tao: u.created_at || "",
      });
    }
    if (users.length < 200) break;
  }

  // 2. Hồ sơ (tên hiển thị + cấp độ)
  const { data: hoSo } = await admin
    .from("profiles")
    .select("user_id, full_name, level, public_avatar_url, public_slug")
    .limit(2000);
  const theoTen = new Map((hoSo ?? []).map((p) => [p.user_id as string, p]));

  const ds: Nguoi[] = taiKhoan.map((u) => {
    const p = theoTen.get(u.id);
    return {
      user_id: u.id,
      ten: (p?.full_name as string) || u.ten || u.email.split("@")[0] || "(chưa đặt tên)",
      email: u.email,
      dien_thoai: u.phone,
      cap_do: (p?.level as number) ?? undefined,
      ngay_tao: u.tao,
      avatar: (p?.public_avatar_url as string) || undefined,
      slug: (p?.public_slug as string) || undefined,
    };
  });

  const loc = q
    ? ds.filter(
        (n) =>
          n.ten.toLowerCase().includes(q) ||
          n.email.includes(q) ||
          n.dien_thoai.includes(q)
      )
    : ds;

  loc.sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
  return NextResponse.json({ tong: loc.length, ds: loc.slice(0, 30) });
}
