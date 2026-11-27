"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ListFilter, Lock, Play, RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DANH_MUC, tenDanhMuc } from "@/lib/video/danh-muc";
import { anhBia, anhBiaSrcSet } from "@/lib/video/anh-bia";
import { xetQuyenXem, type NguoiXem, type VideoCongKhai } from "@/lib/video/quyen-xem";
import { HopDangNhap } from "@/components/video/HopDangNhap";
import { NutChiaSe } from "@/components/video/nut-chia-se";

/* ─── Kiểu lọc / sắp xếp ─── */

type SapXep = "moi-nhat" | "cu-nhat" | "ten-a-z" | "dai-truoc" | "ngan-truoc";
type LocKhung = "tat-ca" | "doc" | "ngang";
type LocQuyen = "tat-ca" | "cong-khai" | "can-dang-nhap";

const TAT_CA = "tat-ca";

/** Nhãn NGẮN để thanh công cụ không phình — đây là chỗ hay bị rối nhất. */
const SAP_XEP: { ma: SapXep; ten: string }[] = [
  { ma: "moi-nhat", ten: "Mới nhất" },
  { ma: "cu-nhat", ten: "Cũ nhất" },
  { ma: "ten-a-z", ten: "Tên A → Z" },
  { ma: "dai-truoc", ten: "Dài trước" },
  { ma: "ngan-truoc", ten: "Ngắn trước" },
];

const LOC_KHUNG: { ma: LocKhung; ten: string }[] = [
  // Chỉ nêu tỉ lệ, không nêu chữ “dọc”/“ngang”
  { ma: "tat-ca", ten: "Mọi khổ" },
  { ma: "doc", ten: "9:16" },
  { ma: "ngang", ten: "16:9" },
];

const LOC_QUYEN: { ma: LocQuyen; ten: string }[] = [
  { ma: "tat-ca", ten: "Mọi quyền" },
  { ma: "cong-khai", ten: "Công khai" },
  { ma: "can-dang-nhap", ten: "Cần đăng nhập" },
];

/* ─── Tiện ích ─── */

