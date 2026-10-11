import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveChildKidId } from "@/lib/ekid/child";

export const dynamic = "force-dynamic";

interface RewardRow {
  id: string;
  kind: string;
  code: string | null;
  label: string;
  points: number;
  reason: string | null;
  created_at: string;
}

// Quyền ĐỌC: chủ hồ sơ | caregiver đã liên kết | chính là con (tài khoản của bé).
async function canRead(userId: string, kidId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id")
    .eq("id", kidId)
    .maybeSingle();
  if (!kid) return false;
  if (kid.user_id === userId || kid.child_user_id === userId) return true;

  const { data: link } = await admin
    .from("ekid_caregivers")
    .select("id")
    .eq("kid_id", kidId)
    .eq("caregiver_user_id", userId)
    .eq("status", "linked")
    .maybeSingle();
  return !!link;
}

// GET /api/ekid/rewards?kid_id= — tổng điểm, danh sách huy hiệu, và các thưởng gần đây.
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  // kid_id không bắt buộc: con đang đăng nhập thì server tự suy ra hồ sơ của bé.
  let kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) kidId = await resolveChildKidId(user.id);
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const ok = await canRead(user.id, kidId);
  if (!ok) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const { data: rewards } = await admin
    .from("ekid_rewards")
    .select("id, kind, code, label, points, reason, created_at")
    .eq("kid_id", kidId)
    .order("created_at", { ascending: false });

  const rows = (rewards ?? []) as RewardRow[];
  const totalPoints = rows.reduce(
    (sum, r) => sum + (r.kind === "diem" ? r.points : 0),
    0,
  );

  // Huy hiệu: gộp theo code (giữ lần nhận sớm nhất), sắp theo thời gian nhận.
  const badgeMap = new Map<string, { code: string; label: string; earned_at: string }>();
  for (const r of rows) {
    if (r.kind !== "huy-hieu" || !r.code) continue;
    if (!badgeMap.has(r.code)) {
      badgeMap.set(r.code, { code: r.code, label: r.label, earned_at: r.created_at });
    }
  }
  const badges = Array.from(badgeMap.values()).sort((a, b) =>
    a.earned_at < b.earned_at ? -1 : a.earned_at > b.earned_at ? 1 : 0,
  );

  return NextResponse.json({
    total_points: totalPoints,
    badges,
    recent: rows.slice(0, 20),
  });
}
