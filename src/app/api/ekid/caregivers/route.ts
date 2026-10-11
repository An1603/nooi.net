import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateLinkCode, normalizeLinkCode } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// Giá trị hợp lệ cho quan hệ (role) và quyền (permission) của người giám sát.
// Phải khớp CHECK constraint trong migration 20261011000021.
const CAREGIVER_ROLES = ["cha", "me", "ong", "ba", "nguoi-giam-ho"] as const;
const CAREGIVER_PERMISSIONS = ["admin", "viewer"] as const;
type CaregiverRole = (typeof CAREGIVER_ROLES)[number];
type CaregiverPermission = (typeof CAREGIVER_PERMISSIONS)[number];

// GET /api/ekid/caregivers
//   ?kid_id=<id>  → danh sách người giám sát của hồ sơ trẻ (chủ hồ sơ HOẶC người thân đã liên kết đọc)
//   (không tham số) → danh sách lời mời/liên kết GỬI ĐẾN chính user (caregiver_user_id = user)
// Không còn tham số `?q=` (tìm theo tên) — tránh rò rỉ danh tính người dùng.
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kidId = searchParams.get("kid_id");
  const admin = createAdminClient();

  // Không có kid_id → lời mời/liên kết gửi đến CHÍNH user.
  // Để người được mời thấy lời mời của mình và bấm Chấp nhận/Từ chối.
  if (!kidId) {
    const { data: mine } = await admin
      .from("ekid_caregivers")
      .select("*")
      .eq("caregiver_user_id", user.id)
      .order("created_at", { ascending: false });
    const rows = mine ?? [];
    const kidIds = Array.from(new Set(rows.map((r) => r.kid_id as string)));
    let nameById = new Map<string, string>();
    if (kidIds.length) {
      const { data: kids } = await admin.from("ekid_kids").select("id, name").in("id", kidIds);
      nameById = new Map((kids ?? []).map((k) => [k.id as string, k.name as string]));
    }
    const caregivers = rows.map((r) => ({ ...r, kid_name: nameById.get(r.kid_id as string) ?? null }));
    return NextResponse.json({ caregivers });
  }

  // Danh sách người thân của một hồ sơ: cho chủ hồ sơ HOẶC người thân đã 'linked' đọc.
  // Chống IDOR: hồ sơ trẻ phải thuộc chính user, hoặc user là caregiver đã liên kết.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, name, user_id")
    .eq("id", kidId)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  let allowed = kid.user_id === user.id;
  if (!allowed) {
    const { data: link } = await admin
      .from("ekid_caregivers")
      .select("id")
      .eq("kid_id", kidId)
      .eq("caregiver_user_id", user.id)
      .eq("status", "linked")
      .maybeSingle();
    allowed = !!link;
  }
  if (!allowed) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { data } = await admin
    .from("ekid_caregivers")
    .select("*")
    .eq("kid_id", kidId)
    .order("created_at", { ascending: false });
  const caregivers = (data ?? []).map((r) => ({ ...r, kid_name: kid.name }));
  return NextResponse.json({ caregivers });
}

