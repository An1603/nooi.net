import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = ["/api/sso", "/", "/login", "/signup", "/gallery", "/auth/callback", "/auth/confirm", "/auth/reset", "/auth/update-password", "/api/migrate", "/u"];

const ADMIN_HOST = "admin.nooi.net";
const EKID_HOST = "ekid.nooi.net";
const OPC_HOST = "opc.nooi.net";

/** Host riêng cho phân hệ eKid của bé. */
function isEkidHost(host: string): boolean {
  return host === EKID_HOST;
}

/**
 * (I-A) Sao chép toàn bộ cookie (refresh/clear phiên) từ response gốc `src`
 * (supabaseResponse do `updateSession` trả về) sang một `NextResponse` MỚI.
 *
 * Lý do: khi middleware trả `NextResponse.redirect(...)` / `NextResponse.rewrite(...)`,
 * `updateSession` đã ghi cookie phiên (đã refresh hoặc đã clear) lên `supabaseResponse`
 * NHƯNG response mới KHÔNG tự kế thừa các cookie đó → refresh token bị nuốt → con có
 * thể bị đăng xuất bất ngờ trên các request bị rewrite (vd `/` → `/ekid`, `/hoc/x` →
 * `/ekid/hoc/x`). Bọc MỌI redirect/rewrite qua helper này để phiên được giữ bền.
 */
function withCookies(res: NextResponse, src: NextResponse): NextResponse {
  const cookies = src.cookies?.getAll?.() ?? [];
  cookies.forEach((c) => res.cookies.set(c));
  return res;
}

/**
 * Lấy hồ sơ bé gắn với TÀI KHOẢN CON (ekid_kids.child_user_id = user.id).
 * Trả `{ id, status }` hoặc null. Fail-safe (C2): query lỗi/ngoại lệ → null
 * (coi như KHÔNG phải con) để không chặn nhầm NGƯỜI LỚN ở nhánh host nooi.
 */
async function getChildKid(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string; status: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from("ekid_kids")
      .select("id, status")
      .eq("child_user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[middleware] getChildKid query lỗi:", error.message);
      return null;
    }
    return (data as { id: string; status: string | null } | null) ?? null;
  } catch (err) {
    console.error("[middleware] getChildKid ngoại lệ:", err);
    return null;
  }
}

/**
 * Kiểm tra user hiện tại có phải tài khoản CON không (ekid_kids.child_user_id = user.id).
 * Fail-safe (C2): nếu query lỗi/ngoại lệ → trả false (coi như KHÔNG phải con) để không
 * chặn nhầm NGƯỜI LỚN ở nhánh host nooi. RLS cho con đọc dòng của mình nằm ở migration
 * 20261011000011_ekid_child_read.sql.
 */
