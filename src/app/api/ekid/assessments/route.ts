import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolvePlacement } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// POST /api/ekid/assessments — ghi kết quả bài test (đầu vào / hằng ngày),
// tính lại định vị của bé rồi trả về `{ placement }`.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { kid_id, step, items, score_pct } = (await req.json()) ?? {};
  if (!kid_id || !step) {
    return NextResponse.json({ error: "Thiếu kid_id/step" }, { status: 400 });
  }
  if (step !== "dau-vao" && step !== "ngay") {
    return NextResponse.json({ error: "step không hợp lệ" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Chống IDOR: chỉ thao tác trên hồ sơ trẻ thuộc chính user đang đăng nhập.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("*")
    .eq("id", kid_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  // Điểm test đầu vào: dùng điểm vừa nộp nếu là bước 'dau-vao', ngược lại lấy dòng mới nhất đã lưu.
  let entryTestPct: number | null = null;
  if (step === "dau-vao") {
    entryTestPct = score_pct ?? null;
  } else {
    const { data: entry } = await admin
      .from("ekid_assessments")
      .select("kid_result")
      .eq("kid_id", kid_id)
      .eq("step", "dau-vao")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    entryTestPct = (entry?.kid_result as { score_pct?: number | null } | null)?.score_pct ?? null;
  }

  // Kết quả học gần đây: đếm THẬT các phiên gần đây có score >= 70 (không suy từ placement_level
  // hiện tại — trước đây là lỗi self-referential khiến level không bao giờ đổi).
  const { data: recent } = await admin
    .from("ekid_sessions")
    .select("score")
    .eq("kid_id", kid_id)
    .order("started_at", { ascending: false })
    .limit(5);
  const recentGoodSessions = (recent ?? []).filter((s) => (s.score ?? 0) >= 70).length;

  const placement = resolvePlacement({
    dob: kid.date_of_birth,
    entryTestPct,
    recentGoodSessions,
  });

  const { error: insErr } = await admin.from("ekid_assessments").insert({
    kid_id,
    step,
    items: items ?? [],
    band_after: { ageBand: placement.ageBand, level: placement.level },
    kid_result: { score_pct: score_pct ?? null },
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { error: updErr } = await admin
    .from("ekid_kids")
    .update({
      placement_age_band: placement.ageBand,
      placement_level: placement.level,
    })
    .eq("id", kid_id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ placement });
}
