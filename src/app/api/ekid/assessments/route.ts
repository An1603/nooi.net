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

  const placement = resolvePlacement({
    dob: kid.date_of_birth,
    // Test đầu vào chỉnh định vị theo điểm; các bước khác không truyền điểm.
    entryTestPct: step === "dau-vao" ? score_pct ?? null : undefined,
    // Kết quả học gần đây: suy ra số phiên tốt cần thiết để giữ cấp hiện tại.
    recentGoodSessions:
      step === "ngay" ? Math.max(0, (kid.placement_level ?? 1) - 1) * 3 + 1 : undefined,
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
