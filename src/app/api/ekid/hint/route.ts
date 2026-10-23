import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeKid } from "@/lib/ekid/access";
import { loadItems, openNextHint } from "@/lib/ekid/plan-server";

export const dynamic = "force-dynamic";

/**
 * POST /api/ekid/hint  { kid_id, session_id, item_id }
 * Mở bậc gợi ý kế tiếp (1→4). Server quyết bậc, client không tự tăng.
 * Đây là nguồn duy nhất ghi ekid_hint_log → dùng để tính "đúng khi không gợi ý".
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { kid_id?: string; session_id?: string; item_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }

  const { kid_id, session_id, item_id } = body;
  if (!kid_id || !session_id || !item_id) {
    return NextResponse.json({ error: "Thiếu kid_id / session_id / item_id" }, { status: 400 });
  }

  const kid = await writeKid(user.id, kid_id);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  // Lấy câu hỏi từ DB để lấy đúng thang gợi ý đã soạn — không cho client gửi nội dung gợi ý.
  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  const { data: item } = await admin
    .from("ekid_items")
    .select("id, lesson_id")
    .eq("id", item_id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

  const items = await loadItems(item.lesson_id as string);
  const full = items.find((i) => i.id === item_id);
  if (!full) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

  const hint = await openNextHint({ kidId: kid_id, sessionId: session_id, item: full });
  return NextResponse.json(hint);
}
