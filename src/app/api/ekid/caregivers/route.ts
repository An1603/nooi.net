import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateLinkCode, normalizeLinkCode } from "@/lib/ekid/ekid-system";

export const dynamic = "force-dynamic";

// GET /api/ekid/caregivers
//   ?q=<từ khoá>  → tìm người dùng theo tên (để mời liên kết)
//   ?kid_id=<id>  → danh sách người thân của hồ sơ trẻ (chủ hồ sơ HOẶC người thân đã liên kết đọc)
//   (không tham số) → danh sách lời mời/liên kết GỬI ĐẾN chính user (caregiver_user_id = user)
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

  // Không có q và không có kid_id → lời mời/liên kết gửi đến CHÍNH user.
  // Để người được mời thấy lời mời của mình và bấm Chấp nhận/Từ chối.
  if (!kidId) {
    const { data: mine } = await admin
      .from("ekid_caregivers")
      .select("*")
      .eq("caregiver_user_id", user.id)
      .order("created_at", { ascending: false });
    const rows = mine ?? [];
    const kidIds = Array.from(new Set(rows.map((r) => r.kid_id as string)));
    let nameById = new Map<string, string>();
    if (kidIds.length) {
      const { data: kids } = await admin.from("ekid_kids").select("id, name").in("id", kidIds);
      nameById = new Map((kids ?? []).map((k) => [k.id as string, k.name as string]));
    }
    const caregivers = rows.map((r) => ({ ...r, kid_name: nameById.get(r.kid_id as string) ?? null }));
    return NextResponse.json({ caregivers });
  }

  // Danh sách người thân của một hồ sơ: cho chủ hồ sơ HOẶC người thân đã 'linked' đọc.
  // Chống IDOR: hồ sơ trẻ phải thuộc chính user, hoặc user là caregiver đã liên kết.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id, name, user_id")
    .eq("id", kidId)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  let allowed = kid.user_id === user.id;
  if (!allowed) {
    const { data: link } = await admin
      .from("ekid_caregivers")
      .select("id")
      .eq("kid_id", kidId)
      .eq("caregiver_user_id", user.id)
      .eq("status", "linked")
      .maybeSingle();
    allowed = !!link;
  }
  if (!allowed) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { data } = await admin
    .from("ekid_caregivers")
    .select("*")
    .eq("kid_id", kidId)
    .order("created_at", { ascending: false });
  const caregivers = (data ?? []).map((r) => ({ ...r, kid_name: kid.name }));
  return NextResponse.json({ caregivers });
}

// POST /api/ekid/caregivers — hai dạng body:
//   (a) { code } — NGƯỜI NHẬN nhập mã để tự liên kết.
//   (b) { kid_id, caregiver_user_id?, role } — CHỦ hồ sơ mời (hoặc tạo lời mời chờ bằng mã).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = (await req.json()) ?? {};
  const admin = createAdminClient();

  // ── Dạng (a): người nhận nhập mã liên kết ──
  if (typeof body.code === "string" && body.code.trim()) {
    const code = normalizeLinkCode(body.code);

    // Chỉ nhận lời mời CHƯA có người nhận (caregiver_user_id IS NULL) và còn 'pending'.
    const { data: pend } = await admin
      .from("ekid_caregivers")
      .select("*")
      .eq("link_code", code)
      .eq("status", "pending")
      .is("caregiver_user_id", null)
      .limit(1);
    const target = (pend ?? [])[0];
    if (!target) {
      // Mã đã tồn tại nhưng đã có người nhận / đã dùng → 409; hoàn toàn không có → 404.
      const { data: any } = await admin
        .from("ekid_caregivers")
        .select("id")
        .eq("link_code", code)
        .limit(1);
      if ((any ?? []).length) {
        return NextResponse.json({ error: "Mã đã được sử dụng" }, { status: 409 });
      }
      return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 404 });
    }

    // Gán người nhận + chuyển 'linked'. Điều kiện .is(NULL)/.eq('pending') chống
    // ghi đè khi hai người cùng nhập mã (race) — chỉ người thắng mới update được.
    const { data, error } = await admin
      .from("ekid_caregivers")
      .update({ caregiver_user_id: user.id, status: "linked" })
      .eq("id", target.id)
      .eq("status", "pending")
      .is("caregiver_user_id", null)
      .select("*")
      .maybeSingle();
    if (error) {
      // 23505 = user đã có dòng cho bé này → coi như đã liên kết.
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "Bạn đã liên kết hồ sơ này rồi" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Mã đã được sử dụng" }, { status: 409 });
    }
    return NextResponse.json({ caregiver: data });
  }

  // ── Dạng (b): chủ hồ sơ mời người thân ──
  const { kid_id, caregiver_user_id, role } = body as {
    kid_id?: string;
    caregiver_user_id?: string | null;
    role?: string;
  };
  if (!kid_id) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  // Chống IDOR: hồ sơ trẻ phải thuộc chính user đang đăng nhập.
  const { data: kid } = await admin
    .from("ekid_kids")
    .select("id")
    .eq("id", kid_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  // caregiver_user_id rỗng/không có → tạo LỜI MỜI CHỜ (NULL), giữ link_code để người nhận tự nhập.
  const invited =
    typeof caregiver_user_id === "string" && caregiver_user_id.trim()
      ? caregiver_user_id.trim()
      : null;

  const { data, error } = await admin
    .from("ekid_caregivers")
    .insert({
      kid_id,
      caregiver_user_id: invited,
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
