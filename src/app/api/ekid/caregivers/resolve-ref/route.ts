import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/ekid/caregivers/resolve-ref
//   { ref_code } → tra chủ sở hữu mã giới thiệu để hiển thị/xác nhận trước khi thêm làm người giám sát.
// Dùng server client (phân quyền authenticated): chỉ đọc full_name/ref_code/user_id của profile khớp mã.
// Chỉ khớp MÃ CHÍNH XÁC (ilike không ký tự đại diện) — không trả danh sách gợi ý, tránh rò rỉ danh tính.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const code = typeof body.ref_code === "string" ? body.ref_code.trim() : "";
  if (!code) return NextResponse.json({ error: "Thiếu ref_code" }, { status: 400 });

  const { data } = await supabase
    .from("profiles")
    .select("user_id, full_name, ref_code")
    .ilike("ref_code", code)
    .limit(1);

  const owner = (data ?? [])[0];
  if (!owner) {
    return NextResponse.json({ error: "Không tìm thấy mã giới thiệu" }, { status: 404 });
  }

  return NextResponse.json({
    user_id: owner.user_id,
    full_name: owner.full_name ?? "Người dùng",
    ref_code: owner.ref_code ?? code,
  });
}