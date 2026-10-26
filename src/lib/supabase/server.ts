import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { authCookieOptions } from "@/lib/supabase/cookies";

export const createClient = async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host") || "";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore
            // Middleware will refresh the session
          }
        },
      },
      // Cùng options với browser + middleware (domain `.nooi.net`).
      cookieOptions: authCookieOptions(host),
    }
  );
};