// POST /api/ekid/caregivers — hai dạng body:
//   (a) { code } — NGƯỜI NHẬN nhập mã để tự liên kết.
//   (b) { kid_id, caregiver_user_id?, role } — CHỦ hồ sơ mời (hoặc tạo lời mời chờ bằng mã).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const admin = createAdminClient();

  // ── Dạng (a): người nhận nhập mã liên kết ──
  if (typeof body.code === "string" && body.code.trim()) {
    const code = normalizeLinkCode(body.code);

    // Chỉ nhận lời mời CHƯA có người nhận (caregiver_user_id IS NULL) và còn 'pending'.
    const { data: pend } = await admin
      .from("ekid_caregivers")
      .select("*")
      .eq("link_code", code)
      .eq("status", "pending")
      .is("caregiver_user_id", null)
      .limit(1);
    const target = (pend ?? [])[0];
    if (!target) {
      // Mã đã tồn tại nhưng đã có người nhận / đã dùng → 409; hoàn toàn không có → 404.
      const { data: any } = await admin
        .from("ekid_caregivers")
        .select("id")
        .eq("link_code", code)
        .limit(1);
      if ((any ?? []).length) {
        return NextResponse.json({ error: "Mã đã được sử dụng" }, { status: 409 });
      }
      return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 404 });
    }

    // Gán người nhận + chuyển 'linked'. Điều kiện .is(NULL)/.eq('pending') chống
    // ghi đè khi hai người cùng nhập mã (race) — chỉ người thắng mới update được.
    const { data, error } = await admin
      .from("ekid_caregivers")
      .update({ caregiver_user_id: user.id, status: "linked" })
      .eq("id", target.id)
      .eq("status", "pending")
      .is("caregiver_user_id", null)
      .select("*")
      .maybeSingle();
    if (error) {
      // 23505 = user đã có dòng cho bé này → coi như đã liên kết.
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "Bạn đã liên kết hồ sơ này rồi" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Mã đã được sử dụng" }, { status: 409 });
    }
    return NextResponse.json({ caregiver: data });
  }

  // ── Dạng (b): chủ hồ sơ mời người thân ──
  const { kid_id, caregiver_user_id, role } = body as {
    kid_id?: string;
    caregiver_user_id?: string | null;
    role?: string;
  };
  if (!kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  // Chống IDOR: hồ sơ trẻ phải thuộc chính user đang đăng nhập.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id")
    .eq("id", kid_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  // caregiver_user_id rỗng/không có → tạo LỜI MỜI CHỜ (NULL), giữ link_code để người nhận tự nhập.
  const invited =
    typeof caregiver_user_id === "string" && caregiver_user_id.trim()
      ? caregiver_user_id.trim()
      : null;

  // Validate role theo enum (gồm 'ong'/'ba' mới). role rỗng → mặc định 'nguoi-giam-ho'.
  const finalRole = role || "nguoi-giam-ho";
  if (!(CAREGIVER_ROLES as readonly string[]).includes(finalRole)) {
    return NextResponse.json({ error: "role không hợp lệ" }, { status: 400 });
  }

  // Chèn lời mời với RETRY chống va chạm link_code.
  // Partial unique index `idx_ekid_caregivers_linkcode_pending` ràng buộc
  // link_code của mọi dòng status='pending' → trùng mã sẽ vi phạm 23505.
  // Khi đó (và CHỈ khi đó) sinh mã mới rồi thử lại, tối đa 5 lần; hết lượt → 500.
  const MAX_LINK_CODE_ATTEMPTS = 5;
  let inserted: unknown = null;
  let lastError: { code?: string; message?: string; details?: string; hint?: string } | null = null;
  let retriesExhausted = false;

  for (let attempt = 1; attempt <= MAX_LINK_CODE_ATTEMPTS; attempt++) {
    const { data: row, error: insErr } = await admin
      .from("ekid_caregivers")
      .insert({
        kid_id,
        caregiver_user_id: invited,
        role: finalRole,
        status: "pending",
        link_code: generateLinkCode(),
      })
      .select("*")
      .single();
    if (!insErr) {
      inserted = row;
      lastError = null;
      break;
    }
    lastError = insErr;
    const err = insErr as { code?: string; message?: string; details?: string; hint?: string };
    // Chỉ retry khi va chạm UNIQUE (23505) TRÊN link_code; nếu 23505 là do ràng
    // buộc khác (vd trùng kid_id+caregiver_user_id) hoặc lỗi không phải 23505 thì
    // dừng ngay — sinh lại mã sẽ vô ích và làm mất thông điệp lỗi gốc.
    const onLinkCode = `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""}`.includes(
      "link_code"
    );
    if (err.code !== "23505" || !onLinkCode) {
      retriesExhausted = false;
      break;
    }
    if (attempt === MAX_LINK_CODE_ATTEMPTS) retriesExhausted = true;
  }

  if (inserted === null) {
    const message = retriesExhausted
      ? `Không sinh được mã liên kết duy nhất sau ${MAX_LINK_CODE_ATTEMPTS} lần thử, vui lòng thử lại`
      : lastError?.message ?? "Không tạo được lời mời";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ caregiver: inserted });
}

