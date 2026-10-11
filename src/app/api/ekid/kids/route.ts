import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  childEmail,
  isValidUsername,
  normalizeUsername,
  resolvePlacement,
} from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// Lấy user hiện tại từ phiên đăng nhập (client server cần await).
async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Các trường người dùng được phép cập nhật qua PATCH (whitelist tường minh).
// Loại khỏi payload: `level`, `placement_age_band`, `placement_level` (server tự tính),
// cùng `user_id`, `id`, `created_at` — không cho client ghi đè.
const PATCH_ALLOWED_FIELDS = [
  "name",
  "date_of_birth",
  "avatar_emoji",
  "favorite_voice",
  "daily_limit_min",
] as const;

// GET /api/ekid/kids — hồ sơ trẻ mà user SỞ HỮU + hồ sơ user là caregiver đã liên kết.
// Mỗi kid kèm `has_entry_test` (đã làm test đầu vào chưa) và `is_owner` (có phải chủ hồ sơ).
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const admin = createAdminClient();

  // (I3) Con của chính user + con mà user là caregiver đã linked.
  const [{ data: owned, error: ownErr }, { data: links }] = await Promise.all([
    admin.from("ekid_kids").select("*").eq("user_id", user.id),
    admin
      .from("ekid_caregivers")
      .select("kid_id")
      .eq("caregiver_user_id", user.id)
      .eq("status", "linked"),
  ]);
  if (ownErr) return NextResponse.json({ error: ownErr.message }, { status: 500 });

  const ownedKids = owned ?? [];
  const ownedIds = new Set(ownedKids.map((k) => k.id));
  const caregiverKidIds = Array.from(
    new Set(
      (links ?? [])
        .map((l) => l.kid_id as string)
        .filter((id) => !ownedIds.has(id)),
    ),
  );

  let caregiverKids: typeof ownedKids = [];
  if (caregiverKidIds.length) {
    const { data } = await admin.from("ekid_kids").select("*").in("id", caregiverKidIds);
    caregiverKids = data ?? [];
  }

  const allKids = [...ownedKids, ...caregiverKids].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
  );

  // (I2) has_entry_test: kid đã có dòng assessment step='dau-vao' (đã định vị đầu vào).
  const kidIds = allKids.map((k) => k.id);
  let withTest = new Set<string>();
  if (kidIds.length) {
    const { data: asmt } = await admin
      .from("ekid_assessments")
      .select("kid_id")
      .eq("step", "dau-vao")
      .in("kid_id", kidIds);
    withTest = new Set((asmt ?? []).map((a) => a.kid_id as string));
  }

  const kids = allKids.map((k) => ({
    ...k,
    has_entry_test: withTest.has(k.id),
    is_owner: k.user_id === user.id,
  }));

  return NextResponse.json({ kids });
}

// POST /api/ekid/kids — tạo hồ sơ trẻ + tài khoản đăng nhập (auth user con).
// Nhận { name, date_of_birth, username, password, avatar_emoji? }.
// Tạo auth user với email nội bộ childEmail(username); nếu insert hồ sơ lỗi thì
// xoá auth user vừa tạo (rollback) để tránh tài khoản mồ côi.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const { name, date_of_birth, username, password, avatar_emoji, favorite_voice } =
    body as {
      name?: string;
      date_of_birth?: string;
      username?: string;
      password?: string;
      avatar_emoji?: string;
      favorite_voice?: string | null;
    };

  if (!name || !date_of_birth || !username || !password) {
    return NextResponse.json(
      { error: "Thiếu tên, ngày sinh, tên đăng nhập hoặc mật khẩu" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
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

  // Kiểm tra trùng tên đăng nhập (so khớp không phân biệt hoa/thường).
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

  const placement = resolvePlacement({ dob: date_of_birth });
  const { data, error } = await admin
    .from("ekid_kids")
    .insert({
      user_id: user.id,
      child_user_id: childUserId,
      username: normalized,
      name,
      date_of_birth,
      avatar_emoji: avatar_emoji || "🦊",
      favorite_voice: favorite_voice || null,
      placement_age_band: placement.ageBand,
      placement_level: placement.level,
    })
    .select("*")
    .single();

  if (error) {
    // Rollback: xoá auth user vừa tạo nếu không ghi được hồ sơ.
    await admin.auth.admin.deleteUser(childUserId);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ kid: data });
}

// PATCH /api/ekid/kids — cập nhật hồ sơ; tính lại định vị nếu đổi ngày sinh.
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  // Whitelist tường minh ở runtime: chỉ copy các key được phép từ body.
  // Không dùng spread toàn bộ body để tránh mass-assignment (level, placement_*, …).
  const patch: Record<string, unknown> = {};
  for (const key of PATCH_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      patch[key] = (body as Record<string, unknown>)[key];
    }
  }

  // Nếu đổi ngày sinh thì tính lại định vị (server tự quyết, không nhận từ client).
  if (patch.date_of_birth) {
    const p = resolvePlacement({ dob: patch.date_of_birth as string });
    patch.placement_age_band = p.ageBand;
    patch.placement_level = p.level;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_kids")
    .update(patch)
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
