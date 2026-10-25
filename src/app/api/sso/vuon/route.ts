import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * SSO NOOI → Vườn (vuon.nooi.net)
 *
 * GET /api/sso/vuon            → nếu đã đăng nhập: cấp token, chuyển về Vườn
 *                              → nếu chưa: chuyển sang /login?redirect=...
 * GET /api/sso/vuon?silent=1   → chưa đăng nhập thì quay về Vườn với ?sso=none (không bắt đăng nhập)
 * GET /api/sso/vuon?logout=1   → đăng xuất nooi.net rồi quay về Vườn (đồng bộ trạng thái)
 *
 * Token: base64url(payload) + "." + HMAC-SHA256(payload, VUON_SSO_SECRET), hạn 3 phút.
 * Vườn xác thực bằng cùng khoá bí mật — không cần gọi lại Supabase.
 */

const VUON = "https://vuon.nooi.net";

function sign(payload: Record<string, unknown>, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function safeBack(raw: string | null): string {
  const back = raw || `${VUON}/`;
  return /^https:\/\/vuon\.nooi\.net(\/|$|\?)/.test(back) ? back : `${VUON}/`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.VUON_SSO_SECRET || "";
  if (!secret) {
    return NextResponse.json(
      { error: "Chưa cấu hình VUON_SSO_SECRET trên nooi.net" },
      { status: 500 },
    );
  }

  const { searchParams, pathname, search } = request.nextUrl;
  // Sau Traefik, origin nội bộ là localhost:3000 → dựng lại địa chỉ công khai
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "nooi.net";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;
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
    if (silent) return NextResponse.redirect(`${VUON}/?sso=none`);
    const login = new URL("/login", origin);
    login.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(login);
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const token = sign(
    {
      u: user.id,
      e: user.email || "",
      n: (meta.full_name as string) || (meta.name as string) || "",
      x: Math.floor(Date.now() / 1000) + 180,
    },
    secret,
  );

  return NextResponse.redirect(`${VUON}/auth.html?t=${encodeURIComponent(token)}`);
}
