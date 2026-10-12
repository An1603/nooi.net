import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateMediaUrl } from "@/lib/ekid/media-validate";

export const dynamic = "force-dynamic";

/**
 * GET /api/ekid/media/validate?url=<url>
 *
 * Kiểm tra một link ảnh/video TRƯỚC khi client render lên sân khấu của bé.
 * Quyền: chỉ cần ĐĂNG NHẬP (chỉ kiểm tra URL công khai, không đụng dữ liệu hồ sơ).
 * Trả về `{ ok, kind:"image"|"video"|null, contentType }`.
 * Mọi lỗi (URL sai, mạng, timeout) đều gói gọn thành `{ ok:false }` — KHÔNG ném ra ngoài.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const url = new URL(req.url).searchParams.get("url") ?? "";
    const result = await validateMediaUrl(url);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, kind: null, contentType: null });
  }
}
