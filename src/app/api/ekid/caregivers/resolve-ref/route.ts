import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/ekid/caregivers/resolve-ref
//   { ref_code } → tra chủ sở hữu mã giới thiệu để hiển thị/xác nhận trước khi thêm làm người giám sát.
// Auth: dùng server client để kiểm đăng nhập (401 nếu chưa login). Việc đọc hồ sơ người KHÁC
// chạy bằng admin client (bỏ RLS) vì profiles chỉ cho phép select_own_profile dưới RLS.
// Chỉ khớp MÃ CHÍNH XÁC bằng .eq sau khi trim + uppercase + validate ^[A-Za-z0-9]+$ (loại %/_ wildcard).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const raw = typeof body.ref_code === "string" ? body.ref_code.trim() : "";
  if (!raw) return NextResponse.json({ error: "Thiếu ref_code" }, { status: 400 });

  // Chỉ chữ hoa + số (sinh bởi generate_ref_code). Chặn %/_ và mọi ký tự đại diện khác.
  if (!/^[A-Za-z0-9]+$/.test(raw)) {
    return NextResponse.json({ error: "Mã giới thiệu không hợp lệ" }, { status: 400 });
  }
  const normalized = raw.toUpperCase();

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("user_id, full_name, ref_code")
    .eq("ref_code", normalized)
    .limit(1);

  const owner = (data ?? [])[0];
  if (!owner) {
    return NextResponse.json({ error: "Không tìm thấy mã giới thiệu" }, { status: 404 });
  }

  return NextResponse.json({
    user_id: owner.user_id,
    full_name: owner.full_name ?? "Người dùng",
    ref_code: owner.ref_code ?? normalized,
  });
}