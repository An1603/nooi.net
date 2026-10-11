import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/ekid/lessons — bài học eKid đang ở trạng thái active.
 * Query tuỳ chọn: ?band=mam-non|tieu-hoc|thieu-nien để lọc theo nhóm tuổi.
 * Không yêu cầu đăng nhập — bài học là công khai.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const band = searchParams.get("band");

  const admin = createAdminClient();

  let query = admin
    .from("ekid_lessons")
    .select("*")
    .eq("status", "active")
    .order("difficulty", { ascending: true });

  if (band) {
    query = query.eq("age_band", band);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lessons: data ?? [] });
}
