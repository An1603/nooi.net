"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
  ArrowUpDown,
} from "lucide-react";
import { VideoPlayer } from "@/components/content/VideoPlayer";
import { tenDanhMuc } from "@/lib/video/danh-muc";
import { NutXoa } from "./NutXoa";
import { khoiPhucNhieu, xoaNhieu, xoaVinhVienNhieu } from "./actions";

export interface MucVideo {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  url?: string | null;
  danh_muc?: string | null;
  kenh_phat?: string | null;
  khung_hinh?: string | null;
  duration?: number | null;
  thu_tu?: number | null;
  status?: string | null;
  cong_khai?: boolean | null;
  created_at: string;
  user_id?: string | null;
  tenNguoi?: string | null;
}

export interface MucChon {
  slug: string;
  ten: string;
  so: number;
}

const STATUS: Record<string, { nhan: string; lop: string }> = {
  published: { nhan: "Đã xuất bản", lop: "bg-blue-500/10 text-blue-400" },
  ready: { nhan: "Sẵn sàng", lop: "bg-emerald-500/10 text-emerald-400" },
  processing: { nhan: "Đang xử lý", lop: "bg-amber-500/10 text-amber-400" },
  failed: { nhan: "Thất bại", lop: "bg-red-500/10 text-red-400" },
};

const KENH: Record<string, string> = {
  youtube: "YouTube",
  bunny: "Bunny",
  "truc-tiep": "Tệp trực tiếp",
};

