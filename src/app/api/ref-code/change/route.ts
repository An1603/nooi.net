import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/current-user";

/**
 * POST /api/ref-code/change
 *
 * Đổi mã giới thiệu của CHÍNH người đang đăng nhập. Dùng service role để bypass RLS
 * sau khi đã xác định danh tính từ phiên.
 *
 * Body: { newCode: string }   (`userId` trong body bị BỎ QUA — audit 01/11/2026)
 *
 * Response: 200 { success } | 400/401 { success: false, error }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Chưa đăng nhập." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const newCode = body && typeof body.newCode === "string" ? body.newCode : "";
  const userId = user.id;

  const trimmed = newCode.trim().toUpperCase();
  if (!trimmed) {
    return NextResponse.json({ success: false, error: "Mã không được để trống." });
  }
  if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
    return NextResponse.json({ success: false, error: "Mã chỉ gồm chữ hoa và số, từ 2-10 ký tự." });
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
