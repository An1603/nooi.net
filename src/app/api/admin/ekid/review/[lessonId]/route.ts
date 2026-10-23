import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/ekid/admin-guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/ekid/review/{lessonId}
 * Toàn bộ nội dung một bài để người duyệt đọc: lời hỏi, đáp án, 4 bậc gợi ý,
 * mã yêu cầu cần đạt + câu chữ gốc của Bộ (để đối chiếu, không phải nhớ).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ lessonId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { lessonId } = await ctx.params;
  const db = createAdminClient();

  const { data: lesson, error } = await db
    .from("ekid_lessons")
    .select("id, slug, title, subject, grade, status, review_status, review_notes, objective_ids, est_minutes, core_topic, script_hint, part")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!lesson) return NextResponse.json({ error: "Không tìm thấy bài" }, { status: 404 });

  const { data: items } = await db
    .from("ekid_items")
    .select("id, objective_id, level, kind, sort_order, prompt, answer, hint_ladder, review_status, review_note, reviewed_at, reviewed_by, audio_url, active")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  const objIds = Array.from(new Set((items ?? []).map((i) => i.objective_id).filter(Boolean)));
  const { data: objectives } = objIds.length
    ? await db.from("ekid_objectives").select("id, code_short, statement, strand, topic").in("id", objIds as string[])
    : { data: [] };
  const objMap = new Map((objectives ?? []).map((o) => [o.id, o]));

  return NextResponse.json({
    lesson,
    items: (items ?? []).map((i) => ({
      ...i,
      objective: i.objective_id ? objMap.get(i.objective_id) ?? null : null,
    })),
  });
}
