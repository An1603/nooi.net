import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateMediaUrl } from "@/lib/ekid/media-validate";

// Cần Node runtime vì kiểm SSRF phải phân giải DNS (`node:dns`).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Hồ sơ bé tối thiểu cần cho phân quyền.
interface KidRow {
  id: string;
  user_id: string | null;
  child_user_id: string | null;
}

// Quyền GỌI: CHỦ hồ sơ (cha/mẹ) HOẶC chính TÀI KHOẢN CON của hồ sơ đó (giống memory route).
async function permittedKid(userId: string, kidId: string): Promise<KidRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ekid_kids")
    .select("id, user_id, child_user_id")
    .eq("id", kidId)
    .maybeSingle();
  if (!data) return null;
  const kid = data as KidRow;
  if (kid.user_id === userId || kid.child_user_id === userId) return kid;
  return null;
}

/**
 * GET /api/ekid/media/validate?kid_id=<uuid>&url=<url>
 *
 * Kiểm tra một link ảnh/video TRƯỚC khi client render lên sân khấu của bé.
 * Quyền: phải là CHỦ hồ sơ HOẶC tài khoản con của `kid_id` → 403 nếu khác (thu hẹp
 * nguồn tấn công cho endpoint SSRF). Trả về `{ ok, kind:"image"|"video"|null, contentType }`.
 * Mọi lỗi (URL sai, mạng, timeout) đều gói gọn thành `{ ok:false }` — KHÔNG ném ra ngoài.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const sp = new URL(req.url).searchParams;

    const kidId = (sp.get("kid_id") ?? "").trim();
    if (!UUID_RE.test(kidId)) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
    }

    const kid = await permittedKid(user.id, kidId);
    if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

    const url = sp.get("url") ?? "";
    const result = await validateMediaUrl(url);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, kind: null, contentType: null });
  }
}
