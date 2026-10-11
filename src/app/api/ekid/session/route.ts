import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { remainingMinutes, resolvePlacement } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// Kiểm tra quyền SỞ HỮU: chỉ trả hồ sơ trẻ nếu thuộc chính user đang đăng nhập
// (chống IDOR — caregiver KHÔNG ghi được). Dùng cho POST.
async function ownsKid(userId: string, kidId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id, daily_limit_min, date_of_birth")
    .eq("id", kidId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

// Quyền ĐỌC: chủ hồ sơ HOẶC con của hồ sơ (tài khoản của bé) HOẶC caregiver đã
// liên kết (status='linked'). Dùng cho GET.
async function readableKid(userId: string, kidId: string) {
  const admin = createAdminClient();
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, daily_limit_min, user_id, child_user_id")
    .eq("id", kidId)
    .maybeSingle();
  if (!kid) return null;
  // (I2) Chủ hồ sơ hoặc chính tài khoản con → đọc được phiên của bé.
  if (kid.user_id === userId || kid.child_user_id === userId) return kid;

  const { data: link } = await admin
    .from("ekid_caregivers")
    .select("id")
    .eq("kid_id", kidId)
    .eq("caregiver_user_id", userId)
    .eq("status", "linked")
    .maybeSingle();
  return link ? kid : null;
}

// Ngày hôm nay dạng YYYY-MM-DD (khoá ngày của bảng ekid_daily).
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Tính lại định vị ĐỘNG từ dữ liệu THẬT: điểm test đầu vào mới nhất + số phiên tốt gần đây.
async function recomputePlacement(kidId: string, dob: string) {
  const admin = createAdminClient();
  const [{ data: entry }, { data: recent }] = await Promise.all([
    admin
      .from("ekid_assessments")
      .select("kid_result")
      .eq("kid_id", kidId)
      .eq("step", "dau-vao")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("ekid_sessions")
      .select("score, started_at")
      .eq("kid_id", kidId)
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  const entryTestPct =
    (entry?.kid_result as { score_pct?: number | null } | null)?.score_pct ?? null;
  const recentGoodSessions = (recent ?? []).filter((s) => (s.score ?? 0) >= 70).length;

  return resolvePlacement({ dob, entryTestPct, recentGoodSessions });
}

// GET /api/ekid/session?kid_id=... — phiên gần đây + số phút còn lại hôm nay.
// Cho phép cả caregiver đã linked đọc (chỉ đọc).
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await readableKid(user.id, kidId);
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
// TÍNH LẠI định vị động (placement) từ dữ liệu thật rồi trả về phút đã dùng + còn lại.
// CHỈ chủ hồ sơ được ghi (caregiver KHÔNG ghi).
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

  // (I2) Định vị ĐỘNG: tính lại placement từ điểm test đầu vào mới nhất + kết quả các
  // phiên gần đây (5 phiên mới nhất, tốt = score >= 70), rồi cập nhật hồ sơ kid.
  const placement = await recomputePlacement(kid_id, kid.date_of_birth);
  const { error: updErr } = await admin
    .from("ekid_kids")
    .update({
      placement_age_band: placement.ageBand,
      placement_level: placement.level,
    })
    .eq("id", kid_id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    session: data,
    placement,
    minutes_used: newUsed,
    remaining: remainingMinutes(kid.daily_limit_min, newUsed),
  });
}
