import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveChildKidId } from "@/lib/ekid/child";
import { normalizeKidSettings, lockedLessonsByOrder } from "@/lib/ekid/ekid-system";

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
  settings: unknown;
  memory: string | null;
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
      "id, name, username, avatar_emoji, favorite_voice, placement_age_band, placement_level, daily_limit_min, user_id, child_user_id, settings, memory",
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

  // kid_id không bắt buộc: con đang đăng nhập thì server tự suy ra hồ sơ của bé.
  let kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) kidId = await resolveChildKidId(user.id);
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
      // KHÔNG select system_prompt — không đưa chỉ dẫn nội bộ ra client.
      // KHÔNG select answer_index bên trong exercises — chấm điểm chỉ ở server (quiz route).
      .select("id, age_band, title, part, core_topic, exercises, difficulty, status, video_url, sort_order")
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

  // (3.3) "Thi đạt mới sang bài": khi bật, mỗi bài bị KHOÁ nếu bài NGAY TRƯỚC (theo
  // thứ tự học: sort_order tăng, rồi difficulty) chưa đạt (best_score < 70 / chưa có).
  // `lessons` đã đúng thứ tự do query .order(sort_order).order(difficulty).
  const settings = normalizeKidSettings(kid.settings);
  const bestScoreByLesson = new Map<string, number | null>();
  for (const id of lessonIds) {
    bestScoreByLesson.set(id, progressMap.get(id)?.best_score ?? null);
  }
  const lockedIds = lockedLessonsByOrder(
    lessonIds,
    bestScoreByLesson,
    settings.rules.requirePassToAdvance,
  );

  // Ẩn đáp án phía client: chỉ giữ {question, options} — bỏ answer_index/type/image_url.
  const withProgress = lessons.map((l) => {
    const p = progressMap.get(l.id as string);
    const raw = Array.isArray(l.exercises)
      ? (l.exercises as { question?: unknown; options?: unknown }[])
      : [];
    const exercises = raw.map((e) => ({
      question: typeof e.question === "string" ? e.question : "",
      options: Array.isArray(e.options) ? (e.options as unknown[]).map((o) => String(o)) : [],
    }));
    return {
      ...l,
      exercises,
      locked: lockedIds.has(l.id as string),
      progress: {
        status: p?.status ?? "chua-hoc",
        best_score: p?.best_score ?? null,
        attempts: p?.attempts ?? 0,
      },
    };
  });

  // Không trả các trường nội bộ (user_id, child_user_id), và không lộ `settings`
  // (đã dùng nội bộ để tính `locked`; console quản lý có API riêng).
  const { user_id: _uid, child_user_id: _cuid, settings: _settings, ...safeKid } = kid;
  void _uid;
  void _cuid;
  void _settings;

  return NextResponse.json({ kid: safeKid, lessons: withProgress });
}
