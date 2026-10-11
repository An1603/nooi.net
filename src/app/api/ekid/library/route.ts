import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface KidRow {
  id: string;
  name: string;
  username: string | null;
  avatar_emoji: string;
  favorite_voice: string | null;
  placement_age_band: string | null;
  placement_level: number | null;
  daily_limit_min: number;
  user_id: string;
  child_user_id: string | null;
}

interface ProgressRow {
  lesson_id: string;
  status: string;
  best_score: number | null;
  attempts: number;
}

// Quyền ĐỌC: chủ hồ sơ | caregiver đã liên kết | chính là con (tài khoản của bé).
async function accessibleKid(userId: string, kidId: string): Promise<KidRow | null> {
  const admin = createAdminClient();
  const { data: kid } = await admin
    .from("ekid_kids")
    .select(
      "id, name, username, avatar_emoji, favorite_voice, placement_age_band, placement_level, daily_limit_min, user_id, child_user_id",
    )
    .eq("id", kidId)
    .maybeSingle();
  if (!kid) return null;
  if (kid.user_id === userId || kid.child_user_id === userId) return kid as KidRow;

  const { data: link } = await admin
    .from("ekid_caregivers")
    .select("id")
    .eq("kid_id", kidId)
    .eq("caregiver_user_id", userId)
    .eq("status", "linked")
    .maybeSingle();
  return link ? (kid as KidRow) : null;
}

// GET /api/ekid/library?kid_id= — thư viện bài học đúng band của bé, kèm tiến độ từng bài.
// Order: sort_order tăng dần, rồi difficulty tăng dần.
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await accessibleKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const band = kid.placement_age_band;
  const admin = createAdminClient();

  // Bài học đúng nhóm tuổi của bé, chỉ lấy bài đang active.
  let lessons: Record<string, unknown>[] = [];
  if (band) {
    const { data, error } = await admin
      .from("ekid_lessons")
      .select("*")
      .eq("status", "active")
      .eq("age_band", band)
      .order("sort_order", { ascending: true })
      .order("difficulty", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    lessons = data ?? [];
  }

  // Tiến độ của bé trên các bài vừa lấy.
  const lessonIds = lessons.map((l) => l.id as string);
  const progressMap = new Map<string, ProgressRow>();
  if (lessonIds.length) {
    const { data: prog } = await admin
      .from("ekid_progress")
      .select("lesson_id, status, best_score, attempts")
      .eq("kid_id", kidId)
      .in("lesson_id", lessonIds);
    for (const p of (prog ?? []) as ProgressRow[]) progressMap.set(p.lesson_id, p);
  }

  const withProgress = lessons.map((l) => {
    const p = progressMap.get(l.id as string);
    return {
      ...l,
      progress: {
        status: p?.status ?? "chua-hoc",
        best_score: p?.best_score ?? null,
        attempts: p?.attempts ?? 0,
      },
    };
  });

  // Không trả các trường nội bộ (user_id, child_user_id).
  const { user_id: _uid, child_user_id: _cuid, ...safeKid } = kid;
  void _uid;
  void _cuid;

  return NextResponse.json({ kid: safeKid, lessons: withProgress });
}
