import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/ref-code/change
 *
 * Server-side: đổi mã giới thiệu. Dùng service role key để bypass RLS.
 * Kiểm tra uniqueness + số lần đổi.
 *
 * Body: { userId: string, newCode: string }
 *
 * Response:
 *   200: { success: true }
 *   400: { success: false, error: "..." }
 *   500: { success: false, error: "..." }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, newCode } = body as { userId?: string; newCode?: string };

  const trimmed = newCode?.trim().toUpperCase();
  if (!trimmed) {
    return NextResponse.json({ success: false, error: "Mã không được để trống." });
  }
  if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
    return NextResponse.json({ success: false, error: "Mã chỉ gồm chữ hoa và số, từ 2-10 ký tự." });
  }
  if (!userId) {
    return NextResponse.json({ success: false, error: "Thiếu userId." });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check change limit
  const { data: profile } = await supabase
    .from("profiles")
    .select("ref_code_changes, ref_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ success: false, error: "Không tìm thấy tài khoản." });
  }

  const changesSoFar = (profile.ref_code_changes as number) ?? 0;
  if (changesSoFar >= 3) {
    return NextResponse.json({ success: false, error: "Bạn đã đổi mã 3 lần, không thể đổi thêm." });
  }

  // Check same as current
  if (trimmed === profile.ref_code) {
    return NextResponse.json({ success: false, error: "Mã mới giống với mã hiện tại." });
  }

  // Check uniqueness (exclude self)
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("ref_code", trimmed)
    .neq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: false, error: "Mã này đã có người sử dụng." });
  }

  // Update code + increment counter
  const { error } = await supabase
    .from("profiles")
    .update({
      ref_code: trimmed,
      ref_code_changes: changesSoFar + 1,
    })
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true });
}