/** 152 → "2:32"; không rõ thời lượng thì trả null (không hiện gì). */
function phutGiay(giay?: number | null): string | null {
  if (!giay || giay <= 0) return null;
  const m = Math.floor(giay / 60);
  const s = Math.round(giay % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Tỉ lệ khung của ô — lấy ĐÚNG kích thước thật của ảnh bìa, không ép về một khung cứng.
 *
 * Nhờ vậy ảnh dọc (1280×2276) đứng cao, ảnh ngang (1280×720) nằm thấp, đúng như thư viện ảnh
 * `/gallery`; và vì tỉ lệ có SẴN TRƯỚC khi ảnh tải xong nên cột không nhảy khi ảnh hiện ra.
 * Chưa có số (bài cũ) thì lùi về khổ hình: dọc 9:16, ngang 16:9.
 */
function tiLeAnh(v: VideoCongKhai): string {
  const w = v.thumbnail_width ?? 0;
  const h = v.thumbnail_height ?? 0;
  if (w > 0 && h > 0) return `${w} / ${h}`;
  return v.khung_hinh === "doc" ? "9 / 16" : "16 / 9";
}

/**
 * Bỏ dấu tiếng Việt để tìm cho dễ: gõ "mang den" hay "măng đen" đều ra kết quả.
 * Không có bước này thì người xem phải gõ đúng dấu mới tìm được.
 */
function boDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** So thời lượng; bài chưa rõ thời lượng luôn bị đẩy xuống cuối, dù sắp tăng hay giảm. */
function soSanhThoiLuong(a: VideoCongKhai, b: VideoCongKhai, tangDan: boolean): number {
  const x = a.duration && a.duration > 0 ? a.duration : null;
  const y = b.duration && b.duration > 0 ? b.duration : null;
  if (x === null && y === null) return 0;
  if (x === null) return 1;
  if (y === null) return -1;
  return tangDan ? x - y : y - x;
}

const NUT = "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors";
const NUT_CHON = "border-primary bg-primary text-primary-foreground";
const NUT_THUONG = "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground";
const NUT_CHON_PHU = "border-foreground/40 bg-muted text-foreground";

interface Props {
  videos: VideoCongKhai[];
  nguoi: NguoiXem;
}

/**
 * Lưới video công khai — kiểu thư viện ảnh `/gallery`: lề hẹp, cột theo bề rộng màn hình, và
 * **chiều cao mỗi ô theo đúng tỉ lệ ảnh bìa** (xếp kiểu khối xây, không ép ô vuông cứng).
 *
 * Có đủ **danh mục · tìm · lọc · sắp xếp**, chạy ngay trên trình duyệt nên gõ là ra, không phải
 * chờ máy chủ. Điều kiện đang lọc được ghi lên địa chỉ trang (`?q=&dm=&kh=&qx=&sx=`) nên **nút
 * chia sẻ gửi đi đúng danh sách đang xem**, người nhận mở ra là thấy y hệt.
 *
 * Video bị khoá vẫn HIỆN (biết có gì) nhưng phủ ổ khoá; bấm vào thì hiện hộp đăng nhập ngay tại
 * chỗ. Video mở được thì bấm vào là vào luồng xem đứng đúng bài đó.
 */
export function LuoiVideoCongKhai({ videos, nguoi }: Props) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [loc, setLoc] = useState<string>(TAT_CA);
  const [locKhung, setLocKhung] = useState<LocKhung>(TAT_CA);
  const [locQuyen, setLocQuyen] = useState<LocQuyen>(TAT_CA);
  const [sapXep, setSapXep] = useState<SapXep>("moi-nhat");
  const [videoKhoa, setVideoKhoa] = useState<VideoCongKhai | null>(null);
  const [moLoc, setMoLoc] = useState(false);
  /** Ô tìm kiếm đang mở rộng cả hàng (màn hình nhỏ) — gõ cho thoáng, không bị chen vào nút. */
  const [moTim, setMoTim] = useState(false);
  /** Đã đọc xong điều kiện trên địa chỉ chưa — chưa đọc xong thì không được ghi đè địa chỉ. */
  const daDoc = useRef(false);

  /* Điều kiện nằm trên địa chỉ trang → mở link ai đó chia sẻ là ra đúng danh sách đó. */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q");
    const dm = p.get("dm");
    const kh = p.get("kh");
    const qx = p.get("qx");
    const sx = p.get("sx");
    if (q) setTuKhoa(q);
    if (dm) setLoc(dm);
    if (kh === "doc" || kh === "ngang" || kh === "tat-ca") setLocKhung(kh);
    if (qx === "cong-khai" || qx === "can-dang-nhap" || qx === "tat-ca") setLocQuyen(qx);
    if (sx && SAP_XEP.some((s) => s.ma === sx)) setSapXep(sx as SapXep);
    if (q || dm || kh || qx) setMoLoc(true);
    daDoc.current = true;
  }, []);

  const thamSo = useMemo(() => {
    const p = new URLSearchParams();
    if (tuKhoa.trim()) p.set("q", tuKhoa.trim());
    if (loc !== TAT_CA) p.set("dm", loc);
    if (locKhung !== TAT_CA) p.set("kh", locKhung);
    if (locQuyen !== TAT_CA) p.set("qx", locQuyen);
    if (sapXep !== "moi-nhat") p.set("sx", sapXep);
    return p.toString();
  }, [tuKhoa, loc, locKhung, locQuyen, sapXep]);

  useEffect(() => {
    if (!daDoc.current) return;
    const duong = thamSo ? `${window.location.pathname}?${thamSo}` : window.location.pathname;
    window.history.replaceState(null, "", duong);
  }, [thamSo]);

  /*
   * Danh mục + SỐ BÀI của từng danh mục, đếm theo ĐÚNG điều kiện đang xem (từ khoá, khổ, quyền)
   * nhưng BỎ QUA chính bộ lọc danh mục — nhờ vậy con số trên chip luôn khớp số bài hiện ra khi
   * bấm vào. Thứ tự theo khai báo trong DANH_MUC để thanh danh mục không nhảy chỗ giữa các lần lọc.
   */
  const nhom = useMemo(() => {
    const dem = new Map<string, number>();
    const tk = boDau(tuKhoa.trim());
    videos.forEach((v) => {
      if (locKhung !== TAT_CA && (v.khung_hinh || "") !== locKhung) return;
      const kq = xetQuyenXem(v, nguoi);
      if (locQuyen === "cong-khai" && !kq.mo) return;
      if (locQuyen === "can-dang-nhap" && kq.mo) return;
      if (tk && !boDau(`${v.title} ${v.description || ""}`).includes(tk)) return;
      const k = v.danh_muc || "";
      dem.set(k, (dem.get(k) || 0) + 1);
    });
    const thuTu = (slug: string) => {
      const i = DANH_MUC.findIndex((d) => d.slug === slug);
      return i === -1 ? DANH_MUC.length : i;
    };
    return [...dem.entries()]
      .map(([slug, so]) => ({ slug, so, ten: tenDanhMuc(slug) || "Khác" }))
      .sort((a, b) => thuTu(a.slug) - thuTu(b.slug) || b.so - a.so);
  }, [videos, tuKhoa, locKhung, locQuyen, nguoi]);

  /** Kho có nhiều hơn một danh mục thì thanh danh mục mới đáng hiện. */
  const soDanhMuc = useMemo(() => new Set(videos.map((v) => v.danh_muc || "")).size, [videos]);
  /** Tổng bài khớp điều kiện (chưa tính bộ lọc danh mục) — con số của chip “Tất cả”. */
  const tongNhom = nhom.reduce((t, n) => t + n.so, 0);
  /**
   * Danh mục đang chọn LUÔN hiện, kể cả khi đang tìm từ khoá mà danh mục đó ra 0 bài —
   * không thì chip biến mất và người xem tưởng mất lựa chọn.
   */
  const nhomHien = nhom.filter((n) => n.so > 0 || n.slug === loc);

  const ketQua = useMemo(() => {
    const tk = boDau(tuKhoa.trim());
    const ds = videos.filter((v) => {
      if (loc !== TAT_CA && (v.danh_muc || "") !== loc) return false;
      if (locKhung !== TAT_CA && (v.khung_hinh || "") !== locKhung) return false;

      const kq = xetQuyenXem(v, nguoi);
      if (locQuyen === "cong-khai" && !kq.mo) return false;
      if (locQuyen === "can-dang-nhap" && kq.mo) return false;

      if (tk && !boDau(`${v.title} ${v.description || ""}`).includes(tk)) return false;
      return true;
    });

    return [...ds].sort((a, b) => {
      switch (sapXep) {
        case "cu-nhat":
          return (a.created_at || "").localeCompare(b.created_at || "");
        case "ten-a-z":
          return a.title.localeCompare(b.title, "vi");
        case "dai-truoc":
          return soSanhThoiLuong(a, b, false);
        case "ngan-truoc":
          return soSanhThoiLuong(a, b, true);
        case "moi-nhat":
        default:
          return (b.created_at || "").localeCompare(a.created_at || "");
      }
    });
  }, [videos, tuKhoa, loc, locKhung, locQuyen, sapXep, nguoi]);

  const soKhoa = useMemo(
    () => videos.reduce((t, v) => t + (xetQuyenXem(v, nguoi).mo ? 0 : 1), 0),
    [videos, nguoi]
  );

  const soLoc =
    (loc !== TAT_CA ? 1 : 0) + (locKhung !== TAT_CA ? 1 : 0) + (locQuyen !== TAT_CA ? 1 : 0);
  const dangLoc = tuKhoa.trim() !== "" || soLoc > 0;

  const xoaLoc = () => {
    setTuKhoa("");
    setLoc(TAT_CA);
    setLocKhung(TAT_CA);
    setLocQuyen(TAT_CA);
  };

  /** Tiêu đề + đường dẫn để chia sẻ danh sách đang xem */
  const chiaSeDanhSach = useMemo(() => {
    const phan: string[] = [];
    if (tuKhoa.trim()) phan.push(`từ khoá “${tuKhoa.trim()}”`);
    if (loc !== TAT_CA) phan.push(tenDanhMuc(loc) || "danh mục khác");
    if (locKhung !== TAT_CA) phan.push(locKhung === "doc" ? "khổ dọc" : "khổ ngang");
    if (locQuyen === "cong-khai") phan.push("xem công khai");
    if (locQuyen === "can-dang-nhap") phan.push("cần đăng nhập");
    const tieuDe = phan.length
      ? `Kho video NOOI — ${phan.join(" · ")} (${ketQua.length} bài)`
      : `Kho video NOOI (${ketQua.length} bài)`;
    return { tieuDe, duong: `/video${thamSo ? `?${thamSo}` : ""}` };
  }, [tuKhoa, loc, locKhung, locQuyen, ketQua.length, thamSo]);

  if (videos.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Kho video đang được cập nhật.
      </p>
    );
  }

  return (
    <div>
      {/* ── Thanh công cụ gọn: tìm · sắp xếp · lọc · chia sẻ ── */}
      <div className="mb-3 rounded-[14px] border border-border bg-card/60 p-2">
        <div className="flex items-center gap-1.5">
          {/* Màn hình nhỏ: bấm vào ô tìm là nó chiếm CẢ HÀNG, các nút khác tạm ẩn — gõ chữ cho
              thoáng. Màn hình lớn thì không cần, chỗ vốn đã đủ. */}
          {moTim && (
            <button
              type="button"
              onClick={() => {
                setMoTim(false);
                setTuKhoa("");
              }}
              aria-label="Đóng tìm kiếm"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-muted-foreground transition-colors hover:text-foreground sm:hidden"
            >
              <X size={15} />
            </button>
          )}

          <label className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              onFocus={() => setMoTim(true)}
              placeholder={moTim ? "Gõ tên hoặc mô tả video…" : "Tìm video… (không dấu cũng ra)"}
              aria-label="Tìm video"
              className={cn(
                "w-full rounded-full border bg-background outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-2 focus:ring-primary/25",
                moTim ? "border-primary/50 py-2.5 pl-10 pr-3 text-sm" : "border-border py-1.5 pl-8 pr-3 text-[13px]"
              )}
            />
          </label>

          <div className={cn("flex items-center gap-1.5", moTim && "hidden sm:flex")}>
            <select
              value={sapXep}
              onChange={(e) => setSapXep(e.target.value as SapXep)}
              aria-label="Sắp xếp"
              title="Sắp xếp"
              className="max-w-[112px] shrink-0 rounded-full border border-white/15 bg-background px-2.5 py-1.5 text-[13px] outline-none transition-colors focus:border-primary/60"
            >
              {SAP_XEP.map((s) => (
                <option key={s.ma} value={s.ma}>
                  {s.ten}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setMoLoc((x) => !x)}
              aria-expanded={moLoc}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                soLoc > 0 ? NUT_CHON : "border-white/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListFilter size={14} />
              Lọc
              {soLoc > 0 && (
                <span className="rounded-full bg-primary-foreground/25 px-1.5 text-[10px] leading-4">{soLoc}</span>
              )}
            </button>

            <NutChiaSe
              tieuDe={chiaSeDanhSach.tieuDe}
              duong={chiaSeDanhSach.duong}
              nhan={`Chia sẻ danh sách đang xem (${ketQua.length} bài)`}
              co={14}
              className="size-8 shrink-0 rounded-full border border-white/15 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            />
          </div>
        </div>

        {/* ── Thanh danh mục NẰM NGAY DƯỚI ô tìm kiếm: bấm một cái là lọc, không phải mở “Lọc”.
            Số trong ngoặc là số bài THẬT của danh mục theo điều kiện đang xem — “AI Cảnh Báo(2)”.
            Máy nhỏ thì hàng này cuộn ngang (thanh cuộn ẩn) chứ không xuống dòng cho rối. */}
        {soDanhMuc > 1 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setLoc(TAT_CA)}
              aria-pressed={loc === TAT_CA}
              className={`${NUT} shrink-0 whitespace-nowrap ${loc === TAT_CA ? NUT_CHON : NUT_THUONG}`}
            >
              Tất cả<span className="tabular-nums opacity-70">({tongNhom})</span>
            </button>
            {nhomHien.map((n) => (
              <button
                key={n.slug}
                type="button"
                onClick={() => setLoc(n.slug)}
                aria-pressed={loc === n.slug}
                title={`${n.ten} — ${n.so} video`}
                className={`${NUT} shrink-0 whitespace-nowrap ${loc === n.slug ? NUT_CHON : NUT_THUONG}`}
              >
                {n.ten}
                <span className="tabular-nums opacity-70">({n.so})</span>
              </button>
            ))}
          </div>
        )}

        {/* Bảng lọc — chỉ mở khi cần, để danh sách video được ưu tiên chỗ */}
        {moLoc && (
          <div className="mt-2 space-y-2 border-t border-border pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {LOC_KHUNG.map((k) => (
                <button
                  key={k.ma}
                  type="button"
                  onClick={() => setLocKhung(k.ma)}
                  aria-pressed={locKhung === k.ma}
                  className={`${NUT} ${locKhung === k.ma ? NUT_CHON_PHU : NUT_THUONG}`}
                >
                  {k.ten}
                </button>
              ))}
              <span className="mx-0.5 h-3.5 w-px bg-border" />
              {LOC_QUYEN.map((q) => (
                <button
                  key={q.ma}
                  type="button"
                  onClick={() => setLocQuyen(q.ma)}
                  aria-pressed={locQuyen === q.ma}
                  className={`${NUT} ${locQuyen === q.ma ? NUT_CHON_PHU : NUT_THUONG}`}
                >
                  {q.ma === "can-dang-nhap" ? (
                    <span className="inline-flex items-center gap-1">
                      <Lock size={10} />
                      {q.ten}
                    </span>
                  ) : (
                    q.ten
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
          <span>
            Đang hiện <b className="text-foreground">{ketQua.length}</b>/{videos.length} bài
            {soKhoa > 0 && (
              <>
                {" · "}
                <Lock size={10} className="inline text-primary" /> {soKhoa} bài cần quyền
              </>
            )}
          </span>
          {dangLoc && (
            <button
              type="button"
              onClick={xoaLoc}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 hover:text-foreground"
            >
              <RotateCcw size={10} />
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* ── Lưới kiểu khối xây: chiều cao mỗi ô theo đúng tỉ lệ ảnh bìa ── */}
      {ketQua.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Không có bài nào khớp điều kiện đang lọc.</p>
          <button type="button" onClick={xoaLoc} className="mt-3 text-xs text-primary hover:underline">
            Xoá lọc để xem tất cả
          </button>
        </div>
      ) : (
        <div className="luoi-masonry">
          {ketQua.map((v, i) => {
            const kq = xetQuyenXem(v, nguoi);
            const thoiLuong = phutGiay(v.duration);
            const bia = anhBia(v.thumbnail_url, { rong: 400 });

            const trong = (
              <>
                <span
                  className="relative block w-full overflow-hidden bg-black/50"
                  style={{ aspectRatio: tiLeAnh(v) }}
                >
                  {bia ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      /* Ảnh bìa gốc 100–450 KB — xin bản dịch của Supabase (≈47 KB ở 400 px, đo thật
                         26/11/2026). Hai cỡ 320w/640w để máy nét lấy bản nét hơn. */
                      src={bia}
                      srcSet={anhBiaSrcSet(v.thumbnail_url) ?? undefined}
                      sizes="(max-width: 460px) 46vw, (max-width: 720px) 31vw, (max-width: 1040px) 24vw, (max-width: 1420px) 19vw, 16vw"
                      alt={v.title}
                      loading={i < 6 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Play size={26} />
                    </span>
                  )}

                  {/* Viền trong mờ: tách ảnh khỏi nền, ảnh trông “có khung” chứ không dán phẳng */}
                  <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),inset_0_-40px_50px_-30px_rgba(0,0,0,0.65)]" />

                  {/* Nhãn “Dọc/Ngang” đã bỏ (yêu cầu 26/11/2026) — chiều cao ô đã tự nói lên
                      khổ của video, thêm chữ chỉ rối. */}

                  {thoiLuong && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/95 ring-1 ring-white/15">
                      {thoiLuong}
                    </span>
                  )}

                  {/* Mở được: nút phát hiện khi rê chuột */}
                  {kq.mo ? (
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex size-12 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-xl ring-1 ring-white/25">
                        <Play size={18} className="ml-0.5" />
                      </span>
                    </span>
                  ) : (
                    // Bị khoá: phủ ổ khoá + nhãn lý do
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
                      <span className="flex size-12 items-center justify-center rounded-full bg-black/75 text-white ring-1 ring-white/25">
                        <Lock size={18} />
                      </span>
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground shadow">
                        {kq.nhan || "Cần quyền"}
                      </span>
                    </span>
                  )}
                </span>

                {/* Phần chữ TÁCH HẲN khỏi phần ảnh: có vạch ngăn, nền đặc, chữ đậm hơn.
                    Thời lượng chỉ để MỘT chỗ — trên ảnh (góc phải-dưới), không lặp lại ở đây. */}
                <span className="block border-t border-white/10 bg-card px-3 py-2.5">
                  <span className="line-clamp-2 block text-[13.5px] font-semibold leading-snug tracking-tight text-foreground">
                    {v.title}
                  </span>
                  {v.danh_muc && (
                    <span className="mt-1.5 inline-block max-w-full truncate rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {tenDanhMuc(v.danh_muc)}
                    </span>
                  )}
                </span>
              </>
            );

            const lopNgoai =
              "group block overflow-hidden text-left transition-colors";

            // Bọc ngoài là <div> để nút chia sẻ nằm CẠNH vùng bấm chính (nút lồng trong nút / thẻ
            // <a> là HTML sai và bấm sẽ loạn). Viền đặt ở vỏ ngoài cho cả ảnh lẫn chữ cùng một khung.
            return (
              <div key={v.id} className="o-masonry relative mb-3.5">
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-card shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] transition-colors hover:border-primary/60">
                  {kq.mo ? (
                    <Link href={`/video/${v.id}`} className={lopNgoai}>
                      {trong}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setVideoKhoa(v)} className={`${lopNgoai} w-full`}>
                      {trong}
                    </button>
                  )}

                  <NutChiaSe
                    tieuDe={v.title}
                    duong={`/video/${v.id}`}
                    nhan={`Chia sẻ: ${v.title}`}
                    co={13}
                    className="absolute right-2 top-2 z-10 size-8 rounded-full bg-black/65 text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-black/85"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HopDangNhap
        mo={!!videoKhoa}
        tieuDeVideo={videoKhoa?.title}
        moTa={
          videoKhoa
            ? xetQuyenXem(videoKhoa, nguoi).moTa
            : "Video này dành cho thành viên NOOI. Đăng nhập để xem tiếp."
        }
        quayLai={videoKhoa ? `/video/${videoKhoa.id}` : "/video"}
        onDong={() => setVideoKhoa(null)}
      />
    </div>
  );
}
