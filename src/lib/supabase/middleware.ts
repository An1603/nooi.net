import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions } from "@/lib/supabase/cookies";

const COOKIE_NAMES = [
  "sb-gsnuqrutiauhnsacgzym-auth-token.0",
  "sb-gsnuqrutiauhnsacgzym-auth-token.1",
];

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  // Phiên eKid (ekid.nooi.net) là host-only → cookie KHÔNG dùng domain=.nooi.net,
  // tách biệt hoàn toàn với phiên nooi.net/app/admin.
  const host = request.headers.get("host") || "";
  const hostOnly = host === "ekid.nooi.net";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, cookieOptions({
              ...options,
              maxAge: 60 * 60 * 24 * 365,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            }, { hostOnly }))
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // User not authenticated — CLEAR auth cookies, don't rewrite them
    for (const name of COOKIE_NAMES) {
      const cookie = request.cookies.get(name);
      if (cookie) {
        supabaseResponse.cookies.set(name, "", {
          ...cookieOptions({ path: "/", maxAge: 0 }, { hostOnly }),
          maxAge: 0,
        });
      }
    }
  }

  return { supabase, supabaseResponse, user };
};