// PATCH /api/ekid/caregivers — hai nhánh, phân biệt theo body:
//   (a) { id, permission?, role? } — CHỦ hồ sơ (owner) đổi quyền/quan hệ của một liên kết.
//       permission ∈ ('admin'|'viewer'), role ∈ ('cha','me','ong','ba','nguoi-giam-ho').
//   (b) { id, status } — chấp nhận ('linked') / từ chối ('rejected') lời mời (luồng cũ, giữ nguyên).
// `id` nhận qua body (ưu tiên) hoặc query `?id=`.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const bodyId = typeof body.id === "string" ? body.id : "";
  const id = bodyId.trim() || new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const admin = createAdminClient();
  // Chống IDOR: tra bản ghi để lấy kid_id + caregiver_user_id trước khi update.
  const { data: cg } = await admin
    .from("ekid_caregivers")
    .select("id, kid_id, caregiver_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!cg) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const permission = body.permission as unknown;
  const role = body.role as unknown;
  const status = body.status as unknown;

  // ── Nhánh (a): đổi permission/role — chỉ OWNER (kid.user_id === user.id). ──
  if (permission !== undefined || role !== undefined) {
    if (
      permission !== undefined &&
      !(CAREGIVER_PERMISSIONS as readonly string[]).includes(permission as string)
    ) {
      return NextResponse.json({ error: "permission không hợp lệ" }, { status: 400 });
    }
    if (
      role !== undefined &&
      !(CAREGIVER_ROLES as readonly string[]).includes(role as string)
    ) {
      return NextResponse.json({ error: "role không hợp lệ" }, { status: 400 });
    }

    // Chỉ owner đổi quyền/quan hệ của người giám sát (admin caregiver KHÔNG được).
    const { data: kid } = await admin
      .from("ekid_kids")
      .select("id")
      .eq("id", cg.kid_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

    const patch: { permission?: CaregiverPermission; role?: CaregiverRole } = {};
    if (permission !== undefined) patch.permission = permission as CaregiverPermission;
    if (role !== undefined) patch.role = role as CaregiverRole;

    const { data, error } = await admin
      .from("ekid_caregivers")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ caregiver: data });
  }

  // ── Nhánh (b): accept/reject lời mời (luồng cũ, giữ nguyên). ──
  if (status !== "linked" && status !== "rejected") {
    return NextResponse.json({ error: "status không hợp lệ" }, { status: 400 });
  }
  const newStatus = status as "linked" | "rejected";

  // Quyền accept/reject: (a) người gọi là CHỦ hồ sơ trẻ (owner của kid_id),
  // HOẶC (b) người gọi chính là người được mời (caregiver_user_id) → tự accept/từ chối
  // lời mời của mình. Không cho phép người khác đổi trạng thái lời mời không phải của mình.
  let allowed = cg.caregiver_user_id === user.id;
  if (!allowed) {
    const { data: kid } = await admin
      .from("ekid_kids")
      .select("id")
      .eq("id", cg.kid_id)
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = !!kid;
  }
  if (!allowed) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { data, error } = await admin
    .from("ekid_caregivers")
    .update({ status: newStatus })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ caregiver: data });
}

// DELETE /api/ekid/caregivers?id=<id> — gỡ một liên kết/lời mời của hồ sơ trẻ.
// Chỉ CHỦ hồ sơ (owner của kid_id) được xoá; caregiver đã liên kết KHÔNG có quyền.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const admin = createAdminClient();
  // Chống IDOR: tra kid_id của liên kết trước, rồi xác nhận hồ sơ thuộc chính user.
  const { data: cg } = await admin
    .from("ekid_caregivers")
    .select("id, kid_id")
    .eq("id", id)
    .maybeSingle();
  if (!cg) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id")
    .eq("id", cg.kid_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { error } = await admin.from("ekid_caregivers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
