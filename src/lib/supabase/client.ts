import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions } from "@/lib/supabase/cookies";

export const createClient = () => {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "";
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Cùng options với server/middleware: domain `.nooi.net` ở production.
      cookieOptions: authCookieOptions(host),
    }
  );
};
