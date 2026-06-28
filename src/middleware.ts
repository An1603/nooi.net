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
    // Allow auth-related routes without admin check (for OAuth callback, etc.)
    const isAuthRoute = ["/auth/callback", "/auth/confirm", "/auth/reset", "/auth/update-password"].some(
      (route) => pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route + "?")
    );
    if (isAuthRoute) {
      return supabaseResponse;
    }

    // Redirect /login and /signup to main site
    if (pathname === "/login" || pathname === "/signup") {
      return NextResponse.redirect(new URL(pathname, "https://nooi.net"));
    }

    // Not logged in (or cookie domain mismatch) → refresh domain then retry
    if (!user) {
      const refreshUrl = new URL("/auth/refresh-domain", "https://nooi.net");
      refreshUrl.searchParams.set("redirect", pathname || "/admin");
      return NextResponse.redirect(refreshUrl);
    }

    // Check admin role via admin_users table
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminUser) {
      return new NextResponse(
        `<html><body style="background:#0a0a0a;color:#f87171;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h1 style="font-size:3rem;margin:0">403</h1><p>Bạn không có quyền truy cập trang quản trị.</p><a href="https://nooi.net/app" style="color:#c8943e">Về trang chủ</a></div></body></html>`,
        { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Admin confirmed → allow
    // Rewrite root to /admin
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return supabaseResponse;
  }

  /* ── Main site guard ── */
  // Block /admin routes on main site
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow public routes without auth
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Protect dashboard routes
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
