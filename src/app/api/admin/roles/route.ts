import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/roles — list all admin users
export async function GET() {
  const supabase = createAdminClient();

  const { data: adminUsers, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get profiles separately (no FK relationship in schema cache)
  const userIds = (adminUsers ?? []).map((a: { user_id: string }) => a.user_id);
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]));

  const roles = (adminUsers ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    user_id: r.user_id,
    email: r.email,
    role: r.role,
    full_name: profileMap.get(r.user_id as string) || "",
    created_at: r.created_at,
  }));

  return NextResponse.json({ roles });
}

// POST /api/admin/roles — assign/change/remove admin role
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await request.json();
    const { action, user_id, email, role } = body;

    if (action === "assign") {
      if (!user_id || !email || !role) {
        return NextResponse.json({ error: "Thiếu thông tin: user_id, email, role" }, { status: 400 });
      }
      if (!["admin", "moderator"].includes(role)) {
        return NextResponse.json({ error: "Role không hợp lệ" }, { status: 400 });
      }
      const { error } = await supabase.from("admin_users").insert({ user_id, email, role });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "change_role") {
      if (!user_id || !role) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
      const { error } = await supabase.from("admin_users").update({ role }).eq("user_id", user_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "remove") {
      if (!user_id) return NextResponse.json({ error: "Thiếu user_id" }, { status: 400 });
      const { error } = await supabase.from("admin_users").delete().eq("user_id", user_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
