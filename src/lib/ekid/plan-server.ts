/**
 * Tầng I/O cho lịch học eKid M1. RLS được bỏ qua vì dùng admin client ở server;
 * quyền truy cập đã được kiểm ở route (chủ hồ sơ / chính bé / người chăm sóc).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeSpokenAnswer } from "@/lib/ekid/answer-grade";
import { vnDayString } from "@/lib/ekid/ekid-system";
import {
  buildDailyPlan,
  nextHintTier,
  nextReviewDate,
  stageAfterResult,
  type LessonCandidate,
  type PlanSlot,
  type ReviewCandidate,
} from "@/lib/ekid/plan-core";

const GRADE = 3;

export interface TodayPlan {
  date: string;
  grade: number;
  minutesCap: number;
  slots: Array<PlanSlot & { title: string | null; estMinutes: number | null; done: boolean }>;
}

interface LessonRow {
  id: string;
  title: string;
  objective_ids: string[] | null;
  est_minutes: number | null;
  slug: string | null;
}

async function loadLessons(kidId: string): Promise<LessonRow[]> {
  const admin = createAdminClient();
  const { data: lessons, error } = await admin
    .from("ekid_lessons")
    .select("id, title, objective_ids, est_minutes, slug")
    .eq("grade", GRADE)
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (lessons ?? []) as LessonRow[];
}

async function loadDueReviews(kidId: string, today: string): Promise<ReviewCandidate[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_reviews")
    .select("objective_id, stage, last_result")
    .eq("kid_id", kidId)
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(8);
  return (data ?? []).map((r) => ({
    objectiveId: r.objective_id as string,
    stage: (r.stage as number) ?? 1,
    lastResult: (r.last_result as boolean | null) ?? null,
  }));
}

async function loadDoneLessonIds(kidId: string): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_progress")
    .select("lesson_id, status")
    .eq("kid_id", kidId);
  return new Set(
    (data ?? []).filter((r) => r.status === "da-hoc" || r.status === "da-thi").map((r) => r.lesson_id as string),
  );
}

async function kidMinutesCap(kidId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin.from("ekid_kids").select("daily_limit_min").eq("id", kidId).maybeSingle();
  const cap = (data?.daily_limit_min as number | undefined) ?? 20;
  return Math.min(Math.max(cap, 5), 30); // trần cứng 30 phút/ngày (NĐ 147/2024 tham chiếu)
}

/**
 * Trả lịch hôm nay. Nếu chưa có thì sinh mới và ghi vào ekid_daily_plan.
 * Sinh lại vào buổi khác trong ngày sẽ trả lịch đã ghi (ổn định cho trẻ).
 */
