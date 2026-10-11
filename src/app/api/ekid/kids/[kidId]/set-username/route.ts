import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { childEmail, isValidUsername, normalizeUsername } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lấy user hiện tại từ phiên đăng nhập (client server cần await).
async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/*
 * POST /api/ekid/kids/[kidId]/set-username
 * — Đặt tên đăng nhập + mật khẩu cho con CHƯA có tài khoản (child_user_id IS NULL).
 *   Dùng cho hồ sơ tạo từ v1 (trước khi có username) để bổ sung tài khoản đăng nhập.
 *
 * Nhận { username, password }. CHỈ chủ hồ sơ (OWNER) được phép.
 * Tạo auth user với email nội bộ childEmail(username); nếu cập nhật row lỗi thì
 * xoá auth user vừa tạo (rollback) để tránh tài khoản mồ côi.
 *
 * Duy nhất tên đăng nhập được enforce SERVER-SIDE: pre-check + unique index
 * idx_ekid_kids_username(lower(username)) + bắt lỗi createUser 'already/exist' → 409.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  if (!UUID_RE.test(kidId)) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  }

  const body = (await req.json()) ?? {};
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json(
      { error: "Thiếu tên đăng nhập hoặc mật khẩu" },
      { status: 400 },
    );
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Mật khẩu phải có ít nhất 6 ký tự" },
      { status: 400 },
    );
  }

  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return NextResponse.json({ error: "Tên đăng nhập không hợp lệ" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Xác minh hồ sơ thuộc user hiện tại (chỉ OWNER) và lấy trạng thái child_user_id.
  const { data: kid, error: kidErr } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id")
    .eq("id", kidId)
    .maybeSingle();

  if (kidErr) return NextResponse.json({ error: kidErr.message }, { status: 500 });
  if (!kid) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  if (kid.user_id !== user.id) {
    return NextResponse.json(
      { error: "Chỉ chủ hồ sơ được phép thao tác" },
      { status: 403 },
    );
  }
  if (kid.child_user_id) {
    return NextResponse.json(
      { error: "Con đã có tài khoản đăng nhập" },
      { status: 409 },
    );
  }

  // Kiểm tra trùng tên đăng nhập (so khớp không phân biệt hoa/thường qua lower()).
  const { data: existing } = await admin
    .from("ekid_kids")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });
  }

  // Tạo tài khoản auth cho bé với email nội bộ.
  const created = await admin.auth.admin.createUser({
    email: childEmail(normalized),
    password,
    email_confirm: true,
  });
  if (created.error || !created.data?.user) {
    // Race: hai request cùng username vượt qua bước kiểm tra trùng → auth user đã tồn
    // tại (email nội bộ trùng). Trả 409 thay vì 500 để client xử lý như lỗi trùng tên.
    const msg = created.error?.message ?? "";
    if (/already|exist|registered|duplicate/i.test(msg)) {
      return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json(
      { error: created.error?.message ?? "Không tạo được tài khoản đăng nhập" },
      { status: 500 },
    );
  }
  const childUserId = created.data.user.id;

  const { data, error } = await admin
    .from("ekid_kids")
    .update({ username: normalized, child_user_id: childUserId })
    .eq("id", kidId)
    .eq("user_id", user.id)
    .is("child_user_id", null) // chống race: chỉ cập nhật khi vẫn chưa có tài khoản
    .select("*")
    .maybeSingle();

  // Không có dòng nào bị cập nhật (đã bị set ở nơi khác) hoặc lỗi ghi → rollback auth user.
  if (error || !data) {
    await admin.auth.admin.deleteUser(childUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      { error: "Con đã có tài khoản đăng nhập" },
      { status: 409 },
    );
  }

  return NextResponse.json({ kid: data });
}
