import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dữ liệu bảng điều khiển "Lượt truy cập" — gộp:
 *  (1) toàn hệ thống nooi.net (Supabase: luot_truy_cap + luot_truy_cap_su_kien)
 *  (2) tài liệu slides.nooi.net (proxy sang dịch vụ 127.0.0.1:3101 bằng token)
 * Trang gọi: /admin/luot-truy-cap
 */

const SLIDES_API = process.env.SLIDES_API_URL || "http://127.0.0.1:3101";
const SLIDES_TOKEN = process.env.SLIDES_ADMIN_TOKEN || "";
const ONLINE_GIAY = 90;

async function currentAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  return data ? user : null;
}

async function goiSlides(duong: string) {
  if (!SLIDES_TOKEN) return null;
  try {
    const res = await fetch(`${SLIDES_API}${duong}`, {
      headers: { "X-Nooi-Token": SLIDES_TOKEN },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "Không có quyền quản trị" }, { status: 403 });
  }
  const ngay = Math.min(180, Math.max(1, Number(new URL(request.url).searchParams.get("ngay") || 1)));
  const den = new Date();
  const tu = new Date(den.getTime() - ngay * 86400_000);
  const admin = createAdminClient();

  const [phienRes, suKienRes, onlineRes, slides, live] = await Promise.all([
    admin
      .from("luot_truy_cap")
      .select("id,email,user_id,bat_dau,cuoi,ip,quoc_gia,thiet_bi,trinh_duyet,nguon,utm,trang_vao,so_trang,thoat,host")
      .gte("bat_dau", tu.toISOString())
      .order("bat_dau", { ascending: false })
      .limit(500),
    admin
      .from("luot_truy_cap_su_kien")
      .select("luc,loai,duong_dan,host")
      .gte("luc", tu.toISOString())
      .eq("loai", "vao")
      .limit(5000),
    admin
      .from("luot_truy_cap")
      .select("id,email,bat_dau,cuoi,nguon,thiet_bi,trinh_duyet,quoc_gia,ip,trang_vao")
      .gte("cuoi", new Date(Date.now() - ONLINE_GIAY * 1000).toISOString())
      .order("cuoi", { ascending: false })
      .limit(100),
    goiSlides(`/__api/thong-ke?ngay=${ngay}`),
    goiSlides("/__api/live"),
  ]);

  const phien = phienRes.data ?? [];
  const suKien = suKienRes.data ?? [];

  const theoGio: Record<string, number> = {};
  for (let h = 0; h < 24; h += 1) theoGio[String(h).padStart(2, "0")] = 0;
  suKien.forEach((s) => {
    const gio = String(new Date(s.luc as string).getHours()).padStart(2, "0");
    theoGio[gio] = (theoGio[gio] ?? 0) + 1;
  });

  const dem = (khoa: (x: Record<string, unknown>) => string) => {
    const m: Record<string, number> = {};
    phien.forEach((p) => {
      const k = khoa(p as Record<string, unknown>) || "(không rõ)";
      m[k] = (m[k] ?? 0) + 1;
    });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([ten, so]) => ({ ten, so }));
  };

  const demTrang = () => {
    const m: Record<string, number> = {};
    suKien.forEach((s) => {
      const k = String(s.duong_dan || "/").split("?")[0];
      m[k] = (m[k] ?? 0) + 1;
    });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([ten, so]) => ({ ten, so }));
  };

  const tbGiay = phien.length
    ? Math.round(
        phien.reduce((t, p) => t + Math.max(0, (new Date(p.cuoi).getTime() - new Date(p.bat_dau).getTime()) / 1000), 0) /
          phien.length,
      )
    : 0;

  return NextResponse.json({
    ngay,
    web: {
      kpi: {
        soPhien: phien.length,
        soXem: suKien.length,
        tbGiay,
        dangOnline: (onlineRes.data ?? []).length,
        daDangNhap: phien.filter((p) => p.email).length,
      },
      theoGio,
      nguon: dem((p) => String(p.nguon || "")),
      thietBi: dem((p) => String(p.thiet_bi || "")),
      host: dem((p) => String(p.host || "")),
      trang: demTrang(),
      online: (onlineRes.data ?? []).map((p) => ({
        ai: p.email || "Khách chưa đăng nhập",
        trang: p.trang_vao || "/",
        nguon: p.nguon || "",
        thiet_bi: p.thiet_bi || "",
        trinh_duyet: p.trinh_duyet || "",
        quoc_gia: p.quoc_gia || "",
        ip: p.ip || "",
        vao_luc: new Date(p.bat_dau).getTime() / 1000,
        giay: Math.round((Date.now() - new Date(p.bat_dau).getTime()) / 1000),
        giay_im: Math.round((Date.now() - new Date(p.cuoi).getTime()) / 1000),
      })),
      ds: phien.map((p) => ({
        ai: p.email || "Khách chưa đăng nhập",
        trang: p.trang_vao || "/",
        host: p.host || "",
        nguon: p.nguon || "",
        utm: p.utm || "",
        thiet_bi: p.thiet_bi || "",
        trinh_duyet: p.trinh_duyet || "",
        quoc_gia: p.quoc_gia || "",
        ip: p.ip || "",
        vao_luc: new Date(p.bat_dau).getTime() / 1000,
        ra_luc: new Date(p.cuoi).getTime() / 1000,
        giay: Math.max(0, Math.round((new Date(p.cuoi).getTime() - new Date(p.bat_dau).getTime()) / 1000)),
        so_trang: p.so_trang ?? 0,
        thoat: p.thoat || "",
      })),
    },
    slides: slides
      ? {
          kpi: slides.kpi,
          theoGio: slides.theo_gio,
          nguon: (slides.nguon ?? []).map((x: { nguon: string; c: number }) => ({ ten: x.nguon, so: x.c })),
          decks: (slides.decks ?? []).map((x: { deck: string; c: number }) => ({ ten: x.deck, so: x.c })),
          ds: slides.ds ?? [],
          online: live?.ds ?? [],
        }
      : null,
  });
}
