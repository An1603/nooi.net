import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownerKid, readKid } from "@/lib/ekid/access";

export const dynamic = "force-dynamic";

/**
 * Phần thưởng do BỐ MẸ đặt, không phải phần thưởng ngẫu nhiên của app.
 * Mở khoá theo level; việc trao thưởng là của bố mẹ (status='given').
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
    .from("ekid_rewards")
    .select("id, label, level_required, status, created_at")
    .eq("kid_id", kidId)
    .not("level_required", "is", null)
    .order("level_required", { ascending: true });

  return NextResponse.json({ rewards: data ?? [], level: kid.placement_level ?? 1 });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { kid_id?: string; label?: string; level_required?: number; status?: string; reward_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  if (!body.kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });
  const kid = await ownerKid(user.id, body.kid_id);
  if (!kid) return NextResponse.json({ error: "Chỉ phụ huynh sở hồ sơ được đặt thưởng" }, { status: 403 });

  const admin = createAdminClient();

  // Đánh dấu đã trao thưởng
  if (body.reward_id) {
    const { data, error } = await admin
      .from("ekid_rewards")
      .update({ status: "given" })
      .eq("id", body.reward_id)
      .eq("kid_id", body.kid_id)
      .select("id, label, level_required, status")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reward: data });
  }

  const label = body.label?.trim();
  if (!label) return NextResponse.json({ error: "Thiếu tên phần thưởng" }, { status: 400 });

  const level = Math.min(Math.max(Math.trunc(body.level_required ?? (kid.placement_level ?? 1) + 1), 1), 99);
  const { data, error } = await admin
    .from("ekid_rewards")
    .insert({
      kid_id: body.kid_id,
      kind: "huy-hieu",
      label: label.slice(0, 120),
      points: 0,
      reason: "Phần thưởng do bố mẹ đặt",
      level_required: level,
      status: "locked",
      created_by: user.id,
    })
    .select("id, label, level_required, status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reward: data });
}
