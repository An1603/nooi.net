"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Eye, Clock, Radio, Activity, RefreshCw, ExternalLink, Loader2, ShieldCheck, MapPin } from "lucide-react";

type Nguon = { ten: string; so: number };

type PhienWeb = {
  ai: string;
  trang: string;
  host: string;
  nguon: string;
  utm: string;
  thiet_bi: string;
  trinh_duyet: string;
  quoc_gia: string;
  ip: string;
  vao_luc: number;
  ra_luc: number;
  giay: number;
  so_trang: number;
  thoat: string;
};

type OnlineWeb = {
  ai: string;
  trang: string;
  nguon: string;
  thiet_bi: string;
  trinh_duyet: string;
  quoc_gia: string;
  ip: string;
  vao_luc: number;
  giay: number;
  giay_im: number;
};

type OnlineSlides = {
  nhan: string;
  trang: string;
  deck: string;
  nguon: string;
  utm: string;
  thiet_bi: string;
  trinh_duyet: string;
  quoc_gia: string;
  ip: string;
  vao_luc: number;
  giay: number;
  giay_im: number;
};

type PhienSlides = {
  nhan: string;
  trang: string;
  nguon: string;
  utm: string;
  thiet_bi: string;
  trinh_duyet: string;
  quoc_gia: string;
  ip: string;
  vao_luc: number;
  ra_luc: number;
  giay: number;
  so_trang: number;
  thoat: string;
};

type DuLieu = {
  ngay: number;
  web: {
    kpi: { soPhien: number; soXem: number; tbGiay: number; dangOnline: number; daDangNhap: number };
    theoGio: Record<string, number>;
    nguon: Nguon[];
    thietBi: Nguon[];
    host: Nguon[];
    trang: Nguon[];
    online: OnlineWeb[];
    ds: PhienWeb[];
  };
  slides: {
    kpi: { so_phien: number; so_xem: number; so_chan: number; tb_giay: number };
    theoGio: Record<string, number>;
    nguon: Nguon[];
    decks: Nguon[];
    ds: PhienSlides[];
    online: OnlineSlides[];
  } | null;
};

const KHOANG = [
  { k: 1, nhan: "Hôm nay" },
  { k: 7, nhan: "7 ngày" },
  { k: 30, nhan: "30 ngày" },
  { k: 180, nhan: "180 ngày" },
];

function gt(s: number): string {
  const v = Math.max(0, Math.round(s || 0));
  if (v < 60) return `${v} giây`;
  if (v < 3600) return `${Math.floor(v / 60)} phút ${v % 60} giây`;
  return `${Math.floor(v / 3600)} giờ ${Math.floor((v % 3600) / 60)} phút`;
}

