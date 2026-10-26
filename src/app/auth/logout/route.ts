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
 * Xoá cookie theo đúng scope.
 *
 * Không set cả domain `.nooi.net` lẫn host-only cho CÙNG một tên trong một
 * response: `ResponseCookies` gộp theo name+path nên bản sau ghi đè bản trước,
 * và cookie domain không bao giờ được xoá. Phiên cũ của OPC dùng tên riêng
 * `sb-opc-auth-token` nên vẫn dọn được ở scope host-only.
 */
function xoaCookie(
  resp: NextResponse,
  names: string[],
  domain?: string
) {
  for (const name of names) {
    resp.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: true,
      sameSite: "lax",
      ...(domain ? { domain } : {}),
    });
  }
}

/** Xoá phiên chung `.nooi.net` — đăng xuất OPC cũng đăng xuất nooi.net. */
function xoaPhienChung(resp: NextResponse) {
  xoaCookie(resp, SHARED_COOKIES, ".nooi.net");
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET() {
  // Đăng xuất phải là POST: tránh prefetch/GET link tự động đá phiên.
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
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
    xoaCookie(resp, LEGACY_OPC_COOKIES);
    return resp;
  }

  // eKid host → về trang đăng nhập CỦA CON + xóa cookie phiên RIÊNG của ekid
  // (tên sb-ekid-auth-token), không đụng phiên người lớn.
  if (host === "ekid.nooi.net") {
    const resp = NextResponse.redirect(new URL("/login", "https://ekid.nooi.net"));
    // Chỉ xoá phiên eKid, không đụng phiên người lớn.
    xoaCookie(resp, EKID_COOKIES);
    return resp;
  }

  const resp = NextResponse.redirect(new URL("/", siteUrl));
  xoaPhienChung(resp);
  return resp;
}
