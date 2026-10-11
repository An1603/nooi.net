import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = ["/", "/login", "/signup", "/gallery", "/auth/callback", "/auth/confirm", "/auth/reset", "/auth/update-password", "/api/migrate", "/u"];

const ADMIN_HOST = "admin.nooi.net";
const EKID_HOST = "ekid.nooi.net";

/** Host riêng cho phân hệ eKid của bé. */
function isEkidHost(host: string): boolean {
  return host === EKID_HOST;
}

/**
 * Kiểm tra user hiện tại có phải tài khoản CON không (ekid_kids.child_user_id = user.id).
 * Fail-safe (C2): nếu query lỗi/ngoại lệ → trả false (coi như KHÔNG phải con) để không
 * chặn nhầm NGƯỜI LỚN ở nhánh host nooi. RLS cho con đọc dòng của mình nằm ở migration
 * 20261011000011_ekid_child_read.sql.
 */
async function isChildUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("ekid_kids")
      .select("id")
      .eq("child_user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[middleware] isChildUser query lỗi:", error.message);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error("[middleware] isChildUser ngoại lệ:", err);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  /* ── eKid subdomain guard (đặt trước admin để host ekid không bị admin/main chặn) ── */
  if (isEkidHost(host)) {
    // Manifest RIÊNG của eKid: host ekid phục vụ /ekid-manifest.json khi trình duyệt
    // (hoặc Next metadata) yêu cầu /manifest.json — GIỮ URL /manifest.json.
    // Đặt SỚM, trước mọi kiểm tra auth, để manifest luôn public (trình duyệt tải khi cài PWA).
    if (pathname === "/manifest.json") {
      return NextResponse.rewrite(new URL("/ekid-manifest.json", request.url));
    }
    // Truy cập trực tiếp file manifest eKid → luôn cho qua (public, kể cả chưa đăng nhập).
    if (pathname === "/ekid-manifest.json") return supabaseResponse;

    // URL ngắn /login trên host ekid → REWRITE nội bộ sang /ekid/login
    // (GIỮ URL /login trên thanh địa chỉ, KHÔNG redirect). Vẫn dùng trang đăng nhập
    // của con — KHÔNG hiện login người lớn (M3).
    if (pathname === "/login") {
      return NextResponse.rewrite(new URL("/ekid/login", request.url));
    }

    // Trang đăng nhập của con (đường dẫn gốc, back-compat) → cho qua, không cần auth
    if (pathname === "/ekid/login") return supabaseResponse;

    // (C) Passthrough CHỈ những /api mà phân hệ con thực sự cần, KHÔNG rewrite
    // sang /ekid+path (nếu không sẽ thành /ekid/api/... → 404):
    //   - /api/ekid/*  → API riêng của phân hệ con
    //   - /api/voice/* → endpoint token giọng nói (EkidVoiceSession → VoiceAssistant
    //                    → useVoiceAssistant gọi /api/voice/token)
    // Mọi /api KHÁC trên host ekid (ví dụ /api/ai-mentor/chat, /api/upload/avatar,
    // /api/ref-code/change, /api/telegram/send — route của app người lớn) KHÔNG
    // được passthrough: chúng rơi vào nhánh dưới (redirect login hoặc rewrite
    // /ekid/... → 404) nên bị chặn, không lộ trên ekid.nooi.net.
    if (pathname.startsWith("/api/ekid") || pathname.startsWith("/api/voice")) {
      return supabaseResponse;
    }

    // Chưa đăng nhập → về URL ngắn /login (giữ nguyên path + query để quay lại sau login)
    // LƯU Ý (I1): KHÔNG cho qua /ekid/* trước khi kiểm auth như bản cũ.
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // Đã đăng nhập: tài khoản CON
    if (await isChildUser(supabase, user.id)) {
      // Đã đúng path /ekid/* (đã qua auth) → để nguyên
      if (pathname.startsWith("/ekid")) return supabaseResponse;
      // Path khác trên host ekid → rewrite nội bộ sang /ekid + path, GIỮ query string (M1)
      const target = "/ekid" + (pathname === "/" ? "" : pathname) + request.nextUrl.search;
      return NextResponse.rewrite(new URL(target, request.url));
    }

    // Người lớn → chuyển về app người lớn
    return NextResponse.redirect(new URL("https://nooi.net/app/ekid"));
  }

  /* ── Admin subdomain guard ── */
  if (host === ADMIN_HOST) {
    // Allow auth-related routes without admin check
    const isAuthRoute = ["/auth/callback", "/auth/confirm"].some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    if (isAuthRoute) return supabaseResponse;

    // Admin login page — allow without auth, redirect /login to it
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }
    if (pathname === "/admin-login") return supabaseResponse;

    // Not logged in → show admin login
    if (!user) {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    // Check admin role
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminUser) {
      const resp = NextResponse.redirect(new URL("/admin-login", request.url));
      resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.0", "", { maxAge: 0, path: "/" });
      resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.1", "", { maxAge: 0, path: "/" });
      return resp;
    }

    // Admin confirmed — allow
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return supabaseResponse;
  }

  /* ── Main site guard ── */
  // Con không vào app người lớn → chuyển sang phân hệ eKid
  if (user && (await isChildUser(supabase, user.id))) {
    return NextResponse.redirect(new URL("https://ekid.nooi.net"));
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/admin-login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Nếu đã login mà vào login/signup → redirect về dashboard
    if ((pathname === "/login" || pathname === "/signup") && user) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    // Prevent caching of protected pages
    const resp = NextResponse.redirect(loginUrl);
    resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    resp.headers.set("Pragma", "no-cache");
    resp.headers.set("Expires", "0");
    return resp;
  }

  // Add no-cache headers for all /app routes
  if (pathname.startsWith("/app")) {
    supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};