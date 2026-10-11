import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Lấy user hiện tại từ phiên đăng nhập (client server cần await).
async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// POST /api/ekid/kids/reset-password — đặt lại mật khẩu cho tài khoản con.
// Nhận { kid_id, password }. Chỉ chủ hồ sơ (owner) được phép đổi.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { kid_id, password } = (await req.json()) ?? {};
  if (!kid_id || !password) {
    return NextResponse.json(
      { error: "Thiếu id hồ sơ hoặc mật khẩu" },
      { status: 400 },
    );
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Mật khẩu phải có ít nhất 6 ký tự" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Xác minh hồ sơ thuộc user hiện tại và có tài khoản con liên kết.
  const { data: kid, error: kidErr } = await admin
    .from("ekid_kids")
    .select("id, child_user_id")
    .eq("id", kid_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (kidErr) return NextResponse.json({ error: kidErr.message }, { status: 500 });
  if (!kid) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  if (!kid.child_user_id) {
    return NextResponse.json(
      { error: "Hồ sơ chưa có tài khoản đăng nhập" },
      { status: 400 },
    );
  }

  const { error } = await admin.auth.admin.updateUserById(kid.child_user_id, {
    password,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
