import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownerKid, readKid } from "@/lib/ekid/access";

export const dynamic = "force-dynamic";

const DOC_VERSION = "consent-v1";

/**
 * Đồng thuận hai tầng (Luật 91/2025/QH15 + NĐ 356/2025).
 * - Tầng 1: cha/mẹ/người giám hộ (chủ hồ sơ) đồng ý ở cấp tài khoản.
 * - Tầng 2: chính bé (từ đủ 7 tuổi — lớp 3 là 8–9 tuổi) xác nhận trước khi bật chia sẻ.
 *
 * Không có đủ hai tầng thì MỌI tính năng chia sẻ/so sánh/xếp hạng phải tắt.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });
  const kid = await readKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_consents")
    .select("doc_version, guardian_ok_at, child_ok_at, withdrawn_at, scopes")
    .eq("kid_id", kidId)
    .eq("doc_version", DOC_VERSION)
    .maybeSingle();

  const guardianOk = Boolean(data?.guardian_ok_at) && !data?.withdrawn_at;
  const childOk = Boolean(data?.child_ok_at) && !data?.withdrawn_at;

  return NextResponse.json({
    doc_version: DOC_VERSION,
    guardian_ok: guardianOk,
    child_ok: childOk,
    sharing_allowed: guardianOk && childOk,
  });
}

/** POST { kid_id, role: "guardian"|"child", withdraw?: boolean } */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { kid_id?: string; role?: "guardian" | "child"; withdraw?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  if (!body.kid_id || (body.role !== "guardian" && body.role !== "child")) {
    return NextResponse.json({ error: "Thiếu kid_id hoặc role" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Bé chỉ được xác nhận/ rút lại cho CHÍNH mình; phụ huynh phải là chủ hồ sơ.
  if (body.role === "child") {
    const { data: kidRow } = await admin
      .from("ekid_kids")
      .select("id, child_user_id")
      .eq("id", body.kid_id)
      .maybeSingle();
    if (!kidRow || kidRow.child_user_id !== user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
  } else {
    const kid = await ownerKid(user.id, body.kid_id);
    if (!kid) return NextResponse.json({ error: "Chỉ phụ huynh sở hồ sơ được đồng ý" }, { status: 403 });
  }

  // Tầng 2 chỉ có hiệu lực khi tầng 1 đã có.
  const { data: existing } = await admin
    .from("ekid_consents")
    .select("id, guardian_ok_at, child_ok_at")
    .eq("kid_id", body.kid_id)
    .eq("doc_version", DOC_VERSION)
    .maybeSingle();

  if (body.role === "child" && !existing?.guardian_ok_at) {
    return NextResponse.json({ error: "Phụ huynh cần đồng ý trước" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const patch =
    body.role === "guardian"
      ? { guardian_ok_at: body.withdraw ? null : now, withdrawn_at: body.withdraw ? now : null }
      : { child_ok_at: body.withdraw ? null : now };

  if (existing) {
    const { error } = await admin.from("ekid_consents").update(patch).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin.from("ekid_consents").insert({
      kid_id: body.kid_id,
      guardian_id: user.id,
      doc_version: DOC_VERSION,
      guardian_ok_at: body.role === "guardian" && !body.withdraw ? now : null,
      child_ok_at: null,
      scopes: ["hoc_tap"],
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role: body.role, withdrawn: Boolean(body.withdraw) });
}
