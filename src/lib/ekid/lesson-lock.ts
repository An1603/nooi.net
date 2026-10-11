import { createAdminClient } from "@/lib/supabase/admin";
import { lockedLessonsByOrder } from "./ekid-system";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Tập hợp `lesson_id` bị KHOÁ theo nguyên tắc "thi đạt mới sang bài" cho một hồ sơ.
 *
 * Dùng CHUNG thứ tự học với thư viện (`/api/ekid/library`): sort_order tăng, rồi
 * difficulty — để cờ `locked` mà thư viện hiển thị khớp với kiểm tra ở server.
 * Khi nguyên tắc tắt hoặc bé chưa được định vị lứa → trả Set rỗng (không khoá bài nào).
 */
export async function computeLockedLessonIds(
  admin: AdminClient,
  kidId: string,
  band: string | null,
  requirePassToAdvance: boolean,
): Promise<Set<string>> {
  if (!requirePassToAdvance || !band) return new Set();

  const { data: lessons } = await admin
    .from("ekid_lessons")
    .select("id")
    .eq("status", "active")
    .eq("age_band", band)
    .order("sort_order", { ascending: true })
    .order("difficulty", { ascending: true });
  const ids = (lessons ?? []).map((l) => l.id as string);
  if (ids.length === 0) return new Set();

  const { data: prog } = await admin
    .from("ekid_progress")
    .select("lesson_id, best_score")
    .eq("kid_id", kidId)
    .in("lesson_id", ids);

  const bestScoreByLesson = new Map<string, number | null>();
  for (const id of ids) bestScoreByLesson.set(id, null);
  for (const p of prog ?? []) {
    bestScoreByLesson.set(p.lesson_id as string, (p.best_score as number | null) ?? null);
  }

  return lockedLessonsByOrder(ids, bestScoreByLesson, true);
}
