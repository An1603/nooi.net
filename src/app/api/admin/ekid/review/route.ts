import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/ekid/admin-guard";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  lesson_id: string;
  review_status: string;
};

/**
 * GET /api/admin/ekid/review
 * Danh sách bài cần duyệt: số câu, số đã đạt, số cần sửa, trạng thái bài.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const db = createAdminClient();
  const { data: lessons, error } = await db
    .from("ekid_lessons")
    .select("id, slug, title, subject, grade, status, review_status, review_notes, objective_ids, est_minutes, sort_order")
    .eq("grade", 3)
    .order("subject", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: items } = await db
    .from("ekid_items")
    .select("id, lesson_id, review_status")
    .eq("active", true);

  const stats = new Map<string, { total: number; dat: number; canSua: number; cho: number }>();
  for (const it of (items ?? []) as Row[]) {
    const s = stats.get(it.lesson_id) ?? { total: 0, dat: 0, canSua: 0, cho: 0 };
    s.total += 1;
    if (it.review_status === "dat") s.dat += 1;
    else if (it.review_status === "can_sua") s.canSua += 1;
    else s.cho += 1;
    stats.set(it.lesson_id, s);
  }

  // Bài chưa có câu nào thì chưa có gì để duyệt — ẩn khỏi danh sách cho đỡ nhiễu.
  const rows = (lessons ?? [])
    .filter((l) => (stats.get(l.id)?.total ?? 0) > 0)
    .map((l) => {
    const s = stats.get(l.id) ?? { total: 0, dat: 0, canSua: 0, cho: 0 };
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      subject: l.subject,
      status: l.status,
      review_status: l.review_status,
      review_notes: l.review_notes,
      est_minutes: l.est_minutes,
      objectives: l.objective_ids ?? [],
      items: s,
      /** Bài chỉ được coi là xong khi mọi câu đã "đạt" và có ít nhất 1 câu. */
      done: s.total > 0 && s.dat === s.total,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.lessons += 1;
      acc.items += r.items.total;
      acc.dat += r.items.dat;
      acc.cho += r.items.cho;
      acc.canSua += r.items.canSua;
      if (r.done) acc.done += 1;
      return acc;
    },
    { lessons: 0, items: 0, dat: 0, cho: 0, canSua: 0, done: 0 },
  );

  return NextResponse.json({ lessons: rows, totals });
}

/**
 * PATCH /api/admin/ekid/review
 * body: { action: "dat" | "can_sua" | "reset", item_ids?: string[], lesson_id: string, note?: string }
 *
 * Không có `item_ids` = áp cho TOÀN BỘ câu của bài (duyệt nhanh cả bài).
 * Sau khi cập nhật, trạng thái bài được tính lại từ các câu — không cho phép "bài đạt"
 * khi còn câu chưa duyệt.
 */
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  let body: { action?: string; lesson_id?: string; item_ids?: string[]; note?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }

  const { action, lesson_id, item_ids, note } = body;
  if (!lesson_id || !action) {
    return NextResponse.json({ error: "Thiếu lesson_id hoặc action" }, { status: 400 });
  }
  const statusMap: Record<string, string> = {
    dat: "dat",
    can_sua: "can_sua",
    reset: "cho_duyet",
  };
  const status = statusMap[action];
  if (!status) return NextResponse.json({ error: "action không hợp lệ" }, { status: 400 });

  const db = createAdminClient();
  const now = new Date().toISOString();
  const patch = {
    review_status: status,
    review_note: note?.trim() ? note.trim() : null,
    reviewed_at: status === "cho_duyet" ? null : now,
    reviewed_by: status === "cho_duyet" ? null : admin.email ?? admin.userId,
  };

  const q = db.from("ekid_items").update(patch).eq("lesson_id", lesson_id);
  const { error } = item_ids && item_ids.length > 0 ? await q.in("id", item_ids) : await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Tính lại trạng thái bài từ chính các câu.
  const { data: all } = await db
    .from("ekid_items")
    .select("id, review_status")
    .eq("lesson_id", lesson_id)
    .eq("active", true);
  const list = all ?? [];
  const total = list.length;
  const dat = list.filter((i) => i.review_status === "dat").length;
  const canSua = list.filter((i) => i.review_status === "can_sua").length;

  const lessonStatus = total > 0 && dat === total ? "dat" : canSua > 0 ? "can_sua" : "cho_duyet";
  const { error: lErr } = await db
    .from("ekid_lessons")
    .update({
      review_status: lessonStatus,
      review_notes: note?.trim() ? note.trim() : null,
      ...(lessonStatus === "dat" ? { reviewed_at: now, reviewed_by: admin.email ?? admin.userId } : {}),
    })
    .eq("id", lesson_id);
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, lesson_status: lessonStatus, total, dat, can_sua: canSua });
}
