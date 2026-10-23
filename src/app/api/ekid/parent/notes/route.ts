import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownerKid, readKid } from "@/lib/ekid/access";

export const dynamic = "force-dynamic";

const KINDS = new Set(["muc_tieu", "noi_dung", "ghi_nhan", "danh_gia"]);

/** GET /api/ekid/parent/notes?kid_id= — người chăm sóc đọc được, để cùng theo dõi. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const kidId = new URL(req.url).searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });

  const kid = await readKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_parent_notes")
    .select("id, kind, body, rating, created_at")
    .eq("kid_id", kidId)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ notes: data ?? [] });
}

/**
 * POST /api/ekid/parent/notes  { kid_id, kind, body?, rating? }
 * Chỉ chủ hồ sơ (cha/mẹ) được ghi. Đánh giá dùng đúng 3 mức của TT 27/2020:
 * 1 = Cần cố gắng, 2 = Đạt, 3 = Tốt.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { kid_id?: string; kind?: string; body?: string; rating?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  if (!body.kid_id || !body.kind || !KINDS.has(body.kind)) {
    return NextResponse.json({ error: "kind phải là muc_tieu | noi_dung | ghi_nhan | danh_gia" }, { status: 400 });
  }

  const kid = await ownerKid(user.id, body.kid_id);
  if (!kid) return NextResponse.json({ error: "Chỉ phụ huynh sở hồ sơ được nhập" }, { status: 403 });

  const rating = body.rating ? Math.min(Math.max(Math.trunc(body.rating), 1), 3) : null;
  if (body.kind === "danh_gia" && !rating) {
    return NextResponse.json({ error: "Đánh giá cần rating 1–3" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ekid_parent_notes")
    .insert({
      kid_id: body.kid_id,
      kind: body.kind,
      body: body.body?.slice(0, 2000) ?? null,
      rating,
    })
    .select("id, kind, body, rating, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data });
}
