import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * SSO NOOI → GIS (gis.nooi.net)
 *
 * GET /api/sso/gis            → nếu đã đăng nhập: cấp token, chuyển về GIS
 *                             → nếu chưa: chuyển sang /login?redirect=...
 * GET /api/sso/gis?silent=1   → chưa đăng nhập thì quay về GIS với ?sso=none (không bắt đăng nhập)
 * GET /api/sso/gis?logout=1   → đăng xuất nooi.net rồi quay về GIS (đồng bộ trạng thái)
 *
 * Token: base64url(payload) + "." + HMAC-SHA256(payload, GIS_SSO_SECRET), hạn 3 phút.
 * GIS xác thực bằng cùng khoá bí mật — không cần gọi lại Supabase.
 */

const GIS = "https://gis.nooi.net";

/**
 * BẢO MẬT: chỉ nhận host trong danh sách trắng — không tin thẳng header
 * (nếu header bị giả, người dùng sẽ bị đưa sang trang đăng nhập giả).
 */
const ALLOWED_HOSTS = new Set([
  "nooi.net",
  "www.nooi.net",
  "app.nooi.net",
  "admin.nooi.net",
  "ekid.nooi.net",
  "opc.nooi.net",
]);

function publicOrigin(request: NextRequest): string {
  const raw = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();

  const host = ALLOWED_HOSTS.has(raw) ? raw : "nooi.net";
  return `https://${host}`;
}

function sign(payload: Record<string, unknown>, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function safeBack(raw: string | null): string {
  const back = raw || `${GIS}/`;
  return /^https:\/\/gis\.nooi\.net(\/|$|\?)/.test(back) ? back : `${GIS}/`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.GIS_SSO_SECRET || "";
  if (!secret) {
    return NextResponse.json(
      { error: "Chưa cấu hình GIS_SSO_SECRET trên nooi.net" },
      { status: 500 },
    );
  }

  const { searchParams, pathname, search } = request.nextUrl;
  const origin = publicOrigin(request);
  const back = safeBack(searchParams.get("back"));
  const silent = searchParams.get("silent") === "1";
  const logout = searchParams.get("logout") === "1";

  const supabase = await createClient();

  if (logout) {
    await supabase.auth.signOut();
    return NextResponse.redirect(back);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (silent) return NextResponse.redirect(`${GIS}/?sso=none`);
    const login = new URL("/login", origin);
    login.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(login);
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;

  // Ảnh đại diện: ưu tiên ảnh người dùng tự đặt trong hồ sơ NOOI,
  // không có thì lấy ảnh từ Google (avatar_url / picture trong user_metadata).
  let anh = "";
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("public_avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    const tuHoSo = String(prof?.public_avatar_url || "").trim();
    if (/^https?:\/\//.test(tuHoSo)) anh = tuHoSo;
  } catch {
    /* không có bảng/hồ sơ: bỏ qua, dùng ảnh Google */
  }
  if (!anh) {
    const g = String(meta.avatar_url || meta.picture || "").trim();
    if (/^https?:\/\//.test(g)) anh = g;
  }

  const token = sign(
    {
      u: user.id,
      e: user.email || "",
      n: (meta.full_name as string) || (meta.name as string) || "",
      ...(anh ? { a: anh } : {}),
      x: Math.floor(Date.now() / 1000) + 180,
    },
    secret,
  );

  return NextResponse.redirect(`${GIS}/auth.html?t=${encodeURIComponent(token)}`);
}
