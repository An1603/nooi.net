import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookieOptions } from "@/lib/supabase/cookies";

/**
 * GET /auth/refresh-domain
 *
 * Refreshes auth cookies with .nooi.net domain so they work across subdomains.
 * Admin panel redirects here when user appears unauthenticated due to old cookie domain.
 */
export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get("redirect") || "/admin";
  const fallback = request.nextUrl.searchParams.get("fallback") || "/login";

  const response = NextResponse.redirect(
    new URL(redirect, "https://admin.nooi.net")
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, cookieOptions({
              ...options,
              maxAge: 60 * 60 * 24 * 365,
              httpOnly: true,
              path: "/",
            }))
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in at all → redirect to login
    return NextResponse.redirect(
      new URL(`${fallback}?redirect=${encodeURIComponent(redirect)}`, "https://nooi.net")
    );
  }

  // User IS logged in on nooi.net — cookies will be rewritten with .nooi.net domain
  // and user will be redirected to admin panel
  return response;
}