import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  authCookieOptions,
  authCookieName,
  authCookieNames,
  AUTH_COOKIE_NAME,
  EKID_HOST,
  OPC_HOST,
} from "@/lib/supabase/cookies";

// Cookie legacy cần dọn:
// - `sb-opc-auth-token*`: phiên OPC tách riêng thời kỳ đầu (host-only).
// - tên mặc định host-only trên ekid: di sản giai đoạn chuyển tiếp.
const LEGACY_OPC_CHUNKS = authCookieNames("sb-opc-auth-token");
const LEGACY_DEFAULT_CHUNKS = authCookieNames(AUTH_COOKIE_NAME);

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const host = request.headers.get("host") || "";
  const isEkid = host === EKID_HOST;
  const isOpc = host === OPC_HOST;

  // eKid: host-only + tên riêng → tách hoàn toàn khỏi người lớn.
  // OPC: DÙNG CHUNG cookie `.nooi.net` với nooi.net/app/admin (SSO thật).
  const cookieName = authCookieName(host);
  const cookieOpts = authCookieOptions(host);
  const { name: _cookieName, ...baseCookieOptions } = cookieOpts;

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
            supabaseResponse.cookies.set(name, value, {
              ...baseCookieOptions,
              ...options,
              path: "/",
              maxAge: 60 * 60 * 24 * 365,
            })
          );
        },
      },
      // storageKey = tên cookie. Trên ekid chỉ đọc `sb-ekid-auth-token*`,
      // không bao giờ chạm cookie `.nooi.net` của người lớn.
      cookieOptions: cookieOpts,
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Xoá phiên đang dùng trên host này (cả bản gốc lẫn chunk).
    for (const name of authCookieNames(cookieName)) {
      if (request.cookies.get(name)) {
        supabaseResponse.cookies.set(name, "", {
          ...baseCookieOptions,
          maxAge: 0,
        });
      }
    }

    if (isOpc) {
      // Dọn phiên OPC cũ (host-only) để không còn hai biến thể cùng tồn tại.
      for (const name of LEGACY_OPC_CHUNKS) {
        if (request.cookies.get(name)) {
          supabaseResponse.cookies.set(name, "", { path: "/", maxAge: 0 });
        }
      }
      // Dọn biến thể host-only của tên mặc định (lỗi cũ client ghi thiếu domain).
      for (const name of LEGACY_DEFAULT_CHUNKS) {
        if (request.cookies.get(name)) {
          supabaseResponse.cookies.set(name, "", { path: "/", maxAge: 0 });
        }
      }
    }

    if (isEkid) {
      // Chỉ dọn biến thể host-only trên ekid; KHÔNG đụng cookie `.nooi.net`.
      for (const name of LEGACY_DEFAULT_CHUNKS) {
        if (request.cookies.get(name)) {
          supabaseResponse.cookies.set(name, "", {
            path: "/",
            maxAge: 0,
          });
        }
      }
    }
  }

  return { supabase, supabaseResponse, user };
};
