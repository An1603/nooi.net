import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Ghi nhận lượt truy cập toàn hệ thống nooi.net (giai đoạn 2).
 *
 * - Client gửi `{ t: "vao" | "nhip" | "thoat", d: đường dẫn, q: query, r: referrer, g: giây }`
 *   bằng fetch/keepalive hoặc sendBeacon.
 * - Danh tính: email/user_id lấy từ phiên Supabase (server-side, không tin dữ liệu client).
 * - Khách chưa đăng nhập: nhận diện bằng cookie `nooi_vid` + IP/thiết bị.
 * - Chỉ dùng service role ở server; bảng bật RLS không policy ⇒ trình duyệt không đọc được.
 */

const COOKIE = "nooi_vid";
const MAX_BODY = 2048;

type Payload = { t?: string; d?: string; q?: string; r?: string; g?: number };

function thietBi(ua: string): string {
  if (/iPad|Tablet/i.test(ua)) return "Máy tính bảng";
  return /iPhone|iPod|Android|Mobile|Windows Phone/i.test(ua) ? "Điện thoại" : "Máy tính";
}

function trinhDuyet(ua: string): string {
  if (/Zalo/i.test(ua)) return "Zalo (trong app)";
  if (/FBAN|FBAV|FB_IAB|Instagram/i.test(ua)) return "Facebook/Instagram (trong app)";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Coc Coc|coc_coc/i.test(ua)) return "Cốc Cốc";
  if (/Chrome\//i.test(ua) && !/Safari\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  if (/Firefox\//i.test(ua)) return "Firefox";
  return "Khác";
}

function nguon(ref: string): string {
  if (!ref) return "Trực tiếp (gõ link / bookmark)";
  try {
    const h = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    const ten: Record<string, string> = {
      "zalo.me": "Zalo",
      "chat.zalo.me": "Zalo",
      "facebook.com": "Facebook",
      "m.facebook.com": "Facebook",
      "l.facebook.com": "Facebook",
      "lm.facebook.com": "Facebook",
      "messenger.com": "Messenger",
      "m.me": "Messenger",
      "t.co": "X/Twitter",
      "x.com": "X/Twitter",
      "youtube.com": "YouTube",
      "m.youtube.com": "YouTube",
      "google.com": "Google",
      "t.me": "Telegram",
      "mail.google.com": "Email",
      "slides.nooi.net": "Tài liệu slides",
      "vuon.nooi.net": "Vườn NOOI",
    };
    return ten[h] ?? h;
  } catch {
    return "Không rõ";
  }
}

function utmTu(q: string): string {
  if (!q) return "";
  try {
    const sp = new URLSearchParams(q.startsWith("?") ? q.slice(1) : q);
    const phan: string[] = [];
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const v = sp.get(k);
      if (v) phan.push(`${k.replace("utm_", "")}=${v.slice(0, 60)}`);
    }
    return phan.join(" · ");
  } catch {
    return "";
  }
}

function ipCua(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    ""
  );
}

export async function POST(req: NextRequest) {
  let body: Payload = {};
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ ok: false }, { status: 413 });
    body = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const loai = ["vao", "nhip", "thoat"].includes(String(body.t)) ? String(body.t) : "nhip";
  const duongDan = String(body.d || "/").slice(0, 300);
  if (duongDan.startsWith("/_next") || duongDan.startsWith("/api")) {
    return NextResponse.json({ ok: true, boQua: true });
  }

  const store = await cookies();
  const vid = store.get(COOKIE)?.value || crypto.randomUUID();
  const moi = !store.get(COOKIE);
  const ua = req.headers.get("user-agent") || "";
  const host = req.headers.get("host") || "";
  const ip = ipCua(req);

  // Danh tính: chỉ tra phiên Supabase ở sự kiện "vao" để không gọi mạng mỗi nhịp tim.
  let userId: string | null = null;
  let email: string | null = null;
  if (loai === "vao" && req.headers.get("cookie")?.includes("-auth-token")) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        userId = data.user.id;
        email = data.user.email ?? null;
      }
    } catch {
      /* không có phiên → khách vãng lai */
    }
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  try {
    const { data: phien } = await admin
      .from("luot_truy_cap")
      .select("id, so_trang")
      .eq("id", vid)
      .maybeSingle();

    if (!phien) {
      await admin.from("luot_truy_cap").insert({
        id: vid,
        user_id: userId,
        email,
        bat_dau: now,
        cuoi: now,
        ip,
        quoc_gia: req.headers.get("cf-ipcountry") || null,
        thiet_bi: thietBi(ua),
        trinh_duyet: trinhDuyet(ua),
        nguon: nguon(body.r || req.headers.get("referer") || ""),
        utm: utmTu(String(body.q || "")),
        trang_vao: duongDan,
        so_trang: loai === "vao" ? 1 : 0,
        host,
      });
    } else {
      const capNhat: Record<string, unknown> = { cuoi: now, ip };
      if (loai === "vao") capNhat.so_trang = (phien.so_trang || 0) + 1;
      if (userId) {
        capNhat.user_id = userId;
        capNhat.email = email;
      }
      if (loai === "thoat") capNhat.thoat = "roi";
      if (loai === "vao") capNhat.thoat = null;
      if (loai === "vao" && !phien.so_trang) {
        // lần vào đầu tiên của phiên: chốt nguồn/thiết bị thật
        capNhat.nguon = nguon(body.r || req.headers.get("referer") || "");
        capNhat.utm = utmTu(String(body.q || ""));
        capNhat.trang_vao = duongDan;
        capNhat.thiet_bi = thietBi(ua);
        capNhat.trinh_duyet = trinhDuyet(ua);
      }
      await admin.from("luot_truy_cap").update(capNhat).eq("id", vid);
    }

    await admin.from("luot_truy_cap_su_kien").insert({ phien: vid, loai, duong_dan: duongDan, host, giay: Number(body.g) || 0 });
  } catch (err) {
    console.error("[track] lỗi ghi lượt truy cập:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  if (moi) {
    res.cookies.set(COOKIE, vid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 180 * 24 * 3600,
    });
  }
  return res;
}
