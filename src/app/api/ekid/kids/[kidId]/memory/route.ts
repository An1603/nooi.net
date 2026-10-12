import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { vnDayString } from "@/lib/ekid/ekid-system";
import {
  MEMORY_CAPS,
  isRecord,
  memoryRateLimitOk,
  normalizeTurns,
  summarizeAndUpdateMemory,
} from "@/lib/ekid/kid-memory";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Hồ sơ bé tối thiểu cần cho phân quyền + ngữ cảnh biên tập bộ nhớ.
interface KidRow {
  id: string;
  name: string;
  user_id: string | null;
  child_user_id: string | null;
  memory: string | null;
}

// Quyền GHI: CHỦ hồ sơ (cha/mẹ) HOẶC chính TÀI KHOẢN CON của hồ sơ đó.
// Caregiver (dù admin) KHÔNG ghi bộ nhớ — bộ nhớ chỉ sinh từ chính buổi học của bé.
async function writableKid(userId: string, kidId: string): Promise<KidRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id, name, user_id, child_user_id, memory")
    .eq("id", kidId)
    .maybeSingle();
  if (!data) return null;
  const kid = data as KidRow;
  if (kid.user_id === userId || kid.child_user_id === userId) return kid;
  return null;
}

/**
 * POST /api/ekid/kids/[kidId]/memory
 * Lưu một buổi trò chuyện và biên tập nó thành bộ nhớ về bé.
 * Quyền: CHỦ hồ sơ HOẶC chính tài khoản con (caregiver → 403).
 * Body: { turns: {role:"user"|"ai", text}[], duration_min?, lesson_id?, exercises_done? }
 * LUÔN best-effort: lỗi LLM KHÔNG chặn — vẫn lưu session, vẫn trả ok.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  if (!UUID_RE.test(kidId)) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kid = await writableKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  // (F1) Rate limit mềm theo user — chống gọi lặp đốt token Gemini (mỗi POST = 1 lời gọi LLM).
  if (!memoryRateLimitOk(user.id)) {
    return NextResponse.json(
      { error: "Con đã lưu hơi nhiều trong giờ này rồi. Thử lại sau một lát nhé!" },
      { status: 429 },
    );
  }

  // (F1) Guard kích thước body: header Content-Length hoặc độ dài thực đọc được.
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

  // (F1) Cap số lượt + tổng ký tự (cắt) TRƯỚC khi lưu DB và TRƯỚC khi gọi LLM.
  const turns = normalizeTurns(body.turns);

  // Không có lượt nào → không có gì để lưu hay biên tập; coi như thành công (im lặng).
  if (turns.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const lessonId =
    typeof body.lesson_id === "string" && body.lesson_id ? body.lesson_id : null;
  const durRaw = typeof body.duration_min === "number" ? body.duration_min : 0;
  const dur = Math.max(0, Math.round(durRaw));

  // Điểm = tỉ lệ bài tập đúng trên tổng số bài đã làm (null nếu không có bài).
  // (F1) Cap số lượng bài tập lưu để tránh phình DB.
  const doneRaw = Array.isArray(body.exercises_done) ? body.exercises_done : [];
  const done = doneRaw.slice(0, MEMORY_CAPS.maxExercises);
  const correct = done.filter((d) => isRecord(d) && d.correct === true).length;
  const score = done.length ? Math.round((correct / done.length) * 100) : null;

  const admin = createAdminClient();

  // 1) Lưu buổi học (transcript = toàn bộ lượt hội thoại, đã cap).
  const { data: session, error: insErr } = await admin
    .from("ekid_sessions")
    .insert({
      kid_id: kidId,
      lesson_id: lessonId,
      ended_at: new Date().toISOString(),
      duration_min: dur,
      transcript: turns,
      exercises_done: done,
      score,
      ai_notes: null,
    })
    .select("id")
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // 2) Cộng dồn số phút vào ekid_daily theo mốc NGÀY VIỆT NAM (upsert khoá (kid_id, day)).
  if (dur > 0) {
    const day = vnDayString();
    const { data: existing } = await admin
      .from("ekid_daily")
      .select("minutes_used")
      .eq("kid_id", kidId)
      .eq("day", day)
      .maybeSingle();
    const newUsed = (existing?.minutes_used ?? 0) + dur;
    await admin
      .from("ekid_daily")
      .upsert({ kid_id: kidId, day, minutes_used: newUsed }, { onConflict: "kid_id,day" });
  }

  // 3) Biên tập bộ nhớ bằng Gemini — BEST-EFFORT, dùng CHUNG helper với endpoint session.
  //    Mọi lỗi (thiếu key, mạng, parse) đều bị nuốt, KHÔNG chặn: session đã lưu, trả ok.
  const aiNotes = await summarizeAndUpdateMemory(kidId, turns, {
    sessionId: session.id,
    kidName: kid.name,
    currentMemory: kid.memory,
  });

  return NextResponse.json({ ok: true, ai_notes: aiNotes });
}
