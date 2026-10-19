import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Các cột trả về client — CỐ Ý không có `system_prompt` (chỉ dẫn nội bộ của AI,
// không được lộ ra ngoài). `exercises` giữ NGUYÊN (kèm answer_index) vì phiên
// luyện giọng nói (EkidVoiceSession/ExerciseCard) chấm điểm phía client và dựng
// chỉ dẫn giọng nói từ đáp án. Bài THI đã tách riêng (chấm ở server: /api/ekid/quiz).
const LESSON_COLUMNS =
  "id, age_band, title, part, subject, core_topic, exercises, difficulty, status, video_url, sort_order";

/**
 * GET /api/ekid/lessons — bài học eKid đang ở trạng thái active.
 * Query tuỳ chọn: ?band=mam-non|tieu-hoc|thieu-nien để lọc theo nhóm tuổi.
 * Yêu cầu đăng nhập (không còn công khai).
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const band = searchParams.get("band");

  const admin = createAdminClient();

  let query = admin
    .from("ekid_lessons")
    .select(LESSON_COLUMNS)
    .eq("status", "active")
    .order("difficulty", { ascending: true });

  if (band) {
    query = query.eq("age_band", band);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lessons: data ?? [] });
}
