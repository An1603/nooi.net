import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeKid } from "@/lib/ekid/access";
import { isCorrectAnswer, loadItems, type ItemRow } from "@/lib/ekid/plan-server";
import { canOpenCheckup, gradeCheckup } from "@/lib/ekid/plan-core";

export const dynamic = "force-dynamic";

/**
 * POST /api/ekid/checkup  { action: "start"|"submit", ... }
 *
 * start: mở cửa kiểm tra khi bé đã có ≥3 phiên đạt (≥70% câu đúng KHÔNG gợi ý)
 *        trong 14 ngày, cùng cụm YCCĐ của bài.
 * submit: chấm 5–7 câu, bắt buộc có 1 câu giải thích đạt mức ≥2; qua thì +1 level.
 *
 * Không cấp thang gợi ý trong cửa kiểm tra — chặn ở đây, không phụ thuộc prompt.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: {
    action?: "start" | "submit";
    kid_id?: string;
    lesson_id?: string;
    checkup_id?: string;
    answers?: Array<{ item_id: string; spoken?: string }>;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  if (!body.kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await writeKid(user.id, body.kid_id);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();

  if (body.action === "start") {
    if (!body.lesson_id) return NextResponse.json({ error: "Thiếu lesson_id" }, { status: 400 });

    const { data: lesson } = await admin
      .from("ekid_lessons")
      .select("id, title, objective_ids")
      .eq("id", body.lesson_id)
      .maybeSingle();
    if (!lesson) return NextResponse.json({ error: "Không tìm thấy bài" }, { status: 404 });

    const objectives = (lesson.objective_ids as string[] | null) ?? [];
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { data: attempts } = await admin
      .from("ekid_attempts")
      .select("session_id, correct, hints_used")
      .eq("kid_id", body.kid_id)
      .in("objective_id", objectives.length ? objectives : ["__none__"])
      .gte("created_at", since);

    const bySession = new Map<string, { ok: number; total: number }>();
    for (const a of attempts ?? []) {
      const sid = (a.session_id as string | null) ?? "no-session";
      const cur = bySession.get(sid) ?? { ok: 0, total: 0 };
      cur.total += 1;
      if (a.correct && (a.hints_used as number) === 0) cur.ok += 1;
      bySession.set(sid, cur);
    }
    const passedSessions = [...bySession.values()].filter((v) => v.total > 0 && v.ok / v.total >= 0.7).length;

    if (!canOpenCheckup(passedSessions)) {
      return NextResponse.json(
        {
          error: "Chưa đủ điều kiện mở cửa kiểm tra",
          passed_sessions: passedSessions,
          required: 3,
        },
        { status: 409 },
      );
    }

    // Chọn câu: ưu tiên mức 1–2, thêm 1 câu mức 3 và 1 câu giải thích.
    const pool: ItemRow[] = [];
    for (const oid of objectives) {
      const { data: rows } = await admin
        .from("ekid_items")
        .select("id, lesson_id, objective_id, level, kind, prompt, answer, hint_ladder")
        .eq("objective_id", oid)
        .eq("active", true)
        .limit(10);
      for (const r of (rows ?? []) as ItemRow[]) pool.push(r);
    }
    const explain = pool.find((i) => i.kind === "giai_thich");
    const hard = pool.filter((i) => i.level === 3 && i.kind !== "giai_thich").slice(0, 1);
    const rest = pool.filter((i) => !hard.includes(i) && i !== explain).slice(0, 6);
    const chosen = [...rest, ...hard, ...(explain ? [explain] : [])].slice(0, 7);

    if (chosen.length < 4) {
      return NextResponse.json({ error: "Chưa đủ câu hỏi cho cụm này" }, { status: 409 });
    }

    const { data: checkup, error } = await admin
      .from("ekid_checkups")
      .insert({
        kid_id: body.kid_id,
        unit: lesson.title as string,
        objective_ids: objectives,
        items: chosen.map((c) => ({ id: c.id, prompt: c.prompt, kind: c.kind, level: c.level })),
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      checkup_id: checkup.id,
      unit: lesson.title,
      items: chosen.map((c) => ({ id: c.id, prompt: c.prompt, kind: c.kind, level: c.level })),
      hint_allowed: false,
    });
  }

  if (body.action === "submit") {
    if (!body.checkup_id || !Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Thiếu checkup_id / answers" }, { status: 400 });
    }
    const { data: checkup } = await admin
      .from("ekid_checkups")
      .select("id, kid_id, unit, objective_ids, items, result")
      .eq("id", body.checkup_id)
      .maybeSingle();
    if (!checkup || checkup.kid_id !== body.kid_id) {
      return NextResponse.json({ error: "Không tìm thấy cửa kiểm tra" }, { status: 404 });
    }
    if (checkup.result) return NextResponse.json({ error: "Cửa kiểm tra đã chấm" }, { status: 409 });

    const itemIds = (checkup.items as Array<{ id: string }>).map((i) => i.id);
    const items: ItemRow[] = [];
    for (const id of itemIds) {
      const { data: r } = await admin
        .from("ekid_items")
        .select("id, lesson_id, objective_id, level, kind, prompt, answer, hint_ladder")
        .eq("id", id)
        .maybeSingle();
      if (r) items.push(r as ItemRow);
    }

    let correct = 0;
    let explanationScore: number | null = null;
    for (const ans of body.answers) {
      const item = items.find((i) => i.id === ans.item_id);
      if (!item) continue;
      const ok = isCorrectAnswer(item, ans.spoken ?? "");
      if (ok) correct += 1;
      if (item.kind === "giai_thich") {
        // Chấm thô theo độ đầy đủ của lời giải thích; giáo viên có thể soát lại sau.
        const n = (ans.spoken ?? "").trim().length;
        explanationScore = n >= 60 ? 3 : n >= 20 ? 2 : 1;
      }
      await admin.from("ekid_attempts").insert({
        kid_id: body.kid_id,
        item_id: item.id,
        objective_id: item.objective_id,
        correct: ok,
        hints_used: 0,
        transcript: ans.spoken ?? null,
        rubric_score: item.kind === "giai_thich" ? explanationScore : null,
      });
    }

    const graded = gradeCheckup({ total: items.length, correct, explanationScore });
    await admin
      .from("ekid_checkups")
      .update({
        result: graded.pass ? "pass" : "fail",
        score: graded.score,
        retake_after: graded.pass ? null : new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
      })
      .eq("id", body.checkup_id);

    let newLevel = kid.placement_level ?? 1;
    let unlocked: Array<{ id: string; label: string }> = [];
    if (graded.pass) {
      newLevel = (kid.placement_level ?? 1) + 1;
      await admin.from("ekid_kids").update({ placement_level: newLevel }).eq("id", body.kid_id);
      const { data: rewards } = await admin
        .from("ekid_rewards")
        .update({ status: "unlocked" })
        .eq("kid_id", body.kid_id)
        .eq("status", "locked")
        .lte("level_required", newLevel)
        .select("id, label");
      unlocked = (rewards ?? []) as Array<{ id: string; label: string }>;
    }

    return NextResponse.json({
      result: graded.pass ? "pass" : "fail",
      score: graded.score,
      correct,
      total: items.length,
      level: newLevel,
      unlocked_rewards: unlocked,
    });
  }

  return NextResponse.json({ error: "action phải là start hoặc submit" }, { status: 400 });
}
