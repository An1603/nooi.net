import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveChildKidId } from "@/lib/ekid/child";
import { readKid } from "@/lib/ekid/access";
import { getOrCreateTodayPlan } from "@/lib/ekid/plan-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/ekid/plan/today?kid_id=...
 * Trả lịch học hôm nay của bé (ôn cũ trước, tối đa 1 bài mới). Sinh và ghi nếu chưa có.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const url = new URL(req.url);
  const requested = url.searchParams.get("kid_id");
  const kidId = requested || (await resolveChildKidId(user.id));
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await readKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  try {
    const plan = await getOrCreateTodayPlan(kidId);
    return NextResponse.json({ kid: { id: kid.id, name: kid.name, level: kid.placement_level ?? 1 }, plan });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi tạo lịch" }, { status: 500 });
  }
}
