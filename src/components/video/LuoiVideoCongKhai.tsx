"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListFilter, Lock, Play, RotateCcw, Search } from "lucide-react";
import { tenDanhMuc } from "@/lib/video/danh-muc";
import { anhBia, anhBiaSrcSet } from "@/lib/video/anh-bia";
import { xetQuyenXem, type NguoiXem, type VideoCongKhai } from "@/lib/video/quyen-xem";
import { HopDangNhap } from "@/components/video/HopDangNhap";

/* ─── Kiểu lọc / sắp xếp ─── */

type SapXep = "moi-nhat" | "cu-nhat" | "ten-a-z" | "dai-truoc" | "ngan-truoc";
type LocKhung = "tat-ca" | "doc" | "ngang";
type LocQuyen = "tat-ca" | "cong-khai" | "can-dang-nhap";

const TAT_CA = "tat-ca";

const SAP_XEP: { ma: SapXep; ten: string }[] = [
  { ma: "moi-nhat", ten: "Mới nhất trước" },
  { ma: "cu-nhat", ten: "Cũ nhất trước" },
  { ma: "ten-a-z", ten: "Tên A → Z" },
  { ma: "dai-truoc", ten: "Thời lượng dài trước" },
  { ma: "ngan-truoc", ten: "Thời lượng ngắn trước" },
];

const LOC_KHUNG: { ma: LocKhung; ten: string }[] = [
  { ma: "tat-ca", ten: "Mọi khổ hình" },
  { ma: "doc", ten: "Dọc 9:16" },
  { ma: "ngang", ten: "Ngang 16:9" },
];

