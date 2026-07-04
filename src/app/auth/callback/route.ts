import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookieOptions } from "@/lib/supabase/cookies";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://nooi.net";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // After successful auth, try to apply referral code from cookie
      const refCookie = request.cookies.get("nooi_ref");
      if (refCookie?.value) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("referred_by")
              .eq("user_id", user.id)
              .maybeSingle();

            if (profile && !profile.referred_by) {
              // Look up ref code and set referred_by
              const adminClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
              );
              const { data: refUser } = await adminClient
                .rpc("lookup_ref_code", { code: refCookie.value.toUpperCase() });

              if (refUser && refUser !== user.id) {
                await adminClient
                  .from("profiles")
                  .update({ referred_by: refUser })
                  .eq("user_id", user.id)
                  .is("referred_by", null);
              }
            }
          }
        } catch (e) {
          console.warn("Referral auto-claim failed in callback:", e);
        }
      }

      // Clear the nooi_ref cookie
      response.cookies.set("nooi_ref", "", { path: "/", maxAge: 0 });

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}