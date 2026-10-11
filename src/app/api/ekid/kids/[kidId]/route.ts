import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeKidSettings,
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// GET /api/ekid/kids/[kidId] — chi tiết một hồ sơ trẻ.
// Quyền: OWNER (user_id = auth.uid()) HOẶC caregiver đã liên kết → do RLS
// `ekid_kids` quyết định khi đọc bằng client phiên người dùng.
// Trả { kid, settings } với settings đã chuẩn hoá theo mặc định.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { data: kid, error } = await supabase
    .from("ekid_kids")
    .select("*")
    .eq("id", kidId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!kid) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  return NextResponse.json({ kid, settings: normalizeKidSettings(kid.settings) });
}

// Kiểm tra OWNER của hồ sơ. Trả kid (kèm child_user_id) nếu user là chủ hồ sơ,
// ngược lại trả NextResponse lỗi (404 nếu không tồn tại, 403 nếu không phải chủ).
async function requireOwner(userId: string, kidId: string) {
  const admin = createAdminClient();
  const { data: kid, error } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id")
    .eq("id", kidId)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!kid) return { error: NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 }) };
  if (kid.user_id !== userId) {
    return {
      error: NextResponse.json(
        { error: "Chỉ chủ hồ sơ được phép thao tác" },
        { status: 403 },
      ),
    };
  }
  return { admin, kid };
}

// PATCH /api/ekid/kids/[kidId] — sửa hồ sơ + trạng thái + cài đặt. CHỈ OWNER.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const owned = await requireOwner(user.id, kidId);
  if ("error" in owned) return owned.error;

  const body = ((await req.json()) ?? {}) as Record<string, unknown>;

  // Whitelist tường minh ở runtime: chỉ copy các key được phép từ body.
  const patch: Record<string, unknown> = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  if (has("name")) {
    const v = body.name;
    if (typeof v !== "string" || v.trim() === "") {
      return NextResponse.json({ error: "Tên không hợp lệ" }, { status: 400 });
    }
    patch.name = v.trim();
  }

  if (has("date_of_birth")) {
    const v = body.date_of_birth;
    if (typeof v !== "string" || !DATE_RE.test(v)) {
      return NextResponse.json(
        { error: "Ngày sinh không hợp lệ (định dạng YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    patch.date_of_birth = v;
  }

  if (has("avatar_emoji")) {
    const v = body.avatar_emoji;
    if (typeof v !== "string" || v.trim() === "") {
      return NextResponse.json({ error: "Biểu tượng không hợp lệ" }, { status: 400 });
    }
    patch.avatar_emoji = v.trim();
  }

  if (has("daily_limit_min")) {
    const v = body.daily_limit_min;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
      return NextResponse.json(
        { error: "Giới hạn phút/ngày không hợp lệ" },
        { status: 400 },
      );
    }
    patch.daily_limit_min = v;
  }

  if (has("birth_time")) {
    const v = body.birth_time;
    if (v !== null && (typeof v !== "string" || !TIME_RE.test(v))) {
      return NextResponse.json(
        { error: "Giờ sinh không hợp lệ (định dạng HH:MM)" },
        { status: 400 },
      );
    }
    patch.birth_time = v;
  }

  if (has("gender")) {
    const v = body.gender;
    if (v !== null && v !== "nam" && v !== "nu") {
      return NextResponse.json(
        { error: "Giới tính không hợp lệ" },
        { status: 400 },
      );
    }
    patch.gender = v;
  }

  if (has("birth_place")) {
    const v = body.birth_place;
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "Nơi sinh không hợp lệ" }, { status: 400 });
    }
    patch.birth_place = v === null ? null : v.trim() || null;
  }

  if (has("status")) {
    const v = body.status;
    if (v !== "active" && v !== "khoa") {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }
    patch.status = v;
  }

  if (has("settings")) {
    // Chuẩn hoá an toàn (merge mặc định) trước khi lưu.
    patch.settings = normalizeKidSettings(body.settings);
  }

  // Nếu đổi ngày sinh thì tính lại định vị (server tự quyết, không nhận từ client).
  if (typeof patch.date_of_birth === "string") {
    const p = resolvePlacement({ dob: patch.date_of_birth });
    patch.placement_age_band = p.ageBand;
    patch.placement_level = p.level;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Không có trường nào để cập nhật" }, { status: 400 });
  }

  const { data, error } = await owned.admin
    .from("ekid_kids")
    .update(patch)
    .eq("id", kidId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kid: data });
}

// DELETE /api/ekid/kids/[kidId] — xoá hồ sơ trẻ. CHỈ OWNER.
// Xoá auth user của con (nếu có) rồi xoá row ekid_kids (cascade progress/rewards/…).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const owned = await requireOwner(user.id, kidId);
  if ("error" in owned) return owned.error;

  // Xoá tài khoản đăng nhập của con trước (nếu có) để tránh tài khoản mồ côi.
  const childUserId = owned.kid.child_user_id as string | null;
  if (childUserId) {
    const del = await owned.admin.auth.admin.deleteUser(childUserId);
    if (del.error && !/not found|does not exist/i.test(del.error.message)) {
      return NextResponse.json({ error: del.error.message }, { status: 500 });
    }
  }

  const { error } = await owned.admin.from("ekid_kids").delete().eq("id", kidId).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
