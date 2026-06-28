import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions } from "@/lib/supabase/cookies";

const COOKIE_NAMES = [
  "sb-gsnuqrutiauhnsacgzym-auth-token.0",
  "sb-gsnuqrutiauhnsacgzym-auth-token.1",
];

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

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
              httpOnly: true,
              path: "/",
            }))
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ALWAYS rewrite auth cookies with .nooi.net domain on every request
  // This ensures cookies set by client-side login get the correct domain
  for (const name of COOKIE_NAMES) {
    const cookie = request.cookies.get(name);
    if (cookie) {
      supabaseResponse.cookies.set(name, cookie.value, cookieOptions({
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
      }));
    }
  }

  return { supabase, supabaseResponse, user };
};