async function isChildUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  return !!(await getChildKid(supabase, userId));
}

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  /* ── eKid subdomain guard (đặt trước admin để host ekid không bị admin/main chặn) ── */
  if (isEkidHost(host)) {
    // Manifest RIÊNG của eKid: host ekid phục vụ /ekid-manifest.json khi trình duyệt
    // (hoặc Next metadata) yêu cầu /manifest.json — GIỮ URL /manifest.json.
    // Đặt SỚM, trước mọi kiểm tra auth, để manifest luôn public (trình duyệt tải khi cài PWA).
    if (pathname === "/manifest.json") {
      return withCookies(NextResponse.rewrite(new URL("/ekid-manifest.json", request.url)), supabaseResponse);
    }
    // Truy cập trực tiếp file manifest eKid → luôn cho qua (public, kể cả chưa đăng nhập).
    if (pathname === "/ekid-manifest.json") return supabaseResponse;

    // URL ngắn /login trên host ekid → REWRITE nội bộ sang /ekid/login
    // (GIỮ URL /login trên thanh địa chỉ, KHÔNG redirect). Vẫn dùng trang đăng nhập
    // của con — KHÔNG hiện login người lớn (M3).
    if (pathname === "/login") {
      return withCookies(NextResponse.rewrite(new URL("/ekid/login", request.url)), supabaseResponse);
    }

    // Trang đăng nhập của con (đường dẫn gốc, back-compat) → cho qua, không cần auth
    if (pathname === "/ekid/login") return supabaseResponse;

    // (C) Passthrough CHỈ những /api mà phân hệ con thực sự cần, KHÔNG rewrite
    // sang /ekid+path (nếu không sẽ thành /ekid/api/... → 404):
    //   - /api/ekid/*  → API riêng của phân hệ con
    //   - /api/voice/* → endpoint token giọng nói (EkidVoiceSession → VoiceAssistant
    //                    → useVoiceAssistant gọi /api/voice/token)
    // Mọi /api KHÁC trên host ekid (ví dụ /api/ai-mentor/chat, /api/upload/avatar,
    // /api/ref-code/change, /api/telegram/send — route của app người lớn) KHÔNG
    // được passthrough: chúng rơi vào nhánh dưới (redirect login hoặc rewrite
    // /ekid/... → 404) nên bị chặn, không lộ trên ekid.nooi.net.
    if (pathname.startsWith("/api/ekid") || pathname.startsWith("/api/voice")) {
      return supabaseResponse;
    }

    // Đăng xuất (form POST trong layout con gọi /auth/logout) — phải đi qua nguyên vẹn,
    // nếu không sẽ bị rewrite thành /ekid/auth/logout → 404.
    if (pathname.startsWith("/auth/logout")) {
      return supabaseResponse;
    }

    // Chưa đăng nhập → về URL ngắn /login (giữ nguyên path + query để quay lại sau login)
    // LƯU Ý (I1): KHÔNG cho qua /ekid/* trước khi kiểm auth như bản cũ.
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return withCookies(NextResponse.redirect(loginUrl), supabaseResponse);
    }

    // Đã đăng nhập: tài khoản CON
    const child = await getChildKid(supabase, user.id);
    if (child) {
      // (3.1) Tài khoản con bị KHOÁ → rewrite sang trang tạm khoá /ekid/khoa.
      // Cho chính /ekid/khoa đi qua để tránh vòng lặp rewrite vô hạn.
      if (child.status === "khoa" && !pathname.startsWith("/ekid/khoa")) {
        return withCookies(NextResponse.rewrite(new URL("/ekid/khoa", request.url)), supabaseResponse);
      }
      // Đã đúng path /ekid/* (đã qua auth) → để nguyên
      if (pathname.startsWith("/ekid")) return supabaseResponse;
      // URL ngắn /bai-hoc trên host ekid → REWRITE sang /ekid/bai-hoc (GIỮ URL
      // /bai-hoc trên thanh địa chỉ, giống /login). Thư viện bài học tách riêng.
      if (pathname === "/bai-hoc") {
        return withCookies(NextResponse.rewrite(new URL("/ekid/bai-hoc", request.url)), supabaseResponse);
      }
      // Path khác trên host ekid → rewrite nội bộ sang /ekid + path, GIỮ query string (M1)
      const target = "/ekid" + (pathname === "/" ? "" : pathname) + request.nextUrl.search;
      return withCookies(NextResponse.rewrite(new URL(target, request.url)), supabaseResponse);
    }

    // Người lớn → chuyển về app người lớn
    return withCookies(NextResponse.redirect(new URL("https://nooi.net/app/ekid")), supabaseResponse);
  }

  /* ── Admin subdomain guard ── */
  if (host === ADMIN_HOST) {
    // Allow auth-related routes without admin check
    const isAuthRoute = ["/auth/callback", "/auth/confirm"].some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    if (isAuthRoute) return supabaseResponse;

    // Admin login page — allow without auth, redirect /login to it
    if (pathname === "/login") {
      const veDangNhap = new URL("/admin-login", request.url);
      veDangNhap.searchParams.set("next", pathname);
      return withCookies(NextResponse.redirect(veDangNhap), supabaseResponse);
    }
    if (pathname === "/admin-login") return supabaseResponse;

    // Not logged in → show admin login
    if (!user) {
      const veDangNhap = new URL("/admin-login", request.url);
      veDangNhap.searchParams.set("next", pathname);
      return withCookies(NextResponse.redirect(veDangNhap), supabaseResponse);
    }

    // Check admin role
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminUser) {
      const veDangNhap3 = new URL("/admin-login", request.url);
      veDangNhap3.searchParams.set("next", pathname);
      const resp = withCookies(NextResponse.redirect(veDangNhap3), supabaseResponse);
      // Đặt sau khi sao chép để CÁC LỆNH CLEAR này THẮNG (đăng xuất phiên không phải admin).
      resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.0", "", { maxAge: 0, path: "/" });
      resp.cookies.set("sb-gsnuqrutiauhnsacgzym-auth-token.1", "", { maxAge: 0, path: "/" });
      return resp;
    }

    // Admin confirmed — allow
    if (pathname === "/") {
      return withCookies(NextResponse.redirect(new URL("/admin", request.url)), supabaseResponse);
    }

    return supabaseResponse;
  }

  /* ── OPC Center subdomain guard ── */
  // opc.nooi.net là nền tảng vận hành OPC Center. URL công khai ngắn (/leads,
  // /cong-dong…) được rewrite nội bộ sang /opc/*, giữ nguyên thanh địa chỉ.
  if (host === OPC_HOST) {
    if (pathname === "/manifest.json") {
      return withCookies(NextResponse.rewrite(new URL("/opc-manifest.json", request.url)), supabaseResponse);
    }
    if (pathname === "/opc-manifest.json") return supabaseResponse;

    // Auth + API riêng của OPC đi nguyên vẹn.
    if (pathname.startsWith("/auth/")) return supabaseResponse;
    if (pathname.startsWith("/api/opc")) return supabaseResponse;

    // Đăng nhập dùng chung trang /login của nooi.net.
    if (pathname === "/login") {
      if (user) return withCookies(NextResponse.redirect(new URL("/", request.url)), supabaseResponse);
      // Không tự thêm ?redirect=/ — tránh 307 vô ích; form đăng nhập tự về "/".
      return supabaseResponse;
    }

    // Đăng ký mới → về trang đăng ký của nooi.net, quay lại OPC sau khi xong.
    if (pathname === "/signup") {
      return withCookies(NextResponse.redirect(new URL("https://nooi.net/signup")), supabaseResponse);
    }

    // Không lộ khu quản trị chung trên host OPC.
    if (pathname.startsWith("/admin")) {
      return withCookies(NextResponse.redirect(new URL("/", request.url)), supabaseResponse);
    }

    // Chưa đăng nhập → về /login, giữ đường dẫn để quay lại.
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return withCookies(NextResponse.redirect(loginUrl), supabaseResponse);
    }

    // Đã ở đúng path nội bộ /opc/* → cho qua.
    if (pathname === "/opc" || pathname.startsWith("/opc/")) return supabaseResponse;

    // URL ngắn → rewrite sang /opc + path, giữ query.
    const target = "/opc" + (pathname === "/" ? "" : pathname) + request.nextUrl.search;
    return withCookies(NextResponse.rewrite(new URL(target, request.url)), supabaseResponse);
  }

  /* ── Main site guard ── */
  // Con không vào app người lớn → chuyển sang phân hệ eKid
  if (user && (await isChildUser(supabase, user.id))) {
    return withCookies(NextResponse.redirect(new URL("https://ekid.nooi.net")), supabaseResponse);
  }

  if (pathname.startsWith("/admin")) {
    return withCookies(NextResponse.redirect(new URL("/", request.url)), supabaseResponse);
  }
  if (pathname.startsWith("/admin-login")) {
    return withCookies(NextResponse.redirect(new URL("/", request.url)), supabaseResponse);
  }

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Nếu đã login mà vào login/signup → redirect về dashboard
    if ((pathname === "/login" || pathname === "/signup") && user) {
      return withCookies(NextResponse.redirect(new URL("/app", request.url)), supabaseResponse);
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    // Prevent caching of protected pages
    const resp = withCookies(NextResponse.redirect(loginUrl), supabaseResponse);
    resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    resp.headers.set("Pragma", "no-cache");
    resp.headers.set("Expires", "0");
    return resp;
  }

  // Add no-cache headers for all /app routes
  if (pathname.startsWith("/app")) {
    supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
