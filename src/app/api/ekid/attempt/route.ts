import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeKid } from "@/lib/ekid/access";
import { isCorrectAnswer, loadItems, recordAttempt, scheduleReview } from "@/lib/ekid/plan-server";
import { vnDayString } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

/**
 * POST /api/ekid/attempt  { kid_id, session_id, item_id, spoken }
 *
 * Chấm một lượt trả lời. `hints_used` KHÔNG lấy từ client — đếm từ ekid_hint_log,
 * nên không thể "giấu" việc đã mở gợi ý. Đáp án chỉ trả về khi đã mở hết bậc 4.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { kid_id?: string; session_id?: string; item_id?: string; spoken?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  const { kid_id, session_id, item_id, spoken } = body;
  if (!kid_id || !item_id) {
    return NextResponse.json({ error: "Thiếu kid_id / item_id" }, { status: 400 });
  }

  const kid = await writeKid(user.id, kid_id);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const { data: itemRow } = await admin
    .from("ekid_items")
    .select("id, lesson_id")
    .eq("id", item_id)
    .maybeSingle();
  if (!itemRow) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

  const items = await loadItems(itemRow.lesson_id as string);
  const item = items.find((i) => i.id === item_id);
  if (!item) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

  // Đếm số bậc gợi ý đã mở cho câu này trong phiên — server là nguồn duy nhất.
  let hintsUsed = 0;
  if (session_id) {
    const { count } = await admin
      .from("ekid_hint_log")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session_id)
      .eq("item_id", item_id);
    hintsUsed = count ?? 0;
  }

  const correct = isCorrectAnswer(item, spoken ?? "");
  await recordAttempt({
    kidId: kid_id,
    sessionId: session_id ?? null,
    itemId: item_id,
    objectiveId: item.objective_id,
    correct,
    hintsUsed,
    transcript: spoken ?? null,
  });
  await scheduleReview({ kidId: kid_id, objectiveId: item.objective_id, correct });

  return NextResponse.json({
    correct,
    hints_used: hintsUsed,
    objective_id: item.objective_id,
    // Không lộ đáp án trừ khi bé đã đi hết thang gợi ý.
    answer: hintsUsed >= 4 ? item.answer.value : null,
    next_step: correct ? "tiep" : hintsUsed >= 4 ? "noi_lai" : "goi_y",
  });
}

/**
 * GET /api/ekid/attempt?kid_id=&day=  → thống kê nhanh trong ngày (dùng cho UI của con).
 * Không trả đáp án, chỉ trả số câu đúng khi không gợi ý.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const url = new URL(req.url);
  const kidId = url.searchParams.get("kid_id");
  const day = url.searchParams.get("day") || vnDayString();
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const { readKid } = await import("@/lib/ekid/access");
  const kid = await readKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_attempts")
    .select("correct, hints_used")
    .eq("kid_id", kidId)
    .gte("created_at", `${day}T00:00:00+07:00`)
    .lte("created_at", `${day}T23:59:59+07:00`);

  const rows = (data ?? []) as Array<{ correct: boolean | null; hints_used: number }>;
  const graded = rows.filter((r) => r.correct !== null);
  const correctNoHint = graded.filter((r) => r.correct && r.hints_used === 0).length;
  return NextResponse.json({
    day,
    total: graded.length,
    correct: graded.filter((r) => r.correct).length,
    correct_no_hint: correctNoHint,
  });
}