const LOC_QUYEN: { ma: LocQuyen; ten: string }[] = [
  { ma: "tat-ca", ten: "Mọi quyền xem" },
  { ma: "cong-khai", ten: "Xem công khai" },
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

const NUT = "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
const NUT_CHON = "border-primary bg-primary text-primary-foreground";
const NUT_THUONG = "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground";
const NUT_CHON_PHU = "border-foreground/40 bg-muted text-foreground";

interface Props {
  videos: VideoCongKhai[];
  nguoi: NguoiXem;
}

/**
 * Lưới video công khai — kiểu xem như `/gallery` (lưới đều nhau) nhưng giữ đúng nhận diện NOOI:
 * token màu của hệ thống, bo góc 14px như thư viện ảnh.
 *
 * Có đủ **danh mục · tìm · lọc · sắp xếp**, chạy ngay trên trình duyệt nên gõ là ra, không phải
 * chờ máy chủ. Video bị khoá vẫn HIỆN (biết có gì) nhưng phủ ổ khoá; bấm vào thì hiện hộp đăng
 * nhập ngay tại chỗ. Video mở được thì bấm vào là vào luồng xem đứng đúng bài đó.
 */
export function LuoiVideoCongKhai({ videos, nguoi }: Props) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [loc, setLoc] = useState<string>(TAT_CA);
  const [locKhung, setLocKhung] = useState<LocKhung>(TAT_CA);
  const [locQuyen, setLocQuyen] = useState<LocQuyen>(TAT_CA);
  const [sapXep, setSapXep] = useState<SapXep>("moi-nhat");
  const [videoKhoa, setVideoKhoa] = useState<VideoCongKhai | null>(null);

  /** Các danh mục đang thật sự có bài (kèm số lượng) */
  const nhom = useMemo(() => {
    const dem = new Map<string, number>();
    videos.forEach((v) => {
      const k = v.danh_muc || "";
      dem.set(k, (dem.get(k) || 0) + 1);
    });
    return [...dem.entries()].map(([slug, so]) => ({ slug, so, ten: tenDanhMuc(slug) || "Khác" }));
  }, [videos]);

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

  const dangLoc = tuKhoa.trim() !== "" || loc !== TAT_CA || locKhung !== TAT_CA || locQuyen !== TAT_CA;

  const xoaLoc = () => {
    setTuKhoa("");
    setLoc(TAT_CA);
    setLocKhung(TAT_CA);
    setLocQuyen(TAT_CA);
  };

  if (videos.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Kho video đang được cập nhật.
      </p>
    );
  }

  return (
    <div>
      {/* ── Thanh công cụ: tìm · sắp xếp · danh mục · lọc ── */}
      <div className="mb-4 space-y-3 rounded-[14px] border border-border bg-card/60 p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả… (gõ không dấu cũng ra)"
              aria-label="Tìm video"
              className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
            />
          </label>

          <label className="flex items-center gap-2 sm:w-60">
            <ListFilter size={15} className="shrink-0 text-muted-foreground" />
            <select
              value={sapXep}
              onChange={(e) => setSapXep(e.target.value as SapXep)}
              aria-label="Sắp xếp"
              className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
            >
              {SAP_XEP.map((s) => (
                <option key={s.ma} value={s.ma}>
                  {s.ten}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Danh mục — chỉ hiện khi có từ 2 nhóm trở lên */}
        {nhom.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setLoc(TAT_CA)}
              className={`${NUT} ${loc === TAT_CA ? NUT_CHON : NUT_THUONG}`}
            >
              Mọi danh mục · {videos.length}
            </button>
            {nhom.map((n) => (
              <button
                key={n.slug}
                type="button"
                onClick={() => setLoc(n.slug)}
                className={`${NUT} ${loc === n.slug ? NUT_CHON : NUT_THUONG}`}
              >
                {n.ten} · {n.so}
              </button>
            ))}
          </div>
        )}

        {/* Lọc theo khổ hình và theo quyền xem */}
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
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
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
                  <Lock size={11} />
                  {q.ten}
                </span>
              ) : (
                q.ten
              )}
            </button>
          ))}
        </div>

        {/* Số lượng đang hiện + xoá lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Đang hiện <b className="text-foreground">{ketQua.length}</b>/{videos.length} bài
            {soKhoa > 0 && (
              <>
                {" · "}
                <Lock size={11} className="inline text-primary" /> {soKhoa} bài cần quyền xem
              </>
            )}
          </span>
          {dangLoc && (
            <button
              type="button"
              onClick={xoaLoc}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:text-foreground"
            >
              <RotateCcw size={11} />
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* ── Lưới ── */}
      {ketQua.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Không có bài nào khớp điều kiện đang lọc.</p>
          <button type="button" onClick={xoaLoc} className="mt-3 text-xs text-primary hover:underline">
            Xoá lọc để xem tất cả
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {ketQua.map((v, i) => {
            const kq = xetQuyenXem(v, nguoi);
            const thoiLuong = phutGiay(v.duration);
            const laDoc = v.khung_hinh === "doc";

            const lopTrong = (
              <>
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
                  {anhBia(v.thumbnail_url, { rong: 400 }) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      /* Ảnh bìa gốc 100–450 KB — xin bản dịch 400 px của Supabase (≈47 KB, đo thật
                         26/11/2026) để lưới mở nhanh. 6 thẻ đầu tải ngay, phần còn lại chờ cuộn tới. */
                      src={anhBia(v.thumbnail_url, { rong: 400 })!}
                      srcSet={anhBiaSrcSet(v.thumbnail_url) ?? undefined}
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                      alt={v.title}
                      width={400}
                      height={533}
                      loading={i < 6 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Play size={26} />
                    </span>
                  )}

                  {/* Nhãn khổ hình — biết ngay video dọc hay ngang */}
                  <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white/90">
                    {laDoc ? "Dọc" : "Ngang"}
                  </span>

                  {thoiLuong && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                      {thoiLuong}
                    </span>
                  )}

                  {/* Mở được: nút phát hiện khi rê chuột */}
                  {kq.mo ? (
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex size-11 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                        <Play size={18} className="ml-0.5" />
                      </span>
                    </span>
                  ) : (
                    // Bị khoá: phủ ổ khoá + nhãn lý do
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
                      <span className="flex size-11 items-center justify-center rounded-full bg-black/70 text-white">
                        <Lock size={18} />
                      </span>
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
                        {kq.nhan || "Cần quyền"}
                      </span>
                    </span>
                  )}
                </div>

                <div className="p-2.5">
                  <h3 className="line-clamp-2 text-[13px] font-medium leading-snug">{v.title}</h3>
                  {v.danh_muc && (
                    <p className="mt-1 text-[11px] text-muted-foreground">{tenDanhMuc(v.danh_muc)}</p>
                  )}
                </div>
              </>
            );

            const lopNgoai =
              "group block overflow-hidden rounded-[14px] border border-border bg-card text-left transition-colors hover:border-primary/50";

            // Mở được → vào luồng xem đứng đúng bài đó; bị khoá → mở hộp đăng nhập tại chỗ
            return kq.mo ? (
              <Link key={v.id} href={`/video/${v.id}`} className={lopNgoai}>
                {lopTrong}
              </Link>
            ) : (
              <button key={v.id} type="button" onClick={() => setVideoKhoa(v)} className={lopNgoai}>
                {lopTrong}
              </button>
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
