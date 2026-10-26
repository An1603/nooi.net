import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { authCookieOptions, OPC_HOST } from "@/lib/supabase/cookies";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const host = request.headers.get("host") || "";
  const laOpc = host === OPC_HOST;
  const next = searchParams.get("next") ?? (laOpc ? "/" : "/app");
  const origin = laOpc
    ? "https://opc.nooi.net"
    : process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net";
  const cookieOpts = authCookieOptions(host);
  const { name: _cookieName, ...baseCookieOptions } = cookieOpts;

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
              response.cookies.set(name, value, {
                ...baseCookieOptions,
                ...options,
                maxAge: 60 * 60 * 24 * 365,
                path: "/",
              })
            );
          },
        },
        cookieOptions: cookieOpts,
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