function lc(t: number): string {
  if (!t) return "—";
  const d = new Date(t * 1000);
  return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })}`;
}

export default function LuotTruyCapPage() {
  const [ngay, setNgay] = useState(1);
  const [du, setDu] = useState<DuLieu | null>(null);
  const [loi, setLoi] = useState("");
  const [dangTai, setDangTai] = useState(true);
  const [tab, setTab] = useState<"web" | "slides">("web");

  const tai = useCallback(async (n: number) => {
    try {
      const r = await fetch(`/api/admin/truy-cap?ngay=${n}`, { cache: "no-store" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setLoi(j.error || `Lỗi ${r.status}`);
        return;
      }
      setDu(await r.json());
      setLoi("");
    } catch {
      setLoi("Không tải được dữ liệu");
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    setDangTai(true);
    void tai(ngay);
    const id = window.setInterval(() => void tai(ngay), 5000);
    return () => window.clearInterval(id);
  }, [ngay, tai]);

  const onlineWeb = du?.web.online.length ?? 0;
  const onlineSlides = du?.slides?.online.length ?? 0;
  const gio = du ? (tab === "web" ? du.web.theoGio : du.slides?.theoGio ?? {}) : {};
  const maxGio = Math.max(1, ...Object.values(gio));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="size-6 text-primary" />
            Lượt truy cập
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Thời gian thực &amp; lịch sử truy cập toàn hệ thống nooi.net và kho tài liệu slides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {onlineWeb + onlineSlides} đang online
          </span>
          <a
            href="https://slides.nooi.net/"
            target="_blank"
            rel="noopener"
            className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
          >
            slides.nooi.net <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {KHOANG.map((x) => (
          <button
            key={x.k}
            onClick={() => setNgay(x.k)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              ngay === x.k ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-accent"
            }`}
          >
            {x.nhan}
          </button>
        ))}
        <button
          onClick={() => void tai(ngay)}
          className="rounded-full border px-3 py-1.5 text-xs inline-flex items-center gap-1 hover:bg-accent"
        >
          <RefreshCw className="size-3.5" /> Làm mới
        </button>
      </div>

      {loi && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <p className="text-sm text-destructive">{loi}</p>
        </Card>
      )}

      {dangTai && !du ? (
        <Card className="p-10 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </Card>
      ) : du ? (
        <>
          {/* KPI */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Radio className="size-3.5" /> Đang online
              </div>
              <div className="text-3xl font-bold mt-1 text-emerald-500">{onlineWeb + onlineSlides}</div>
              <div className="text-xs text-muted-foreground mt-1">
                web {onlineWeb} · slides {onlineSlides}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="size-3.5" /> Lượt xem
              </div>
              <div className="text-3xl font-bold mt-1">{du.web.kpi.soXem + (du.slides?.kpi.so_xem ?? 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                web {du.web.kpi.soXem} · slides {du.slides?.kpi.so_xem ?? 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3.5" /> Phiên
              </div>
              <div className="text-3xl font-bold mt-1">{du.web.kpi.soPhien + (du.slides?.kpi.so_phien ?? 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {du.web.kpi.daDangNhap} phiên đã đăng nhập (web)
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" /> Thời lượng TB
              </div>
              <div className="text-2xl font-bold mt-1">{gt(du.web.kpi.tbGiay)}</div>
              <div className="text-xs text-muted-foreground mt-1">slides {gt(du.slides?.kpi.tb_giay ?? 0)}</div>
            </Card>
          </div>

          {/* Tab */}
          <div className="flex gap-2">
            {(
              [
                ["web", "Toàn hệ thống nooi.net"],
                ["slides", "Tài liệu slides"],
              ] as const
            ).map(([k, nhan]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  tab === k ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-accent"
                }`}
              >
                {nhan}
              </button>
            ))}
          </div>

          {/* Đang xem */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Radio className="size-4 text-emerald-500" />
              <h2 className="font-semibold text-sm">Đang xem bây giờ</h2>
              <span className="text-xs rounded-full bg-emerald-500/15 text-emerald-500 px-2 py-0.5">
                {tab === "web" ? onlineWeb : onlineSlides}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left font-semibold px-4 py-2">Ai</th>
                    <th className="text-left font-semibold px-4 py-2">Trang / tài liệu</th>
                    <th className="text-left font-semibold px-4 py-2">Từ đâu</th>
                    <th className="text-left font-semibold px-4 py-2">Thiết bị</th>
                    <th className="text-left font-semibold px-4 py-2">Vào lúc</th>
                    <th className="text-left font-semibold px-4 py-2">Đã xem</th>
                  </tr>
                </thead>
                <tbody>
                  {tab === "web"
                    ? du.web.online.map((x, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{x.ai}</td>
                          <td className="px-4 py-2">
                            <div className="font-mono text-xs">{x.trang}</div>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{x.nguon}</td>
                          <td className="px-4 py-2">
                            {x.thiet_bi}
                            <div className="text-xs text-muted-foreground">{x.trinh_duyet}</div>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{lc(x.vao_luc)}</td>
                          <td className="px-4 py-2">
                            <b>{gt(x.giay)}</b>
                            <div className="text-xs text-muted-foreground">
                              {x.giay_im < 25 ? "đang hoạt động" : `im ${x.giay_im}s`}
                            </div>
                          </td>
                        </tr>
                      ))
                    : (du.slides?.online ?? []).map((x, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{x.nhan}</td>
                          <td className="px-4 py-2">
                            {x.deck || "Trang chủ"}
                            <div className="font-mono text-xs text-muted-foreground">{x.trang}</div>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{x.nguon}</td>
                          <td className="px-4 py-2">
                            {x.thiet_bi}
                            <div className="text-xs text-muted-foreground">{x.trinh_duyet}</div>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{lc(x.vao_luc)}</td>
                          <td className="px-4 py-2">
                            <b>{gt(x.giay)}</b>
                          </td>
                        </tr>
                      ))}
                  {(tab === "web" ? du.web.online.length : du.slides?.online.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-muted-foreground">
                        {tab === "web" ? "Chưa có ai đang truy cập nooi.net." : "Chưa có ai đang xem tài liệu."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Biểu đồ + nguồn */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3">Lượt xem theo giờ</h2>
              <div className="flex items-end gap-1 h-32">
                {Object.entries(gio).map(([h, v]) => (
                  <div key={h} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100">{v}</span>
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${Math.max(2, (v / maxGio) * 100)}%` }}
                      title={`${h} giờ: ${v} lượt`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                {Object.keys(gio).map((h) => (
                  <span key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                    {h}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3">Nguồn truy cập</h2>
              <div className="space-y-2">
                {(tab === "web" ? du.web.nguon : du.slides?.nguon ?? []).map((x) => (
                  <div key={x.ten} className="flex items-center justify-between text-sm">
                    <span className="truncate">{x.ten}</span>
                    <span className="font-semibold">{x.so}</span>
                  </div>
                ))}
                {(tab === "web" ? du.web.nguon : du.slides?.nguon ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Chi tiết phụ */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3">{tab === "web" ? "Trang xem nhiều" : "Tài liệu xem nhiều"}</h2>
              <div className="space-y-2">
                {(tab === "web" ? du.web.trang : du.slides?.decks ?? []).slice(0, 8).map((x) => (
                  <div key={x.ten} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-xs">{x.ten}</span>
                    <span className="font-semibold shrink-0">{x.so}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3">Thiết bị</h2>
              <div className="space-y-2">
                {(tab === "web" ? du.web.thietBi : du.slides?.nguon ?? []).slice(0, 8).map((x) => (
                  <div key={x.ten} className="flex items-center justify-between text-sm">
                    <span className="truncate">{x.ten}</span>
                    <span className="font-semibold">{x.so}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Tên miền
              </h2>
              <div className="space-y-2">
                {(du.web.host ?? []).map((x) => (
                  <div key={x.ten} className="flex items-center justify-between text-sm">
                    <span className="truncate">{x.ten}</span>
                    <span className="font-semibold">{x.so}</span>
                  </div>
                ))}
                {du.web.host.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}
              </div>
            </Card>
          </div>

          {/* Lịch sử */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h2 className="font-semibold text-sm">Lịch sử truy cập</h2>
              <span className="text-xs text-muted-foreground">
                {tab === "web" ? du.web.ds.length : du.slides?.ds.length ?? 0} phiên
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left font-semibold px-4 py-2">Ai</th>
                    <th className="text-left font-semibold px-4 py-2">Trang / tài liệu</th>
                    <th className="text-left font-semibold px-4 py-2">Từ đâu</th>
                    <th className="text-left font-semibold px-4 py-2">Thiết bị</th>
                    <th className="text-left font-semibold px-4 py-2">Vào</th>
                    <th className="text-left font-semibold px-4 py-2">Ra</th>
                    <th className="text-left font-semibold px-4 py-2">Thời lượng</th>
                    <th className="text-left font-semibold px-4 py-2">Trang</th>
                  </tr>
                </thead>
                <tbody>
                  {tab === "web"
                    ? du.web.ds.map((x, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{x.ai}</td>
                          <td className="px-4 py-2 font-mono text-xs">{x.trang}</td>
                          <td className="px-4 py-2 text-muted-foreground">{x.nguon}</td>
                          <td className="px-4 py-2">
                            {x.thiet_bi}
                            <div className="text-xs text-muted-foreground">{x.trinh_duyet}</div>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{lc(x.vao_luc)}</td>
                          <td className="px-4 py-2 text-muted-foreground">{lc(x.ra_luc)}</td>
                          <td className="px-4 py-2">
                            <b>{gt(x.giay)}</b>
                          </td>
                          <td className="px-4 py-2">{x.so_trang}</td>
                        </tr>
                      ))
                    : (du.slides?.ds ?? []).map((x, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{x.nhan}</td>
                          <td className="px-4 py-2 font-mono text-xs">{x.trang}</td>
                          <td className="px-4 py-2 text-muted-foreground">{x.nguon}</td>
                          <td className="px-4 py-2">
                            {x.thiet_bi}
                            <div className="text-xs text-muted-foreground">{x.trinh_duyet}</div>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{lc(x.vao_luc)}</td>
                          <td className="px-4 py-2 text-muted-foreground">{lc(x.ra_luc)}</td>
                          <td className="px-4 py-2">
                            <b>{gt(x.giay)}</b>
                          </td>
                          <td className="px-4 py-2">{x.so_trang}</td>
                        </tr>
                      ))}
                  {(tab === "web" ? du.web.ds.length : du.slides?.ds.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-sm text-muted-foreground">
                        Chưa có lượt truy cập nào trong khoảng này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground">
            Dữ liệu lưu 180 ngày · bảng web cập nhật mỗi 5 giây · danh tính web lấy từ tài khoản đăng nhập (Supabase),
            khách vãng lai nhận diện bằng cookie thiết bị. IP và hành vi truy cập là dữ liệu cá nhân (NĐ 13/2023/NĐ-CP):
            chỉ dùng cho an toàn thông tin nội bộ.
          </p>
        </>
      ) : null}
    </div>
  );
}
