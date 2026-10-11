import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateLinkCode } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// GET /api/ekid/caregivers
//   ?q=<từ khoá>  → tìm người dùng theo tên (để mời liên kết)
//   ?kid_id=<id>  → danh sách người thân của hồ sơ trẻ
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kidId = searchParams.get("kid_id");
  const q = searchParams.get("q");
  const admin = createAdminClient();

  if (q !== null) {
    // Tìm user theo tên hiển thị (profiles.full_name) để mời liên kết.
    // Chống enumeration/rò rỉ danh bạ: bắt buộc từ khoá >= 3 ký tự, nếu ngắn hơn
    // trả rỗng luôn (không truy vấn). Không phân biệt hoa/thường.
    const keyword = q.trim();
    if (keyword.length < 3) return NextResponse.json({ users: [] });

    // Escape ký tự đại diện của LIKE (`\`, `%`, `_`) để `q` chỉ khớp theo nghĩa
    // chuỗi con nguyên văn, không cho phép `%`/`_` liệt kê toàn bộ bảng.
    const escaped = keyword.replace(/[\\%_]/g, "\\$&");

    // Chỉ trả 2 trường tối thiểu (user_id + full_name), giới hạn 10 kết quả.
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, full_name")
      .ilike("full_name", `%${escaped}%`)
      .limit(10);
    return NextResponse.json({ users: profiles ?? [] });
  }

  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  // Chống IDOR: chỉ xem người thân của hồ sơ trẻ thuộc chính user.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id")
    .eq("id", kidId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { data } = await admin.from("ekid_caregivers").select("*").eq("kid_id", kidId);
  return NextResponse.json({ caregivers: data ?? [] });
}

// POST /api/ekid/caregivers — tạo lời mời liên kết người thân, sinh `link_code`.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { kid_id, caregiver_user_id, role } = (await req.json()) ?? {};
  if (!kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const admin = createAdminClient();
  // Chống IDOR: hồ sơ trẻ phải thuộc chính user đang đăng nhập.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id")
    .eq("id", kid_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { data, error } = await admin
    .from("ekid_caregivers")
    .insert({
      kid_id,
      caregiver_user_id: caregiver_user_id ?? user.id,
      role: role || "nguoi-giam-ho",
      status: "pending",
      link_code: generateLinkCode(),
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ caregiver: data });
}

// PATCH /api/ekid/caregivers — chấp nhận (`linked`) hoặc từ chối (`rejected`) lời mời.
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { id, status } = (await req.json()) ?? {};
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  if (status !== "linked" && status !== "rejected") {
    return NextResponse.json({ error: "status không hợp lệ" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Chống IDOR: tra bản ghi để lấy kid_id + caregiver_user_id trước khi update.
  const { data: cg } = await admin
    .from("ekid_caregivers")
    .select("id, kid_id, caregiver_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!cg) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Quyền được accept/reject: (a) người gọi là CHỦ hồ sơ trẻ (owner của kid_id),
  // HOẶC (b) người gọi chính là người được mời (caregiver_user_id) → tự accept/từ chối
  // lời mời của mình. Không cho phép người khác đổi trạng thái lời mời không phải của mình.
  let allowed = cg.caregiver_user_id === user.id;
  if (!allowed) {
    const { data: kid } = await admin
      .from("ekid_kids")
      .select("id")
      .eq("id", cg.kid_id)
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = !!kid;
  }
  if (!allowed) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { data, error } = await admin
    .from("ekid_caregivers")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ caregiver: data });
}
