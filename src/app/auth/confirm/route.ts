import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookieOptions } from "@/lib/supabase/cookies";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/app";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net";

  if (token_hash && type) {
    const response = NextResponse.redirect(`${origin}${next}?verified=true`);

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

    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "email" | "recovery" | "invite",
      token_hash,
    });

    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/login?error=Xác thực thất bại.`);
}