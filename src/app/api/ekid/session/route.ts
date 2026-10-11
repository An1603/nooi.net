import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { remainingMinutes } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// Kiểm tra quyền sở hữu: chỉ trả hồ sơ trẻ nếu thuộc chính user đang đăng nhập
// (chống IDOR — user không thao tác được con của người khác).
async function ownsKid(userId: string, kidId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id, daily_limit_min")
    .eq("id", kidId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

// Ngày hôm nay dạng YYYY-MM-DD (khoá ngày của bảng ekid_daily).
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// GET /api/ekid/session?kid_id=... — phiên gần đây + số phút còn lại hôm nay.
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await ownsKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const [{ data: sessions }, { data: daily }] = await Promise.all([
    admin
      .from("ekid_sessions")
      .select("*")
      .eq("kid_id", kidId)
      .order("started_at", { ascending: false })
      .limit(20),
    admin
      .from("ekid_daily")
      .select("minutes_used")
      .eq("kid_id", kidId)
      .eq("day", todayStr())
      .maybeSingle(),
  ]);

  const used = daily?.minutes_used ?? 0;
  return NextResponse.json({
    sessions: sessions ?? [],
    minutes_used: used,
    remaining: remainingMinutes(kid.daily_limit_min, used),
  });
}

// POST /api/ekid/session — lưu phiên học, cộng dồn số phút đã dùng trong ngày,
// trả về số phút đã dùng + số phút còn lại (đối chiếu giới hạn phút/ngày).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const { kid_id, lesson_id, transcript, exercises_done, duration_min, ai_notes } = body as {
    kid_id?: string;
    lesson_id?: string | null;
    transcript?: unknown;
    exercises_done?: unknown;
    duration_min?: number;
    ai_notes?: string | null;
  };
  if (!kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await ownsKid(user.id, kid_id);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const dur = Math.max(0, Math.round(duration_min ?? 0));

  // Cộng dồn số phút đã dùng trong ngày (upsert theo khoá (kid_id, day)).
  const day = todayStr();
  const { data: existing } = await admin
    .from("ekid_daily")
    .select("minutes_used")
    .eq("kid_id", kid_id)
    .eq("day", day)
    .maybeSingle();
  const newUsed = (existing?.minutes_used ?? 0) + dur;
  await admin
    .from("ekid_daily")
    .upsert({ kid_id, day, minutes_used: newUsed }, { onConflict: "kid_id,day" });

  // Điểm = tỉ lệ bài tập đúng trên tổng số bài đã làm (null nếu không có bài).
  const done = Array.isArray(exercises_done) ? exercises_done : [];
  const correct = done.filter((d: { correct?: boolean }) => d?.correct).length;
  const score = done.length ? Math.round((correct / done.length) * 100) : null;

  const { data, error } = await admin
    .from("ekid_sessions")
    .insert({
      kid_id,
      lesson_id: lesson_id ?? null,
      ended_at: new Date().toISOString(),
      duration_min: dur,
      transcript: transcript ?? [],
      exercises_done: done,
      score,
      ai_notes: ai_notes ?? null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    session: data,
    minutes_used: newUsed,
    remaining: remainingMinutes(kid.daily_limit_min, newUsed),
  });
}
