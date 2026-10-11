import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { badgesForProgress, pointsForScore } from "@/lib/ekid/ekid-system";
import type { EkidExercise } from "@/lib/ekid/ekid-system";
import { resolveChildKidId } from "@/lib/ekid/child";

export const dynamic = "force-dynamic";

interface ExerciseDone {
  question: string;
  answer_index: number;
  given: number | null;
  correct: boolean;
}

// POST /api/ekid/quiz — chấm điểm bài thi, lưu tiến độ + phiên học, cộng thưởng.
// Body: { kid_id, lesson_id, answers: number[] }.
// Quyền: chủ hồ sơ HOẶC chính là con (caregiver KHÔNG ghi).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const parsed = body as {
    kid_id?: string | null;
    lesson_id?: string;
    answers?: unknown;
  };
  let kid_id = parsed.kid_id ?? null;
  const { lesson_id, answers } = parsed;
  if (!lesson_id || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Thiếu lesson_id/answers" }, { status: 400 });
  }
  // kid_id không bắt buộc: con đang đăng nhập thì server tự suy ra hồ sơ của bé.
  if (!kid_id) kid_id = await resolveChildKidId(user.id);
  if (!kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const admin = createAdminClient();

  // Chống IDOR: chỉ chủ hồ sơ hoặc tài khoản con của hồ sơ đó được ghi.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id")
    .eq("id", kid_id)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const allowed = kid.user_id === user.id || kid.child_user_id === user.id;
  if (!allowed) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  // Lấy đề bài để chấm điểm.
  const { data: lesson } = await admin
    .from("ekid_lessons")
    .select("id, exercises")
    .eq("id", lesson_id)
    .maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });

  const exercises: EkidExercise[] = Array.isArray(lesson.exercises)
    ? (lesson.exercises as EkidExercise[])
    : [];
  const total = exercises.length;
  const given = answers as number[];

  let correct = 0;
  const exercisesDone: ExerciseDone[] = exercises.map((e, i) => {
    const pick = typeof given[i] === "number" ? given[i] : null;
    const ok = pick === e.answer_index;
    if (ok) correct++;
    return {
      question: e.question,
      answer_index: e.answer_index,
      given: pick,
      correct: ok,
    };
  });
  const score = total ? Math.round((correct / total) * 100) : 0;

  // Cập nhật tiến độ: status 'da-thi', best_score = lớn nhất giữa điểm cũ và mới, attempts +1.
  const { data: existing } = await admin
    .from("ekid_progress")
    .select("best_score, attempts")
    .eq("kid_id", kid_id)
    .eq("lesson_id", lesson_id)
    .maybeSingle();
  const bestScore = Math.max(existing?.best_score ?? 0, score);
  const attempts = (existing?.attempts ?? 0) + 1;

  const { error: progErr } = await admin
    .from("ekid_progress")
    .upsert(
      {
        kid_id,
        lesson_id,
        status: "da-thi",
        best_score: bestScore,
        attempts,
        last_at: new Date().toISOString(),
      },
      { onConflict: "kid_id,lesson_id" },
    );
  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 });

  // Ghi phiên học (duration_min = 0 vì đây là lượt thi tĩnh, không phải buổi voice).
  const { error: sessErr } = await admin.from("ekid_sessions").insert({
    kid_id,
    lesson_id,
    ended_at: new Date().toISOString(),
    duration_min: 0,
    transcript: [],
    exercises_done: exercisesDone,
    score,
  });
  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });

  // Điểm thưởng cho bài thi này.
  const pointsAwarded = pointsForScore(score);
  await admin.from("ekid_rewards").insert({
    kid_id,
    kind: "diem",
    label: "Điểm bài thi",
    points: pointsAwarded,
    reason: `Bài thi đạt ${score}%`,
  });

  // Đếm số bài đạt (best_score >= 70) để xét huy hiệu mới.
  const { data: passedRows } = await admin
    .from("ekid_progress")
    .select("lesson_id")
    .eq("kid_id", kid_id)
    .gte("best_score", 70);
  const passedLessons = (passedRows ?? []).length;

  const earned = badgesForProgress(passedLessons);
  const { data: existingBadges } = await admin
    .from("ekid_rewards")
    .select("code")
    .eq("kid_id", kid_id)
    .eq("kind", "huy-hieu");
  const haveCodes = new Set((existingBadges ?? []).map((b) => b.code as string));
  const newBadges = earned.filter((b) => !haveCodes.has(b.code));

  if (newBadges.length) {
    await admin.from("ekid_rewards").insert(
      newBadges.map((b) => ({
        kid_id,
        kind: "huy-hieu",
        code: b.code,
        label: b.label,
        points: 0,
        reason: `Đạt ${passedLessons} bài`,
      })),
    );
  }

  return NextResponse.json({
    score,
    best_score: bestScore,
    points_awarded: pointsAwarded,
    new_badges: newBadges,
    passed_lessons: passedLessons,
  });
}
