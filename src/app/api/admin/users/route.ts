import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/users — list all users
export async function GET() {
  const supabase = createAdminClient();
  
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get all admin users for role mapping
  const { data: admins } = await supabase
    .from("admin_users")
    .select("user_id, email, role");

  const adminMap = new Map((admins ?? []).map((a: { user_id: string; email: string; role: string }) => [a.user_id, a]));

  const users = (profiles ?? []).map((p) => ({
    id: p["user_id"] as string,
    full_name: p["full_name"] as string | null,
    email: (adminMap.get(p["user_id"] as string)?.email as string) ?? null,
    onboarding_completed: p["onboarding_completed"] as boolean,
    has_numerology: p["numerology_report"] !== null,
    has_tuvi: p["tuvi_report"] !== null,
    has_astrology: p["chiem_tinh_report"] !== null,
    role: (adminMap.get(p["user_id"] as string)?.role as string) ?? "user",
    created_at: p["created_at"] as string,
    date_of_birth: p["date_of_birth"] as string | null,
    gio_sinh: p["gio_sinh"] as number | null,
    gioi_tinh: p["gioi_tinh"] as string | null,
    noi_sinh: p["noi_sinh"] as string | null,
  }));

  return NextResponse.json({ users });
}

// POST /api/admin/users — create new user
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    // Create auth user via admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authUser?.user) {
      return NextResponse.json({ error: "Không thể tạo user" }, { status: 500 });
    }

    // Profile should be auto-created by DB trigger
    return NextResponse.json({
      success: true,
      user: { id: authUser.user.id, email: authUser.user.email },
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}