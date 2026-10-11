import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeKidSettings,
  resolvePlacement,
  isValidDailyLimitMin,
  DAILY_LIMIT_MIN,
  DAILY_LIMIT_MAX,
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Deep-merge `patch` lên `base`: object lồng nhau được gộp đệ quy, mảng/giá trị
 * nguyên thuỷ do `patch` ghi đè. Dùng để PATCH cài đặt chỉ gửi một phần mà KHÔNG
 * xoá các trường còn lại của row hiện có.
 */
function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isRecord(base) || !isRecord(patch)) return patch;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(patch)) {
    out[key] = deepMerge(base[key], patch[key]);
  }
  return out;
}

// Client quản trị (service_role) dùng cho các truy vấn phía server cần vượt RLS.
type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Người dùng có phải CAREGIVER QUẢN LÝ (permission='admin') đã liên kết của hồ sơ
 * này không. Tra bảng `ekid_caregivers`: caregiver_user_id = userId, status='linked'
 * và permission='admin'. Trả false khi không có dòng nào thoả mãn (không có quyền
 * hoặc chỉ là viewer).
 */
async function isAdminCaregiver(
  admin: AdminClient,
  userId: string,
  kidId: string,
): Promise<boolean> {
  const { data: link } = await admin
    .from("ekid_caregivers")
    .select("id")
    .eq("kid_id", kidId)
    .eq("caregiver_user_id", userId)
    .eq("status", "linked")
    .eq("permission", "admin")
    .maybeSingle();
  return !!link;
}

// GET /api/ekid/kids/[kidId] — chi tiết một hồ sơ trẻ.
// Quyền: OWNER (user_id = auth.uid()) HOẶC caregiver đã liên kết → do RLS
// `ekid_kids` quyết định khi đọc bằng client phiên người dùng.
// Trả { kid, settings } với settings đã chuẩn hoá theo mặc định.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  if (!UUID_RE.test(kidId)) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { data: kid, error } = await supabase
    .from("ekid_kids")
    // Cột tường minh (khớp ConsoleKid) — với caregiver chỉ trả dữ liệu cần thiết,
    // KHÔNG lộ `child_user_id` hay các cột nội bộ không dùng cho UI giám sát.
    .select(
      "id, name, username, date_of_birth, avatar_emoji, favorite_voice, daily_limit_min, placement_age_band, placement_level, status, birth_time, gender, birth_place, user_id, settings",
    )
    .eq("id", kidId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!kid) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  const isOwner = kid.user_id === user.id;
  const admin = createAdminClient();
  const is_admin_caregiver = await isAdminCaregiver(admin, user.id, kidId);

  return NextResponse.json({
    kid,
    settings: normalizeKidSettings(kid.settings),
    // Additive: UI giám sát cần biết user có phải CHỦ hồ sơ để hiện/ẩn thao tác ghi
    // (PATCH/DELETE chỉ cho OWNER). Không phá vỡ API cũ — chỉ thêm trường.
    is_owner: isOwner,
    // (v2.4) UI cần biết admin caregiver (được sửa hồ sơ nhưng không đổi status) để
    // hiện/ẩn đúng các thao tác == không phá API cũ.
    is_admin_caregiver: is_admin_caregiver && !isOwner,
  });
}

// Kiểm tra OWNER của hồ sơ. Trả kid (kèm child_user_id) nếu user là chủ hồ sơ,
// ngược lại trả NextResponse lỗi (404 nếu không tồn tại, 403 nếu không phải chủ).
async function requireOwner(userId: string, kidId: string) {
  if (!UUID_RE.test(kidId)) {
    return { error: NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 }) };
  }
  const admin = createAdminClient();
  const { data: kid, error } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id, settings")
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

// Kiểm tra quyền SỬA hồ sơ (PATCH): OWNER HOẶC admin caregiver đã liên kết.
// Trả `kid` (kèm child_user_id/settings) + `isOwner` để phân biệt quyền đổi `status`
// (chỉ owner được phép). Viewer caregiver KHÔNG đủ điều kiện → 403.
async function requireCanEdit(userId: string, kidId: string) {
  if (!UUID_RE.test(kidId)) {
    return { error: NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 }) };
  }
  const admin = createAdminClient();
  const { data: kid, error } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id, settings")
    .eq("id", kidId)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!kid) return { error: NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 }) };

  const isOwner = kid.user_id === userId;
  if (!isOwner && !(await isAdminCaregiver(admin, userId, kidId))) {
    return {
      error: NextResponse.json(
        { error: "Không có quyền sửa hồ sơ này" },
        { status: 403 },
      ),
    };
  }
  return { admin, kid, isOwner };
}

// PATCH /api/ekid/kids/[kidId] — sửa hồ sơ + trạng thái + cài đặt. OWNER HOẶC
// admin caregiver; chỉ OWNER được đổi `status`.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const owned = await requireCanEdit(user.id, kidId);
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

  if (has("favorite_voice")) {
    const v = body.favorite_voice;
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "Giọng đọc không hợp lệ" }, { status: 400 });
    }
    patch.favorite_voice = v === null ? null : v.trim() || null;
  }

  if (has("daily_limit_min")) {
    const v = body.daily_limit_min;
    // (FIX C) Chỉ nhận số nguyên trong khoảng hợp lệ [MIN, MAX]. Giá trị 0 (chặn con
    // hoàn toàn) bị từ chối để tránh ba/mẹ đặt nhầm khiến con không học được.
    if (!isValidDailyLimitMin(v)) {
      return NextResponse.json(
        {
          error: `Giới hạn phút/ngày phải là số nguyên từ ${DAILY_LIMIT_MIN} đến ${DAILY_LIMIT_MAX}.`,
        },
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
    // (v2.4) Chỉ OWNER được đổi trạng thái (khoá/mở). Admin caregiver KHÔNG được
    // phép đổi `status` dù có quyền sửa hồ sơ/cài đặt.
    if (!owned.isOwner) {
      return NextResponse.json(
        { error: "Chỉ chủ hồ sơ được đổi trạng thái" },
        { status: 403 },
      );
    }
    const v = body.status;
    if (v !== "active" && v !== "khoa") {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }
    patch.status = v;
  }

  if (has("settings")) {
    // Gộp SÂU lên cài đặt HIỆN CÓ của hồ sơ (không chỉ merge mặc định) để patch
    // một phần không xoá các trường còn lại; sau đó chuẩn hoá an toàn.
    patch.settings = normalizeKidSettings(
      deepMerge(owned.kid.settings ?? {}, body.settings),
    );
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
    // (FIX e) Cột tường minh, giống GET — KHÔNG lộ `child_user_id` cho admin caregiver.
    .select(
      "id, name, username, date_of_birth, avatar_emoji, favorite_voice, daily_limit_min, placement_age_band, placement_level, status, birth_time, gender, birth_place, user_id, settings",
    )
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
