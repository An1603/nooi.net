import { createBrowserClient } from "@supabase/ssr";
import { authCookieName } from "@/lib/supabase/cookies";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Trên host ekid dùng tên cookie riêng → trình duyệt không gửi/đọc cookie
      // `.nooi.net` của người lớn.
      cookieOptions: {
        name: authCookieName(
          typeof window !== "undefined" ? window.location.hostname : ""
        ),
      },
    }
  );