function thoiLuong(giay?: number | null) {
  if (!giay) return "—";
  const m = Math.floor(giay / 60);
  const s = giay % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * BẢNG QUẢN TRỊ KHO VIDEO (phía trình duyệt) — chọn nhiều · xem thử · xoá hàng loạt · lọc theo danh mục.
 *
 * Vì sao phải là thành phần phía trình duyệt: chọn nhiều dòng và mở khung xem thử là trạng thái
 * sống trên màn hình. Dữ liệu vẫn do trang máy chủ truyền xuống (đọc bằng khoá dịch vụ), phần ở đây
 * chỉ hiển thị và gọi server action.
 */
export function BangVideoQuanTri({
  videos,
  dm,
  q,
  danhSach,
  tong,
  thungRac = false,
}: {
  videos: MucVideo[];
  dm: string;
  q: string;
  danhSach: MucChon[];
  tong: number;
  thungRac?: boolean;
}) {
  const [daChon, setDaChon] = useState<string[]>([]);
  const [xemThu, setXemThu] = useState<MucVideo | null>(null);
  const [moXoa, setMoXoa] = useState(false);
  const [xoaBunny, setXoaBunny] = useState(true);
  const [dangXoa, batDau] = useTransition();
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState("");

  const chonHet = daChon.length > 0 && daChon.length === videos.length;
  const coBunny = useMemo(
    () => videos.some((v) => daChon.includes(v.id) && v.kenh_phat === "bunny"),
    [videos, daChon]
  );

  function doiChon(id: string) {
    setDaChon((cu) => (cu.includes(id) ? cu.filter((x) => x !== id) : [...cu, id]));
  }

  function chonTatCa() {
    setDaChon(chonHet ? [] : videos.map((v) => v.id));
  }

  /** Lọc danh mục: chọn là ĐI NGAY, không phải bấm thêm nút "Lọc". */
  function doiDanhMuc(giaTri: string) {
    const p = new URLSearchParams();
    if (giaTri) p.set("dm", giaTri);
    if (q) p.set("q", q);
    // Tải cả trang: đường dẫn mới cần dữ liệu mới, không dùng lại gói đã đệm
    window.location.assign(`/admin/videos${p.toString() ? `?${p}` : ""}`);
  }

  function xacNhanXoa() {
    setLoi("");
    setKetQua("");
    batDau(async () => {
      // Ở thùng rác thì đây là XOÁ VĨNH VIỄN; ở danh sách thường chỉ là chuyển vào thùng rác
      const kq = thungRac
        ? await xoaVinhVienNhieu(daChon, coBunny && xoaBunny)
        : await xoaNhieu(daChon, false);
      if (kq && "error" in kq) {
        setLoi(kq.error);
        return;
      }
      const phan: string[] = [];
      if (kq && "daXoa" in kq) {
        phan.push(`Đã xoá ${kq.daXoa ?? 0} video`);
        const soBunny = "bunny" in kq ? (kq.bunny ?? 0) : 0;
        if (soBunny) phan.push(`${soBunny} tệp trên Bunny`);
        if (kq.loi?.length) phan.push(`${kq.loi.length} bài lỗi: ${kq.loi[0]}`);
        if (thungRac) phan[0] = `Đã xoá vĩnh viễn ${kq.daXoa ?? 0} video`;
      }
      setKetQua(phan.join(" · "));
      setMoXoa(false);
      window.location.reload();
    });
  }

  /** Lấy lại MỘT video từ thùng rác (nút trên dòng). */
  function khoiPhucMot(id: string) {
    setLoi("");
    batDau(async () => {
      const kq = await khoiPhucNhieu([id]);
      if (kq && "error" in kq) {
        setLoi(kq.error);
        return;
      }
      window.location.reload();
    });
  }

  /** Lấy lại video đã chọn từ thùng rác. */
  function khoiPhuc() {
    setLoi("");
    batDau(async () => {
      const kq = await khoiPhucNhieu(daChon);
      if (kq && "error" in kq) {
        setLoi(kq.error);
        return;
      }
      setMoXoa(false);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      {/* Lọc: danh mục đi ngay khi chọn · tìm theo tiêu đề */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={dm}
          onChange={(e) => doiDanhMuc(e.target.value)}
          aria-label="Lọc theo danh mục"
          className="rounded-lg border border-border/50 bg-[#111] px-3 py-1.5 text-sm"
        >
          <option value="">Mọi danh mục ({tong})</option>
          {danhSach.map((d) => (
            <option key={d.slug || "trong"} value={d.slug}>
              {d.ten} ({d.so})
            </option>
          ))}
        </select>

        <form action="/admin/videos" className="flex flex-1 items-center gap-2">
          {dm && <input type="hidden" name="dm" value={dm} />}
          <div className="relative min-w-[180px] flex-1">
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Tìm theo tiêu đề…"
              className="w-full rounded-lg border border-border/50 bg-[#111] py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
          <button type="submit" className="rounded-lg border border-border/50 px-3 py-1.5 text-sm">
            Tìm
          </button>
        </form>

        {(dm || q) && (
          <Link href="/admin/videos" className="text-xs text-muted-foreground underline">
            Xoá lọc
          </Link>
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/admin/videos/sap-xep"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowUpDown size={15} /> Sắp xếp
          </Link>
          <Link
            href="/admin/videos/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            <Plus size={15} /> Thêm video
          </Link>
        </div>
      </div>

      {/* Thanh thao tác khi đã chọn nhiều dòng */}
      {daChon.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-2.5">
          <span className="text-sm">
            Đã chọn <strong>{daChon.length}</strong> video
          </span>
          {thungRac ? (
            <>
              <button
                type="button"
                onClick={khoiPhuc}
                disabled={dangXoa}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {dangXoa ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Khôi phục
              </button>
              <button
                type="button"
                onClick={() => setMoXoa(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                <Trash2 size={14} /> Xoá vĩnh viễn
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMoXoa(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              <Trash2 size={14} /> Chuyển vào thùng rác
            </button>
          )}
          <button
            type="button"
            onClick={() => setDaChon([])}
            className="text-xs text-muted-foreground underline"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {ketQua && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {ketQua}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border/50 bg-[#0d0d0d]">
        {videos.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Không có video nào khớp bộ lọc.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={chonHet}
                      onChange={chonTatCa}
                      aria-label="Chọn tất cả"
                      className="size-4 accent-[var(--primary)]"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Video</th>
                  <th className="hidden px-3 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
                    Danh mục
                  </th>
                  <th className="hidden px-3 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                    Người đăng
                  </th>
                  <th className="hidden px-3 py-3 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                    Thứ tự
                  </th>
                  <th className="hidden px-3 py-3 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                    Kênh
                  </th>
                  <th className="hidden px-3 py-3 text-center text-xs font-medium text-muted-foreground sm:table-cell">
                    Trạng thái
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">Việc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {videos.map((v) => {
                  const st = STATUS[v.status ?? ""] ?? STATUS.processing;
                  const chon = daChon.includes(v.id);
                  return (
                    <tr key={v.id} className={chon ? "bg-primary/[0.06]" : "hover:bg-white/[0.02]"}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={chon}
                          onChange={() => doiChon(v.id)}
                          aria-label={`Chọn “${v.title}”`}
                          className="size-4 accent-[var(--primary)]"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setXemThu(v)}
                            title="Xem thử"
                            className="group relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-red-500/10"
                          >
                            {v.thumbnail_url ? (
                              <Image
                                src={v.thumbnail_url}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Play className="size-4 text-red-400" />
                            )}
                            <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="size-4 text-white" />
                            </span>
                          </button>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/videos/${v.id}/edit`}
                              className="line-clamp-1 text-sm font-medium hover:text-primary"
                            >
                              {v.title}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {v.khung_hinh === "doc" ? "9:16" : "16:9"} · {thoiLuong(v.duration)} ·{" "}
                              {v.cong_khai ? "công khai" : "nội bộ"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                        {v.danh_muc ? tenDanhMuc(v.danh_muc) : "—"}
                      </td>

                      <td className="hidden px-3 py-3 text-xs lg:table-cell">
                        <Link
                          href={`/admin/users/${v.user_id}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <Users className="size-3 text-muted-foreground" />
                          {v.tenNguoi || String(v.user_id ?? "").slice(0, 8)}
                        </Link>
                      </td>

                      <td className="hidden px-3 py-3 text-center text-xs sm:table-cell">{v.thu_tu ?? 0}</td>

                      <td className="hidden px-3 py-3 text-center text-xs text-muted-foreground sm:table-cell">
                        {KENH[v.kenh_phat ?? ""] ?? "—"}
                      </td>

                      <td className="hidden px-3 py-3 text-center sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${st.lop}`}>{st.nhan}</span>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setXemThu(v)}
                            className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-[11px] hover:text-primary"
                          >
                            <Eye size={12} /> Xem
                          </button>
                          <Link
                            href={`/admin/videos/${v.id}/edit`}
                            className="rounded-md border border-border/50 px-2 py-1 text-[11px] hover:text-primary"
                          >
                            Sửa
                          </Link>
                          {thungRac ? (
                            <>
                              <button
                                type="button"
                                onClick={() => khoiPhucMot(v.id)}
                                className="rounded-md border border-emerald-500/40 px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/10"
                              >
                                Khôi phục
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDaChon([v.id]);
                                  setMoXoa(true);
                                }}
                                className="rounded-md border border-red-500/40 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10"
                              >
                                Xoá hẳn
                              </button>
                            </>
                          ) : (
                            <NutXoa id={v.id} tieuDe={v.title} laBunny={v.kenh_phat === "bunny"} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* XEM THỬ: dùng đúng trình phát của trang xem nên thấy y hệt khán giả thấy */}
      {xemThu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xem thử video"
          onClick={() => setXemThu(null)}
        >
          <div
            className="max-h-full w-full max-w-3xl overflow-auto rounded-xl border border-border/50 bg-[#0d0d0d] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-sm font-semibold">{xemThu.title}</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {KENH[xemThu.kenh_phat ?? ""] ?? "—"} · {xemThu.khung_hinh === "doc" ? "9:16" : "16:9"} ·{" "}
                  {xemThu.status === "published" ? "đã xuất bản" : "chưa xuất bản (chỉ quản trị thấy)"}
                </p>
              </div>
              <button type="button" onClick={() => setXemThu(null)} aria-label="Đóng">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <VideoPlayer video={xemThu} khungHinh={xemThu.khung_hinh} />

            <div className="mt-3 flex items-center justify-end gap-2">
              <Link
                href={`/admin/videos/${xemThu.id}/edit`}
                className="rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Sửa video này
              </Link>
              <button
                type="button"
                onClick={() => setXemThu(null)}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XOÁ NHIỀU */}
      {moXoa && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xoá nhiều video"
        >
          <div className="w-full max-w-md rounded-xl border border-border/50 bg-[#0d0d0d] p-5">
            <h2 className="text-sm font-semibold">
              {thungRac
                ? `Xoá VĨNH VIỄN ${daChon.length} video?`
                : `Chuyển ${daChon.length} video vào thùng rác?`}
            </h2>
            <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-xs text-muted-foreground">
              {videos
                .filter((v) => daChon.includes(v.id))
                .map((v) => (
                  <li key={v.id} className="line-clamp-1">
                    • {v.title}
                    {v.kenh_phat === "bunny" && <span className="text-emerald-400"> (Bunny)</span>}
                  </li>
                ))}
            </ul>

            {coBunny && (
              <label className="mt-3 flex items-start gap-2 rounded-lg border border-border/40 bg-[#111] p-3 text-sm">
                <input
                  type="checkbox"
                  checked={xoaBunny}
                  onChange={(e) => setXoaBunny(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                />
                <span>
                  Xoá cả bản gốc trên <strong>Bunny Stream</strong>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    Bỏ chọn nếu chỉ muốn gỡ khỏi web và giữ tệp trên Bunny.
                  </span>
                </span>
              </label>
            )}

            <p className="mt-3 text-[11px] text-muted-foreground">
              {thungRac
                ? "Xoá khỏi cơ sở dữ liệu là KHÔNG khôi phục được."
                : "Video sẽ nằm trong thùng rác — lấy lại được bất cứ lúc nào."}
            </p>

            {loi && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {loi}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoXoa(false)}
                className="rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={xacNhanXoa}
                disabled={dangXoa}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {dangXoa ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {thungRac ? "Xoá vĩnh viễn" : "Chuyển vào thùng rác"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
