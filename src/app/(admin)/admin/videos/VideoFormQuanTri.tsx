"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { DANH_MUC } from "@/lib/video/danh-muc";
import { taoVideo, suaVideo } from "./actions";

export interface DuLieuVideo {
  id?: string;
  title?: string | null;
  description?: string | null;
  danh_muc?: string | null;
  url?: string | null;
  kenh_phat?: string | null;
  status?: string | null;
  cong_khai?: boolean | null;
  khung_hinh?: string | null;
  thu_tu?: number | null;
  thumbnail_url?: string | null;
}

const O_NHAP =
  "w-full rounded-lg border border-border/50 bg-[#111] px-3 py-2 text-sm outline-none focus:border-primary/60";
const NHAN = "block text-xs font-medium text-muted-foreground mb-1.5";

/**
 * Form THÊM / SỬA video của khu quản trị.
 *
 * Dùng chung cho hai trang (`/admin/videos/new` và `/admin/videos/[id]/edit`) để chỉ có một chỗ
 * khai báo trường — thêm trường mới sau này không phải sửa hai nơi rồi lệch nhau.
 */
export function VideoFormQuanTri({ banDau = {} }: { banDau?: DuLieuVideo }) {
  const sua = !!banDau.id;
  const [dangLuu, batDau] = useTransition();
  const [loi, setLoi] = useState("");

  function gui(formData: FormData) {
    setLoi("");
    batDau(async () => {
      const kq = sua ? await suaVideo(banDau.id!, formData) : await taoVideo(formData);
      if (kq && "error" in kq) {
        setLoi(kq.error);
        return;
      }
      // Điều hướng CỨNG về danh sách: `router.push` + `router.refresh()` vẫn có lúc dùng lại gói
      // dữ liệu đã đệm của trang danh sách nên video vừa lưu không hiện ra (đã gặp 27/11/2026).
      // Tải lại cả trang là chắc chắn đúng — khu quản trị không cần chuyển trang mượt.
      window.location.assign("/admin/videos");
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/videos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Kho video
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{sua ? "Sửa video" : "Thêm video"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sua ? banDau.title : "Dán đường dẫn phát (YouTube · Bunny · tệp .mp4) rồi chọn đúng kênh phát."}
          </p>
        </div>
      </div>

      <form
        action={gui}
        className="space-y-5 rounded-xl border border-border/50 bg-[#0d0d0d] p-5"
      >
        <div>
          <label className={NHAN} htmlFor="title">
            Tiêu đề *
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={banDau.title ?? ""}
            className={O_NHAP}
            placeholder="Ví dụ: Măng Đen — Quy hoạch phân khu MĐ1 đến 2045"
          />
        </div>

        <div>
          <label className={NHAN} htmlFor="description">
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={banDau.description ?? ""}
            className={O_NHAP}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={NHAN} htmlFor="danh_muc">
              Danh mục
            </label>
            <select id="danh_muc" name="danh_muc" defaultValue={banDau.danh_muc ?? ""} className={O_NHAP}>
              <option value="">Không xếp danh mục</option>
              {DANH_MUC.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.ten}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={NHAN} htmlFor="thu_tu">
              Thứ tự trong danh mục
            </label>
            <input
              id="thu_tu"
              name="thu_tu"
              type="number"
              min={0}
              max={9999}
              defaultValue={banDau.thu_tu ?? 0}
              className={O_NHAP}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Số lớn đứng trước (bài ghim = 1000). Đổi nhanh bằng nút ↑↓ ở trang Sắp xếp thứ tự.
            </p>
          </div>
        </div>

        <div>
          <label className={NHAN} htmlFor="url">
            Đường dẫn phát
          </label>
          <input
            id="url"
            name="url"
            defaultValue={banDau.url ?? ""}
            className={O_NHAP}
            placeholder="https://player.mediadelivery.net/embed/<thư-viện>/<mã> · https://youtu.be/... · https://.../phim.mp4"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={NHAN} htmlFor="kenh_phat">
              Kênh phát
            </label>
            <select id="kenh_phat" name="kenh_phat" defaultValue={banDau.kenh_phat ?? "youtube"} className={O_NHAP}>
              <option value="youtube">YouTube</option>
              <option value="bunny">Bunny Stream</option>
              <option value="truc-tiep">Tệp trực tiếp (.mp4 · .m3u8)</option>
            </select>
          </div>

          <div>
            <label className={NHAN} htmlFor="khung_hinh">
              Khổ hình
            </label>
            <select id="khung_hinh" name="khung_hinh" defaultValue={banDau.khung_hinh ?? "ngang"} className={O_NHAP}>
              <option value="ngang">Ngang (16:9)</option>
              <option value="doc">Dọc (9:16) — vào luồng vuốt</option>
            </select>
          </div>

          <div>
            <label className={NHAN} htmlFor="status">
              Trạng thái
            </label>
            <select id="status" name="status" defaultValue={banDau.status ?? "published"} className={O_NHAP}>
              <option value="published">Đã xuất bản (hiện trong kho)</option>
              <option value="ready">Sẵn sàng (chưa hiện)</option>
              <option value="processing">Đang xử lý</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>

          <div>
            <label className={NHAN} htmlFor="thumbnail_url">
              Ảnh bìa (tuỳ chọn)
            </label>
            <input
              id="thumbnail_url"
              name="thumbnail_url"
              defaultValue={banDau.thumbnail_url ?? ""}
              className={O_NHAP}
              placeholder="https://…/anh-bia.jpg"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="cong_khai"
            defaultChecked={!!banDau.cong_khai}
            className="size-4 accent-[var(--primary)]"
          />
          Công khai — ai cũng xem được, không cần đăng nhập
        </label>

        {loi && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {loi}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={dangLuu}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {dangLuu ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {sua ? "Lưu thay đổi" : "Thêm video"}
          </button>
          <Link
            href="/admin/videos"
            className="rounded-lg border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Huỷ
          </Link>
        </div>
      </form>
    </div>
  );
}
