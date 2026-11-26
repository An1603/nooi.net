"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ListFilter, RotateCcw, Search, Share2, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * THƯ VIỆN ẢNH — bản Next (thay trang tĩnh cũ).
 *
 * Vì sao chuyển vào Next: /gallery trước đây là một trang HTML riêng, tự dựng thanh đầu
 * trang bằng CSS riêng. Mỗi lần bấm vào/ra là trình duyệt TẢI LẠI CẢ TRANG, nên thanh menu
 * nháy và giật, không giống 5 phân hệ còn lại (điều hướng mềm, header đứng yên).
 *
 * Dữ liệu vẫn do pipeline cào ảnh sinh ra: `data/gallery.js` → `data/gallery.json`
 * (script `scripts/build-gallery-json.mjs`, chạy tự động trong `sync-gallery.sh`).
 */

type Anh = {
  id: string;
  board: string;
  w: number;
  h: number;
  color: string | null;
  thumb: string;
  full: string;
};

type Board = { slug: string; name: string; count: number };

type DuLieu = { total: number; scrapedAt: string | null; boards: Board[]; items: Anh[] };

type SapXep = "mac-dinh" | "ngau-nhien" | "ten-a-z" | "ngang-truoc" | "doc-truoc";
type Kho = "all" | "ngang" | "vuong" | "doc";
type Tong = "all" | "am" | "la" | "duong" | "trungtinh";

const SAP_XEP: { ma: SapXep; ten: string }[] = [
  { ma: "mac-dinh", ten: "Mặc định" },
  { ma: "ngau-nhien", ten: "Ngẫu nhiên" },
  { ma: "ten-a-z", ten: "Tên A → Z" },
  { ma: "ngang-truoc", ten: "Ngang trước" },
  { ma: "doc-truoc", ten: "Dọc trước" },
];

const KHO: { ma: Kho; ten: string }[] = [
  { ma: "all", ten: "Mọi khổ" },
  { ma: "ngang", ten: "Ngang" },
  { ma: "vuong", ten: "Vuông" },
  { ma: "doc", ten: "Dọc" },
];

const TONG: { ma: Tong; ten: string }[] = [
  { ma: "all", ten: "Mọi tông" },
  { ma: "am", ten: "Ấm" },
  { ma: "la", ten: "Lá" },
  { ma: "duong", ten: "Dương" },
  { ma: "trungtinh", ten: "Trung tính" },
];

/** Bỏ dấu để gõ "mang den" hay "măng đen" đều ra. */
const boDau = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim();

const dinhDang = (n: number) => n.toLocaleString("vi-VN");

const khoCua = (it: Anh): Exclude<Kho, "all"> =>
  it.h > it.w ? "doc" : it.h === it.w ? "vuong" : "ngang";

/** Tông màu từ hex dominant — cùng công thức với bản tĩnh cũ. */
function tongCua(hex: string | null): Exclude<Tong, "all"> {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return "trungtinh";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const sat = max === 0 ? 0 : d / max;
  if (sat < 0.12 || max < 0.2) return "trungtinh";

  let hue: number;
  if (d === 0) hue = 0;
  else if (max === r) hue = 60 * (((g - b) / d) % 6);
  else if (max === g) hue = 60 * ((b - r) / d + 2);
  else hue = 60 * ((r - g) / d + 4);
  if (hue < 0) hue += 360;

  if (hue < 70) return "am";
  if (hue < 165) return "la";
  if (hue < 260) return "duong";
  return "am";
}

/** Số cột theo bề rộng — giữ đúng nhịp của bản tĩnh cũ. */
const soCot = (w: number) => (w < 460 ? 2 : w < 720 ? 3 : w < 1040 ? 4 : w < 1420 ? 5 : 6);

