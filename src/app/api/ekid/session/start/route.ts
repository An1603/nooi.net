import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isWithinAllowedHours,
  normalizeKidSettings,
  remainingMinutes,
  vnDayStart,
} from "@/lib/ekid/ekid-system";
import { writeKid } from "@/lib/ekid/access";

export const dynamic = "force-dynamic";

/**
 * POST /api/ekid/session/start  { kid_id, lesson_id }
 *
 * Mở phiên TRƯỚC khi bé bắt đầu nói, để mọi lượt gợi ý / trả lời đều có
 * `session_id` thật mà ghi log. Kết thúc phiên thì PATCH qua `/api/ekid/session`
 * (gửi kèm `session_id`) — không tạo thêm dòng, tránh đếm trùng số buổi/ngày.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { kid_id?: string; lesson_id?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  if (!body.kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await writeKid(user.id, body.kid_id);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const { data: full } = await admin
    .from("ekid_kids")
    .select("settings, daily_limit_min")
    .eq("id", body.kid_id)
    .maybeSingle();
  const settings = normalizeKidSettings(full?.settings);

  if (!isWithinAllowedHours(settings, new Date())) {
    const { allowedFrom, allowedTo } = settings.rules;
    return NextResponse.json(
      { error: `Ngoài khung giờ học cho phép (${allowedFrom}–${allowedTo}).` },
      { status: 403 },
    );
  }

  // Trần buổi/ngày đếm trên phiên ĐÃ MỞ trong ngày.
  const { count } = await admin
    .from("ekid_sessions")
    .select("id", { count: "exact", head: true })
    .eq("kid_id", body.kid_id)
    .gte("started_at", vnDayStart().toISOString());
  const maxLessons = settings.rules.maxLessonsPerDay;
  if ((count ?? 0) >= maxLessons) {
    return NextResponse.json(
      { error: `Hôm nay con đã học đủ ${maxLessons} buổi rồi. Mai mình học tiếp nhé!` },
      { status: 403 },
    );
  }

  // Trần phút/ngày — không mở phiên khi đã dùng hết.
  const { data: daily } = await admin
    .from("ekid_daily")
    .select("minutes_used")
    .eq("kid_id", body.kid_id)
    .eq("day", new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }))
    .maybeSingle();
  const left = remainingMinutes(full?.daily_limit_min ?? 20, daily?.minutes_used ?? 0);
  if (left <= 0) {
    return NextResponse.json({ error: "Hôm nay con đã học đủ thời gian rồi." }, { status: 403 });
  }

  const { data: session, error } = await admin
    .from("ekid_sessions")
    .insert({ kid_id: body.kid_id, lesson_id: body.lesson_id ?? null })
    .select("id, started_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ session_id: session.id, started_at: session.started_at, remaining: left });
}
