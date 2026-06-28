import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/users/[id] — user detail with reports
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get admin role
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role, email")
    .eq("user_id", id)
    .maybeSingle();

  return NextResponse.json({
    user: {
      id: profile.user_id,
      full_name: profile.full_name,
      email: adminUser?.email ?? null,
      onboarding_completed: profile.onboarding_completed,
      date_of_birth: profile.date_of_birth,
      gio_sinh: profile.gio_sinh,
      gioi_tinh: profile.gioi_tinh,
      noi_sinh: profile.noi_sinh,
      vi_do: profile.vi_do,
      kinh_do: profile.kinh_do,
      role: adminUser?.role ?? "user",
      created_at: profile.created_at,
      numerology_report: profile.numerology_report,
      tuvi_report: profile.tuvi_report,
      chiem_tinh_report: profile.chiem_tinh_report,
    },
  });
}

// PUT /api/admin/users/[id] — update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { full_name, date_of_birth, gio_sinh, gioi_tinh, noi_sinh, vi_do, kinh_do } = body;

    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth || null;
    if (gio_sinh !== undefined) updates.gio_sinh = gio_sinh;
    if (gioi_tinh !== undefined) updates.gioi_tinh = gioi_tinh;
    if (noi_sinh !== undefined) updates.noi_sinh = noi_sinh;
    if (vi_do !== undefined) updates.vi_do = vi_do;
    if (kinh_do !== undefined) updates.kinh_do = kinh_do;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// DELETE /api/admin/users/[id] — delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Delete auth user (this will cascade to profiles via FK)
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}