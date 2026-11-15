import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ho-so/anh?u=<uuid>  →  { "anh": "https://…" }  (rỗng nếu chưa có ảnh)
 *
 * Mục đích: cho gis.nooi.net lấy **ảnh đại diện mới nhất** của người dùng mà không
 * bắt họ đăng nhập lại.
 *
 * BẢO MẬT: chỉ trả ĐÚNG một trường — đường dẫn ảnh đại diện công khai (ảnh nằm trong
 * kho `avatars` vốn đã cho đọc công khai). Không trả tên, email, uid hay dữ liệu nào
 * khác; `u` phải đúng định dạng UUID; phản hồi được cache ngắn để chặn gọi dồn dập.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_STORE = { "Cache-Control": "no-store" };
const CACHE_NGAN = { "Cache-Control": "public, max-age=120" };

export async function GET(request: NextRequest) {
  const u = (request.nextUrl.searchParams.get("u") || "").trim();
  if (!UUID.test(u)) {
    return NextResponse.json({ anh: "" }, { status: 400, headers: NO_STORE });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    return NextResponse.json({ anh: "" }, { status: 500, headers: NO_STORE });
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("profiles")
    .select("public_avatar_url")
    .eq("user_id", u)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ anh: "" }, { status: 500, headers: NO_STORE });
  }

  const raw = String((data as { public_avatar_url?: string | null } | null)?.public_avatar_url || "").trim();
  const anh = /^https?:\/\//.test(raw) ? raw : "";

  return NextResponse.json({ anh }, { headers: CACHE_NGAN });
}