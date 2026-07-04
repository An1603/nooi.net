import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/ref-code/check?code=NINH&userId=xxx
 *
 * Server-side endpoint dùng service role key để check uniqueness của mã giới thiệu.
 * Bypass RLS — cho kết quả chính xác.
 *
 * Response:
 *   200: { available: true } | { available: false, error: "..." }
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  const userId = req.nextUrl.searchParams.get("userId");

  if (!code) {
    return NextResponse.json({ available: false, error: "Mã không được để trống." });
  }
  if (!/^[A-Z0-9]{2,10}$/.test(code)) {
    return NextResponse.json({ available: false, error: "Mã chỉ gồm chữ hoa và số, từ 2-10 ký tự." });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("ref_code", code)
    .maybeSingle();

  if (existing) {
    // Same user → available (they're checking their own code)
    if (userId && existing.user_id === userId) {
      return NextResponse.json({ available: true });
    }
    return NextResponse.json({
      available: false,
      error: "Mã này đã có người sử dụng. Vui lòng chọn mã khác.",
    });
  }

  return NextResponse.json({ available: true });
}