/** Ngẫu nhiên CÓ HẠT GIỐNG: cùng seed → cùng thứ tự (link chia sẻ mở đúng danh sách). */
function tronTheoHat(ds: Anh[], hat: number): Anh[] {
  const a = ds.slice();
  let t = hat >>> 0;
  const rnd = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type BanDau = { total: number; scrapedAt: string | null; boards: Board[]; items: Anh[] };

/** Số ảnh vẽ thêm mỗi lần cuộn tới đáy. Giữ DOM nhỏ để trang cuộn mượt. */
const MOI_LAN = 120;

export function ThuVienAnh({ banDau }: { banDau: BanDau }) {
  // Có sẵn lô ảnh đầu từ máy chủ -> vẽ ngay, không có màn “đang tải”.
  const [duLieu, setDuLieu] = useState<DuLieu | null>(banDau.items.length ? banDau : null);
  const [dayDu, setDayDu] = useState(false);
  const [loi, setLoi] = useState(false);

  const [q, setQ] = useState("");
  const [board, setBoard] = useState<string>("all");
  const [kho, setKho] = useState<Kho>("all");
  const [tong, setTong] = useState<Tong>("all");
  const [sapXep, setSapXep] = useState<SapXep>("mac-dinh");
  const [seed, setSeed] = useState(1);
  const [moLoc, setMoLoc] = useState(false);
  const [soCat, setSoCat] = useState(6);
  const [soHien, setSoHien] = useState(MOI_LAN);
  const [dangXem, setDangXem] = useState<number | null>(null);
  const [thongBao, setThongBao] = useState("");

  const luoiRef = useRef<HTMLDivElement>(null);
  const chanRef = useRef<HTMLDivElement>(null);
  const daDocUrl = useRef(false);

  /**
   * Nạp PHẦN CÒN LẠI sau khi trang đã vẽ xong.
   *
   * Vì sao không tải ngay: lô đầu đã nằm trong HTML nên khách thấy ảnh trước đã. Việc tải
   * 350 KB dữ liệu để lọc/sắp xếp toàn bộ ảnh là phụ — để nó chạy lúc trình duyệt rảnh, không
   * tranh băng thông với chính những ảnh đang hiện.
   */
  useEffect(() => {
    let huy = false;
    const nap = () => {
      fetch("/gallery/data/gallery.json")
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then((d: DuLieu) => {
          if (!huy) {
            setDuLieu(d);
            setDayDu(true);
          }
        })
        .catch(() => {
          if (!huy && !banDau.items.length) setLoi(true);
        });
    };

    type Ric = ((cb: () => void, o?: { timeout: number }) => number) | undefined;
    const ric = (window as unknown as { requestIdleCallback?: Ric }).requestIdleCallback;
    const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;

    const id: number = ric ? ric(nap, { timeout: 900 }) : window.setTimeout(nap, 150);
    return () => {
      huy = true;
      if (ric) cic?.(id);
      else clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Đọc trạng thái từ địa chỉ (link chia sẻ) ── */
  useEffect(() => {
    if (daDocUrl.current) return;
    daDocUrl.current = true;
    const p = new URLSearchParams(window.location.search);
    if (p.get("q")) setQ(p.get("q") as string);
    if (p.get("board")) setBoard(p.get("board") as string);
    const o = p.get("orient");
    if (o === "ngang" || o === "vuong" || o === "doc") setKho(o);
    const c = p.get("color");
    if (c === "am" || c === "la" || c === "duong" || c === "trungtinh") setTong(c);
    const s = p.get("sort") as SapXep | null;
    if (s && SAP_XEP.some((x) => x.ma === s)) setSapXep(s);
    const sd = parseInt(p.get("seed") || "", 10);
    if (Number.isFinite(sd) && sd > 0) setSeed(sd);
  }, []);

  /* ── Theo dõi bề rộng để chia cột ── */
  useEffect(() => {
    const el = luoiRef.current;
    if (!el) return;
    const doCot = () => setSoCat(soCot(el.clientWidth || window.innerWidth));
    doCot();
    const ro = new ResizeObserver(doCot);
    ro.observe(el);
    return () => ro.disconnect();
  }, [duLieu]);

  /* ── Ghi trạng thái vào địa chỉ (để copy/chia sẻ đúng danh sách đang xem) ── */
  useEffect(() => {
    if (!daDocUrl.current) return;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (board !== "all") p.set("board", board);
    if (kho !== "all") p.set("orient", kho);
    if (tong !== "all") p.set("color", tong);
    if (sapXep !== "mac-dinh") p.set("sort", sapXep);
    if (sapXep === "ngau-nhien") p.set("seed", String(seed));
    const qs = p.toString();
    try {
      history.replaceState(null, "", qs ? `${location.pathname}?${qs}` : location.pathname);
    } catch {
      /* trình duyệt chặn — bỏ qua */
    }
  }, [q, board, kho, tong, sapXep, seed]);

  const tenBoard = useMemo(() => {
    const m = new Map<string, string>();
    (duLieu?.boards ?? []).forEach((b) => m.set(b.slug, b.name));
    return m;
  }, [duLieu]);

  /* ── Lọc + sắp xếp ── */
  const dangHien = useMemo(() => {
    if (!duLieu) return [] as Anh[];
    const tuKhoa = boDau(q);
    const ds = duLieu.items.filter((it) => {
      if (board !== "all" && it.board !== board) return false;
      if (kho !== "all" && khoCua(it) !== kho) return false;
      if (tong !== "all" && tongCua(it.color) !== tong) return false;
      if (tuKhoa && !boDau(tenBoard.get(it.board) || it.board).includes(tuKhoa)) return false;
      return true;
    });

    if (sapXep === "ngau-nhien") return tronTheoHat(ds, seed);
    if (sapXep === "ten-a-z") {
      return ds.sort(
        (a, b) =>
          (tenBoard.get(a.board) || "").localeCompare(tenBoard.get(b.board) || "", "vi") ||
          a.id.localeCompare(b.id)
      );
    }
    if (sapXep === "ngang-truoc" || sapXep === "doc-truoc") {
      const uu = sapXep === "ngang-truoc" ? { ngang: 0, vuong: 1, doc: 2 } : { doc: 0, vuong: 1, ngang: 2 };
      return ds.sort((a, b) => uu[khoCua(a)] - uu[khoCua(b)]);
    }
    return ds;
  }, [duLieu, q, board, kho, tong, sapXep, seed, tenBoard]);

  /** Đổi bộ lọc/sắp xếp thì quay về lô đầu — không giữ lại hàng nghìn thẻ của lần trước. */
  useEffect(() => {
    setSoHien(MOI_LAN);
  }, [q, board, kho, tong, sapXep, seed]);

  /** Chỉ vẽ phần đang cần; cuộn tới đáy thì nới thêm (xem chốt quan sát bên dưới). */
  const dangCat = useMemo(() => dangHien.slice(0, soHien), [dangHien, soHien]);

  /**
   * Chốt quan sát ở đáy lưới: cuộn gần tới là nới thêm 120 ảnh.
   *
   * Vì sao không vẽ hết 1.738 thẻ một lượt: dựng từng đó DOM node mất 1–2 giây và cuộn rất
   * nặng. Vẽ theo lô thì trang mở gần như tức thì mà trải nghiệm cuộn vẫn liền.
   */
  useEffect(() => {
    const el = chanRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (muc) => {
        if (muc.some((m) => m.isIntersecting)) {
          setSoHien((n) => (n < dangHien.length ? n + MOI_LAN : n));
        }
      },
      { rootMargin: "900px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [dangHien.length]);

  /**
   * Chia ảnh vào cột NGẮN NHẤT (masonry cân bằng).
   *
   * Không dùng `columns` của CSS vì nó xếp đầy cột 1 rồi mới sang cột 2 — nhìn như một dải
   * dọc. Ở đây biết trước tỉ lệ ảnh (w/h) nên tính được chiều cao từng cột mà không cần đo
   * DOM, nhờ vậy không có bước "nhảy" lúc ảnh tải xong.
   */
  const cot = useMemo(() => {
    const buckets: { anh: Anh; viTri: number }[][] = Array.from({ length: soCat }, () => []);
    const cao = new Array(soCat).fill(0);
    dangCat.forEach((it, viTri) => {
      let c = 0;
      for (let k = 1; k < soCat; k++) if (cao[k] < cao[c]) c = k;
      buckets[c].push({ anh: it, viTri });
      cao[c] += it.w > 0 ? it.h / it.w : 1;
    });
    return buckets;
  }, [dangCat, soCat]);

  const soLoc = (q ? 1 : 0) + (board !== "all" ? 1 : 0) + (kho !== "all" ? 1 : 0) + (tong !== "all" ? 1 : 0);
  const daLoc = soLoc > 0 || sapXep !== "mac-dinh";

  const xoaLoc = useCallback(() => {
    setQ("");
    setBoard("all");
    setKho("all");
    setTong("all");
    setSapXep("mac-dinh");
  }, []);

  /* ── Lightbox: khoá cuộn + phím tắt ── */
  useEffect(() => {
    if (dangXem === null) return;
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDangXem(null);
      if (e.key === "ArrowRight") setDangXem((p) => (p === null ? null : (p + 1) % dangHien.length));
      if (e.key === "ArrowLeft")
        setDangXem((p) => (p === null ? null : (p - 1 + dangHien.length) % dangHien.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", onKey);
    };
  }, [dangXem, dangHien.length]);

  async function chiaSe() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Thư viện ảnh NOOI", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      hienThongBao("Đã sao chép liên kết");
    } catch {
      hienThongBao("Không chia sẻ được — hãy sao chép địa chỉ trên thanh trình duyệt");
    }
  }

  function hienThongBao(chu: string) {
    setThongBao(chu);
    window.setTimeout(() => setThongBao(""), 2600);
  }

  const anhDangXem = dangXem !== null ? dangHien[dangXem] : null;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── Thanh công cụ ── */}
      <div className="sticky top-[62px] z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2">
              <Search size={15} className="shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên bộ sưu tập… (gõ không dấu cũng ra)"
                aria-label="Tìm ảnh theo tên bộ sưu tập"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Xoá từ khoá" className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={sapXep}
              onChange={(e) => {
                const v = e.target.value as SapXep;
                setSapXep(v);
                if (v === "ngau-nhien") setSeed(Math.floor(Math.random() * 2147483647));
              }}
              aria-label="Sắp xếp"
              className="rounded-lg border border-border bg-card/40 px-3 py-2 text-[12.5px] outline-none"
            >
              {SAP_XEP.map((s) => (
                <option key={s.ma} value={s.ma}>
                  {s.ten}
                </option>
              ))}
            </select>

            <button
              onClick={() => setMoLoc((v) => !v)}
              aria-expanded={moLoc}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] transition-colors",
                soLoc > 0 ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-card/40 hover:border-primary/30"
              )}
            >
              <ListFilter size={14} /> Lọc
              {soLoc > 0 && (
                <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10.5px] font-semibold text-primary-foreground">
                  {soLoc}
                </span>
              )}
            </button>

            <button
              onClick={chiaSe}
              aria-label="Chia sẻ danh sách đang xem"
              className="rounded-lg border border-border bg-card/40 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Share2 size={15} />
            </button>
          </div>

          {moLoc && (
            <div className="mt-2.5 space-y-2.5 rounded-lg border border-border bg-card/30 p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Khổ</span>
                {KHO.map((k) => (
                  <button
                    key={k.ma}
                    onClick={() => setKho(k.ma)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px]",
                      kho === k.ma ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {k.ten}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Tông</span>
                {TONG.map((t) => (
                  <button
                    key={t.ma}
                    onClick={() => setTong(t.ma)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px]",
                      tong === t.ma ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.ten}
                  </button>
                ))}
                {daLoc && (
                  <button onClick={xoaLoc} className="ml-auto flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground">
                    <RotateCcw size={12} /> Xoá lọc
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chip bộ sưu tập + số ảnh ── */}
      <div className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] pt-4">
        <div className="khong-cuon mb-2 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setBoard("all")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11.5px]",
              board === "all" ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Tất cả
          </button>
          {(duLieu?.boards ?? []).map((b) => (
            <button
              key={b.slug}
              onClick={() => setBoard(b.slug)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11.5px]",
                board === b.slug ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {b.name}
            </button>
          ))}
        </div>

        <p className="mb-3 text-[11.5px] text-muted-foreground">
          {!duLieu
            ? "Đang tải thư viện…"
            : `Đang hiện ${dinhDang(Math.min(soHien, dangHien.length))}/${dinhDang(
                dayDu ? dangHien.length : duLieu.total
              )} ảnh${
                !dayDu
                  ? " · đang nạp phần còn lại"
                  : dangHien.length > soHien
                    ? ` · còn ${dinhDang(dangHien.length - soHien)} nữa`
                    : ""
              }`}
        </p>
      </div>

      {/* ── Lưới ── */}
      <div ref={luoiRef} className="mx-auto w-full max-w-[1680px] px-[clamp(16px,3vw,34px)] pb-16">
        {loi && (
          <p className="rounded-lg border border-border bg-card/40 p-6 text-center text-[13px] text-muted-foreground">
            Không tải được dữ liệu thư viện. Vui lòng tải lại trang.
          </p>
        )}

        {!loi && duLieu && dangHien.length === 0 && (
          <div className="rounded-lg border border-border bg-card/40 p-10 text-center">
            <p className="text-[14px] font-medium">Không có ảnh nào khớp.</p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              Thử bỏ chữ đang tìm, hoặc chọn lại bộ sưu tập, khổ ảnh, tông màu.
            </p>
            {daLoc && (
              <button onClick={xoaLoc} className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-[12.5px] font-medium text-primary-foreground">
                Xoá bộ lọc
              </button>
            )}
          </div>
        )}

        <div className="flex gap-4">
          {cot.map((ds, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-4">
              {ds.map(({ anh: it, viTri }) => {
                return (
                  <button
                    key={it.id}
                    onClick={() => setDangXem(viTri)}
                    aria-label={`Mở ảnh ${viTri + 1} / ${dangHien.length}${tenBoard.get(it.board) ? ` — ${tenBoard.get(it.board)}` : ""}`}
                    className="group relative block w-full overflow-hidden rounded-xl outline-none ring-primary/60 focus-visible:ring-2"
                    style={{ backgroundColor: it.color || "transparent", aspectRatio: `${it.w} / ${it.h}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/gallery/${it.thumb}`}
                      alt={`${tenBoard.get(it.board) || "NOOI"} — ảnh ${viTri + 1}`}
                      loading={viTri < 8 ? "eager" : "lazy"}
                      // 8 ảnh đầu nằm trong màn hình đầu tiên -> tải ngay, xếp hàng ưu tiên cao
                      {...(viTri < 4 ? { fetchPriority: "high" as const } : {})}
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="rounded-full bg-black/45 p-2 text-white/90">
                        <ZoomIn size={15} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Chốt quan sát: cuộn gần tới đây là nới thêm 120 ảnh. */}
        <div ref={chanRef} aria-hidden className="h-px w-full" />

        {dayDu && dangHien.length > soHien && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setSoHien((n) => Math.min(n + MOI_LAN, dangHien.length))}
              className="rounded-lg border border-border bg-card/40 px-5 py-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Xem thêm {dinhDang(dangHien.length - soHien)} ảnh
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-muted-foreground/70">
          {duLieu
            ? `${dinhDang(duLieu.total)} ảnh · ${duLieu.boards.length} bộ sưu tập${
                duLieu.scrapedAt ? ` · cập nhật ${new Date(duLieu.scrapedAt).toLocaleDateString("vi-VN")}` : ""
              }`
            : ""}
          {"  "}Nội dung thuộc hệ sinh thái NOOI, vui lòng ghi rõ nguồn khi chia sẻ lại.
        </p>
      </div>

      {/* ── Lightbox ── */}
      {anhDangXem && dangXem !== null && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDangXem(null);
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/75">
            <p className="text-[12.5px]">
              {tenBoard.get(anhDangXem.board) ? `${tenBoard.get(anhDangXem.board)} · ` : ""}
              {dangXem + 1} / {dangHien.length}
            </p>
            <button onClick={() => setDangXem(null)} aria-label="Đóng" className="p-1.5 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/gallery/${anhDangXem.full}`}
              alt={`${tenBoard.get(anhDangXem.board) || "NOOI"} — ảnh ${dangXem + 1}`}
              className="max-h-full max-w-full object-contain"
            />

            <button
              onClick={() => setDangXem((p) => (p === null ? null : (p - 1 + dangHien.length) % dangHien.length))}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white/80 hover:text-white md:left-5"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => setDangXem((p) => (p === null ? null : (p + 1) % dangHien.length))}
              aria-label="Ảnh sau"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white/80 hover:text-white md:right-5"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      )}

      {thongBao && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-[12.5px] shadow-xl">
          {thongBao}
        </div>
      )}
    </div>
  );
}
