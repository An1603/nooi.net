import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = ["/", "/login", "/signup", "/auth/callback", "/auth/confirm", "/auth/reset", "/auth/update-password"];

const ADMIN_HOST = "admin.nooi.net";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

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
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/admin-login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};