import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolvePlacement } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// Lấy user hiện tại từ phiên đăng nhập (client server cần await).
async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Các trường được phép cập nhật qua PATCH.
type UpdateFields = {
  name?: string;
  date_of_birth?: string;
  avatar_emoji?: string | null;
  favorite_voice?: string | null;
  daily_limit_min?: number;
  level?: number;
  placement_age_band?: string;
  placement_level?: number;
};

// GET /api/ekid/kids — danh sách hồ sơ trẻ của user, sắp theo thời điểm tạo.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_kids")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kids: data ?? [] });
}

// POST /api/ekid/kids — tạo hồ sơ trẻ mới, tự tính định vị ban đầu từ ngày sinh.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const { name, date_of_birth, avatar_emoji, favorite_voice } = body as {
    name?: string;
    date_of_birth?: string;
    avatar_emoji?: string;
    favorite_voice?: string | null;
  };

  if (!name || !date_of_birth) {
    return NextResponse.json({ error: "Thiếu tên hoặc ngày sinh" }, { status: 400 });
  }

  const placement = resolvePlacement({ dob: date_of_birth });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_kids")
    .insert({
      user_id: user.id,
      name,
      date_of_birth,
      avatar_emoji: avatar_emoji || "🦊",
      favorite_voice: favorite_voice || null,
      placement_age_band: placement.ageBand,
      placement_level: placement.level,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kid: data });
}

// PATCH /api/ekid/kids — cập nhật hồ sơ; tính lại định vị nếu đổi ngày sinh.
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { id, ...rest } = (await req.json()) ?? {};
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const fields = rest as UpdateFields;
  // Không cho phép đổi chủ sở hữu qua API.
  delete (fields as Record<string, unknown>).user_id;

  if (fields.date_of_birth) {
    const p = resolvePlacement({ dob: fields.date_of_birth });
    fields.placement_age_band = p.ageBand;
    fields.placement_level = p.level;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_kids")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kid: data });
}

// DELETE /api/ekid/kids — xoá hồ sơ trẻ theo id (chỉ hồ sơ của chính user).
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { id } = (await req.json()) ?? {};
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("ekid_kids")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
