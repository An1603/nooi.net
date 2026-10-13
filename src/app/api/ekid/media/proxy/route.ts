import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchMediaForProxy } from "@/lib/ekid/media-validate";

// Cần Node runtime vì kiểm SSRF phải phân giải DNS (`node:dns`) + cần Buffer.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Hồ sơ bé tối thiểu cần cho phân quyền.
interface KidRow {
  id: string;
  user_id: string | null;
  child_user_id: string | null;
}

// Quyền GỌI: CHỦ hồ sơ (cha/mẹ) HOẶC chính TÀI KHOẢN CON của hồ sơ đó.
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

// ─── Giới hạn tần suất trong tiến trình (giống route memory: không phân tán) ───
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  // Dọn rác nhỏ: giữ map không phình vô hạn.
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

/**
 * GET /api/ekid/media/proxy?kid_id=<uuid>&url=<url>
 *
 * PHÁT LẠI ảnh từ domain mình (`ekid.nooi.net`). Vì sao cần: kiểm tra phía server ≠
 * môi trường trình duyệt của bé — tải trực tiếp từ host khác còn hỏng vì chặn hotlink
 * theo Referer, mixed content (trang https tải ảnh http bị trình duyệt chặn), đòi cookie,
 * URL hết hạn, host chặn theo vùng. Đi qua proxy thì trình duyệt chỉ nói chuyện với CHÍNH
 * MÌNH nên hết các rủi ro đó.
 *
 * Chỉ ẢNH (video dùng YouTube qua iframe). Dùng CHUNG bộ chặn SSRF + kiểm DNS của
 * `media-validate`. Quyền: chủ hồ sơ HOẶC tài khoản con. KHÔNG BAO GIỜ ném lỗi ra ngoài.
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

    if (rateLimited(user.id)) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu" }, { status: 429 });
    }

    const url = sp.get("url") ?? "";
    const result = await fetchMediaForProxy(url);
    if (!result.ok || !result.bytes) {
      return NextResponse.json({ error: "Không tải được nội dung" }, { status: 502 });
    }

    return new NextResponse(Buffer.from(result.bytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": result.contentType ?? "application/octet-stream",
        // Ảnh của phiên đứa trẻ: chỉ cache ở TRÌNH DUYỆT (private), không cho cache chung.
        "Cache-Control": "private, max-age=604800, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không tải được nội dung" }, { status: 502 });
  }
}