export async function getOrCreateTodayPlan(kidId: string): Promise<TodayPlan> {
  const admin = createAdminClient();
  const today = vnDayString();

  const { data: existing } = await admin
    .from("ekid_daily_plan")
    .select("slot, kind, lesson_id, objective_ids, done")
    .eq("kid_id", kidId)
    .eq("plan_date", today)
    .order("slot", { ascending: true });

  const lessons = await loadLessons(kidId);
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const minutesCap = await kidMinutesCap(kidId);

  if (existing && existing.length > 0) {
    return {
      date: today,
      grade: GRADE,
      minutesCap,
      slots: existing.map((r) => {
        const lesson = r.lesson_id ? byId.get(r.lesson_id as string) : undefined;
        return {
          slot: r.slot as number,
          kind: r.kind as PlanSlot["kind"],
          lessonId: (r.lesson_id as string | null) ?? null,
          objectiveIds: (r.objective_ids as string[] | null) ?? [],
          title: lesson?.title ?? null,
          estMinutes: lesson?.est_minutes ?? null,
          done: Boolean(r.done),
        };
      }),
    };
  }

  const [reviews, doneIds] = await Promise.all([loadDueReviews(kidId, today), loadDoneLessonIds(kidId)]);
  const candidates: LessonCandidate[] = lessons.map((l) => ({
    id: l.id,
    objectiveIds: l.objective_ids ?? [],
    estMinutes: l.est_minutes ?? 10,
    done: doneIds.has(l.id),
  }));

  const slots = buildDailyPlan({ reviews, lessons: candidates, minutesCap, maxSlots: 3 });

  if (slots.length > 0) {
    await admin.from("ekid_daily_plan").upsert(
      slots.map((s) => ({
        kid_id: kidId,
        plan_date: today,
        slot: s.slot,
        kind: s.kind,
        lesson_id: s.lessonId,
        objective_ids: s.objectiveIds,
      })),
      { onConflict: "kid_id,plan_date,slot" },
    );
  }

  return {
    date: today,
    grade: GRADE,
    minutesCap,
    slots: slots.map((s) => {
      const lesson = s.lessonId ? byId.get(s.lessonId) : undefined;
      return {
        ...s,
        title: lesson?.title ?? null,
        estMinutes: lesson?.est_minutes ?? null,
        done: false,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Ghi nhận lượt trả lời + thang gợi ý (server là nguồn duy nhất)
// ---------------------------------------------------------------------------

export interface ItemRow {
  id: string;
  lesson_id: string;
  objective_id: string;
  level: number;
  kind: string;
  prompt: string;
  answer: { value: string; alt?: string[]; rubric?: string[] };
  hint_ladder: string[];
}

export async function loadItems(lessonId: string): Promise<ItemRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_items")
    .select("id, lesson_id, objective_id, level, kind, prompt, answer, hint_ladder")
    .eq("lesson_id", lessonId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemRow[];
}

/** Chuẩn hoá chuỗi tiếng Việt để so đáp án nói (bỏ dấu, bỏ khoảng trắng thừa). */
export function normalizeAnswer(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s.,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chấm câu trả lời nói. Ủy quyền cho {@link gradeSpokenAnswer} — bản cũ so chuỗi thô nên
 * chấm SAI khi bé nói "bảy mươi nghìn không trăm linh năm" cho đáp án "70 005", hoặc nói
 * "đáp án bê" cho đáp án "B". Xem `answer-grade.ts` + test `ekid-answer-grade`.
 */
export function isCorrectAnswer(item: Pick<ItemRow, "answer">, spoken: string): boolean {
  return gradeSpokenAnswer(item.answer ?? null, spoken ?? "");
}

export async function recordAttempt(input: {
  kidId: string;
  sessionId: string | null;
  itemId: string | null;
  objectiveId: string | null;
  correct: boolean;
  hintsUsed: number;
  transcript?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("ekid_attempts").insert({
    kid_id: input.kidId,
    session_id: input.sessionId,
    item_id: input.itemId,
    objective_id: input.objectiveId,
    correct: input.correct,
    hints_used: input.hintsUsed,
    transcript: input.transcript ?? null,
  });
}

/** Mở bậc gợi ý kế tiếp cho một câu trong một phiên. Server quyết bậc. */
export async function openNextHint(input: {
  kidId: string;
  sessionId: string;
  item: ItemRow;
}): Promise<{ tier: number; text: string }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_hint_log")
    .select("tier")
    .eq("session_id", input.sessionId)
    .eq("item_id", input.item.id)
    .order("tier", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tier = nextHintTier((data?.tier as number | undefined) ?? 0);
  const ladder = input.item.hint_ladder ?? [];
  const text = ladder[tier - 1] ?? "Cô chưa có gợi ý cho câu này. Con thử nói lại điều con nghĩ nhé.";

  await admin.from("ekid_hint_log").insert({
    kid_id: input.kidId,
    session_id: input.sessionId,
    item_id: input.item.id,
    tier,
  });

  return { tier, text };
}

/** Cập nhật lịch ôn giãn cách sau mỗi lượt trả lời. */
export async function scheduleReview(input: {
  kidId: string;
  objectiveId: string;
  correct: boolean;
  currentStage?: number;
}): Promise<{ stage: number; dueDate: string }> {
  const admin = createAdminClient();
  const stage = stageAfterResult(input.currentStage ?? 1, input.correct);
  const today = vnDayString();
  const dueDate = nextReviewDate(today, stage);

  await admin.from("ekid_reviews").upsert(
    {
      kid_id: input.kidId,
      objective_id: input.objectiveId,
      due_date: dueDate,
      stage,
      last_result: input.correct,
    },
    { onConflict: "kid_id,objective_id,due_date" },
  );

  return { stage, dueDate };
}

/** Báo cáo ngày 5 dòng cho phụ huynh. */
export async function dailyReport(kidId: string, day = vnDayString()) {
  const admin = createAdminClient();
  const start = `${day}T00:00:00+07:00`;
  const end = `${day}T23:59:59+07:00`;

  const [{ data: attempts }, { data: sessions }, { data: kid }] = await Promise.all([
    admin
      .from("ekid_attempts")
      .select("correct, hints_used, objective_id, created_at")
      .eq("kid_id", kidId)
      .gte("created_at", start)
      .lte("created_at", end),
    admin
      .from("ekid_sessions")
      .select("duration_min, ai_notes, ended_at")
      .eq("kid_id", kidId)
      .not("ended_at", "is", null)
      .gte("ended_at", start)
      .lte("ended_at", end),
    admin.from("ekid_kids").select("name").eq("id", kidId).maybeSingle(),
  ]);

  const rows = (attempts ?? []) as Array<{ correct: boolean | null; hints_used: number; objective_id: string | null }>;
  const graded = rows.filter((r) => r.correct !== null);
  const correctNoHint = graded.filter((r) => r.correct && r.hints_used === 0).length;
  const minutes = ((sessions ?? []) as Array<{ duration_min: number | null }>).reduce(
    (sum, s) => sum + (s.duration_min ?? 0),
    0,
  );

  // YCCĐ còn vướng: sai nhiều hơn đúng
  const byObjective = new Map<string, { ok: number; bad: number }>();
  for (const r of graded) {
    if (!r.objective_id) continue;
    const cur = byObjective.get(r.objective_id) ?? { ok: 0, bad: 0 };
    if (r.correct) cur.ok += 1;
    else cur.bad += 1;
    byObjective.set(r.objective_id, cur);
  }
  const weak = [...byObjective.entries()]
    .filter(([, v]) => v.bad > 0 && v.bad >= v.ok)
    .sort((a, b) => b[1].bad - a[1].bad)
    .slice(0, 2)
    .map(([id]) => id);

  return {
    day,
    kidName: (kid?.name as string | undefined) ?? "Con",
    minutes,
    sessions: (sessions ?? []).length,
    graded: graded.length,
    correctNoHint,
    rateNoHint: graded.length === 0 ? 0 : Math.round((correctNoHint / graded.length) * 100),
    weakObjectives: weak,
    summary: ((sessions ?? [])[0] as { ai_notes?: string | null } | undefined)?.ai_notes ?? null,
  };
}
