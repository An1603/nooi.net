import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  EKID_AUTH_COOKIE_NAME,
  authCookieNames,
} from "@/lib/supabase/cookies";

const SHARED_COOKIES = authCookieNames(AUTH_COOKIE_NAME);
const EKID_COOKIES = authCookieNames(EKID_AUTH_COOKIE_NAME);
const LEGACY_OPC_COOKIES = authCookieNames("sb-opc-auth-token");

/**
 * Xoá cookie bằng header thô. Phải append thủ công vì `resp.cookies.set`
 * gộp theo name+path: lần set host-only sẽ ghi đè lần set domain `.nooi.net`,
 * khiến cookie domain không bao giờ được xoá.
 */
function xoaCookieRaw(
  resp: NextResponse,
  names: string[],
  domain?: string
) {
  for (const name of names) {
    const parts = [
      `${name}=`,
      "Path=/",
      "Max-Age=0",
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "Secure",
      "SameSite=Lax",
    ];
    if (domain) parts.push(`Domain=${domain}`);
    resp.headers.append("Set-Cookie", parts.join("; "));
  }
}

/** Xoá cả bản `.nooi.net` lẫn bản host-only (di sản lỗi cũ). */
function xoaPhienChung(resp: NextResponse) {
  xoaCookieRaw(resp, SHARED_COOKIES, ".nooi.net");
  xoaCookieRaw(resp, SHARED_COOKIES);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

async function handleLogout(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");

  const host = request.headers.get("host") || "";

  // Admin host → redirect to admin login
  if (host === "admin.nooi.net") {
    const resp = NextResponse.redirect(new URL("/admin-login", `https://admin.nooi.net`));
    xoaPhienChung(resp);
    return resp;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net";

  // OPC Center host → về trang đăng nhập OPC; xoá phiên CHUNG `.nooi.net`
  // (đăng xuất OPC cũng đăng xuất nooi.net) + dọn phiên OPC cũ.
  if (host === "opc.nooi.net") {
    const resp = NextResponse.redirect(new URL("/login", "https://opc.nooi.net"));
    xoaPhienChung(resp);
    xoaCookieRaw(resp, LEGACY_OPC_COOKIES);
    return resp;
  }

  // eKid host → về trang đăng nhập CỦA CON + xóa cookie phiên RIÊNG của ekid
  // (tên sb-ekid-auth-token), không đụng phiên người lớn.
  if (host === "ekid.nooi.net") {
    const resp = NextResponse.redirect(new URL("/login", "https://ekid.nooi.net"));
    // Chỉ xoá phiên eKid, không đụng phiên người lớn.
    xoaCookieRaw(resp, EKID_COOKIES);
    return resp;
  }

  const resp = NextResponse.redirect(new URL("/", siteUrl));
  xoaPhienChung(resp);
  return resp;
}
