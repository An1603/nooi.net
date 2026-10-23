import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { remainingMinutes, resolvePlacement, normalizeKidSettings, isWithinAllowedHours, vnDayString, vnDayStart } from "@/lib/ekid/ekid-system";
import { MEMORY_CAPS, isRecord, memoryRateLimitOk, normalizeTurns, summarizeAndUpdateMemory } from "@/lib/ekid/kid-memory";

export const dynamic = "force-dynamic";

// Kiểm tra quyền GHI: chủ hồ sơ (cha/mẹ) HOẶC chính TÀI KHOẢN CON của hồ sơ đó.
// (I-C1) Con đăng nhập và ghi phiên của CHÍNH mình — để ekid_daily cộng phút và
// áp hạn mức ngày (spec §8). Caregiver KHÔNG ghi được (chống IDOR).
async function writableKid(userId: string, kidId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id, name, memory, daily_limit_min, date_of_birth, user_id, child_user_id, settings")
    .eq("id", kidId)
    .maybeSingle();
  if (!data) return null;
  if (data.user_id === userId || data.child_user_id === userId) return data;
  return null;
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

// Ngày hôm nay dạng YYYY-MM-DD theo GIỜ VIỆT NAM (khoá ngày bảng ekid_daily).
// Dùng thống nhất với khung giờ học (isWithinAllowedHours) — tránh lệch mốc ngày.
function todayStr() {
  return vnDayString();
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
// Cho phép chủ hồ sơ HOẶC chính tài khoản con ghi (caregiver KHÔNG ghi).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  // (X3) Guard kích thước body (giống endpoint memory): header Content-Length HOẶC độ dài thực
  //      đọc được > 256 KB → 413, tránh parse body khổng lồ tốn RAM/CPU.
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MEMORY_CAPS.maxBodyBytes) {
    return NextResponse.json({ error: "Dữ liệu gửi lên quá lớn" }, { status: 413 });
  }
  const rawText = await req.text().catch(() => "");
  if (rawText.length > MEMORY_CAPS.maxBodyBytes) {
    return NextResponse.json({ error: "Dữ liệu gửi lên quá lớn" }, { status: 413 });
  }
  let body: Record<string, unknown> = {};
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (isRecord(parsed)) body = parsed;
    } catch {
      body = {};
    }
  }
  const { kid_id, lesson_id, transcript, exercises_done, duration_min, ai_notes, session_id } = body as {
    kid_id?: string;
    lesson_id?: string | null;
    transcript?: unknown;
    exercises_done?: unknown;
    duration_min?: number;
    ai_notes?: string | null;
    /** Phiên đã mở qua /api/ekid/session/start — có thì CẬP NHẬT, không tạo dòng mới. */
    session_id?: string | null;
  };
  if (!kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await writableKid(user.id, kid_id);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();

  // (3.2) Thực thi NGUYÊN TẮC học tập của ba/mẹ (server-side).
  const settings = normalizeKidSettings(kid.settings);

  // (a) Khung giờ cho phép học — ngoài khung → chặn.
  if (!isWithinAllowedHours(settings, new Date())) {
    const { allowedFrom, allowedTo } = settings.rules;
    return NextResponse.json(
      {
        error: `Ngoài khung giờ học cho phép (${allowedFrom}–${allowedTo}). Con quay lại đúng giờ ba mẹ đặt nhé!`,
      },
      { status: 403 },
    );
  }

  // (b) Số buổi học tối đa trong ngày — đếm số phiên đã tạo hôm nay (mốc 00:00 GIỜ VN,
  //     khớp khoá ngày của ekid_daily/todayStr). Đã đủ → chặn mở buổi mới.
  const maxLessons = settings.rules.maxLessonsPerDay;
  // (M1) Đóng một phiên ĐÃ MỞ (có session_id) không tính là mở buổi mới — nếu kiểm
  // trần ở đây thì chính phiên vừa mở sẽ làm chính nó bị chặn lúc kết thúc.
  const continuingSession = typeof session_id === "string" && session_id.length > 0;
  const { count: todayCount } = continuingSession
    ? { count: 0 }
    : await admin
        .from("ekid_sessions")
        .select("id", { count: "exact", head: true })
        .eq("kid_id", kid_id)
        .gte("started_at", vnDayStart().toISOString());
  if (!continuingSession && (todayCount ?? 0) >= maxLessons) {
    return NextResponse.json(
      {
        error: `Hôm nay con đã học đủ ${maxLessons} buổi rồi. Nghỉ ngơi một chút, mai mình học tiếp nhé!`,
      },
      { status: 403 },
    );
  }

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

  // (F1) Cap số lượt + tổng ký tự hội thoại (cắt) TRƯỚC khi lưu DB.
  const cleanTurns = normalizeTurns(transcript);

  // Điểm = tỉ lệ bài tập đúng trên tổng số bài đã làm (null nếu không có bài).
  // (F1) Cap số lượng bài tập lưu để tránh phình DB.
  const doneRaw = Array.isArray(exercises_done) ? exercises_done : [];
  const done = doneRaw.slice(0, MEMORY_CAPS.maxExercises);
  const correct = done.filter((d: { correct?: boolean }) => d?.correct).length;
  const score = done.length ? Math.round((correct / done.length) * 100) : null;

  // (M1) Phiên mở trước (có session_id) → cập nhật; nếu id không hợp lệ/rơi vào phiên
  // khác/đã đóng thì rơi về tạo mới (không mất dữ liệu buổi học).
  let openedSessionId: string | null = typeof session_id === "string" ? session_id : null;
  if (openedSessionId) {
    const { data: opened } = await admin
      .from("ekid_sessions")
      .select("id, kid_id, ended_at")
      .eq("id", openedSessionId)
      .maybeSingle();
    if (!opened || opened.kid_id !== kid_id || opened.ended_at) openedSessionId = null;
  }

  const payload = {
    kid_id,
    lesson_id: lesson_id ?? null,
    ended_at: new Date().toISOString(),
    duration_min: dur,
    transcript: cleanTurns,
    exercises_done: done,
    score,
    ai_notes: ai_notes ?? null,
  };

  const { data, error } = openedSessionId
    ? await admin.from("ekid_sessions").update(payload).eq("id", openedSessionId).select("*").single()
    : await admin.from("ekid_sessions").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // (I-C1) Khi con vừa học xong một bài có lesson_id: đánh dấu tiến độ 'da-hoc'
  // — nhưng KHÔNG hạ cấp bài đã 'da-thi' xuống.
  if (lesson_id) {
    const { data: prog } = await admin
      .from("ekid_progress")
      .select("status")
      .eq("kid_id", kid_id)
      .eq("lesson_id", lesson_id)
      .maybeSingle();
    if (!prog || prog.status === "chua-hoc") {
      await admin
        .from("ekid_progress")
        .upsert(
          { kid_id, lesson_id, status: "da-hoc" },
          { onConflict: "kid_id,lesson_id" },
        );
    }
  }

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

  // (F3 + X2) Buổi học CÓ BÀI cũng cập nhật bộ nhớ: khi có hội thoại, biên tập memory về bé
  // qua helper DÙNG CHUNG với endpoint memory. BEST-EFFORT + FIRE-AND-FORGET: chạy NỀN SAU
  // khi đã cập nhật placement và dựng xong response — KHÔNG await nên KHÔNG tăng độ trễ trả về,
  // và response KHÔNG phụ thuộc kết quả helper. Chỉ chạy khi còn hạn mức mềm (tránh đốt token Gemini).
  if (cleanTurns.length > 0 && memoryRateLimitOk(user.id)) {
    void summarizeAndUpdateMemory(kid_id, cleanTurns, {
      sessionId: data.id,
      kidName: kid.name,
      currentMemory: kid.memory,
    }).catch(() => {
      // helper đã tự nuốt lỗi; đây chỉ là chốt an toàn để không tạo unhandled rejection.
    });
  }

  return NextResponse.json({
    ok: true,
    session: data,
    placement,
    minutes_used: newUsed,
    remaining: remainingMinutes(kid.daily_limit_min, newUsed),
  });
}
