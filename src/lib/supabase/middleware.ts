import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  cookieOptions,
  authCookieName,
  authCookieChunkNames,
  AUTH_COOKIE_NAME,
  EKID_HOST,
} from "@/lib/supabase/cookies";

// Chunk cookie TÊN MẶC ĐỊNH (legacy) — dùng để dọn biến thể mồ côi trên host ekid.
const LEGACY_DEFAULT_CHUNKS = authCookieChunkNames(AUTH_COOKIE_NAME);

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  // Phiên eKid (ekid.nooi.net) là host-only + TÊN COOKIE RIÊNG → tách biệt hoàn
  // toàn với phiên nooi.net/app/admin, cả chiều GHI (không set domain) lẫn chiều
  // ĐỌC (không đọc chunk tên mặc định do người lớn đặt ở .nooi.net).
  const host = request.headers.get("host") || "";
  const isEkid = host === EKID_HOST;
  const hostOnly = isEkid;
  const cookieName = authCookieName(host);

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
      // storageKey = tên cookie → trên ekid chỉ đọc chunk `sb-ekid-auth-token*`,
      // KHÔNG bao giờ chạm cookie `sb-gsnuqrutiauhnsacgzym-auth-token*` của nooi.net.
      cookieOptions: { name: cookieName },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // User not authenticated — CLEAR auth cookies đang dùng trên host này.
    for (const name of authCookieChunkNames(cookieName)) {
      const cookie = request.cookies.get(name);
      if (cookie) {
        supabaseResponse.cookies.set(name, "", {
          ...cookieOptions({ path: "/", maxAge: 0 }, { hostOnly }),
          maxAge: 0,
        });
      }
    }

    // Trên host ekid: dọn thêm biến thể TÊN MẶC ĐỊNH cũ đang nằm HOST-ONLY trên
    // ekid (di sản của giai đoạn chuyển tiếp: tên mặc định + host-only). Cookie
    // tên mặc định ở scope `.nooi.net` thuộc về người lớn (nooi.net/app/admin) —
    // KHÔNG đụng tới để tránh đăng xuất người lớn (giữ nguyên hành vi nooi.net).
    if (isEkid) {
      for (const name of LEGACY_DEFAULT_CHUNKS) {
        if (request.cookies.get(name)) {
          supabaseResponse.cookies.set(name, "", {
            ...cookieOptions({ path: "/", maxAge: 0 }, { hostOnly: true }),
            maxAge: 0,
          });
        }
      }
    }
  }

  return { supabase, supabaseResponse, user };
};
