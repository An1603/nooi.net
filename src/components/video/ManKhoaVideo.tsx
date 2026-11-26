"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { HopDangNhap } from "@/components/video/HopDangNhap";

interface Props {
  tieuDe: string;
  moTa: string;
  /** Ảnh bìa để người xem vẫn thấy đúng video mình đang muốn mở */
  anhBia?: string | null;
  /** Nhãn ngắn, ví dụ "Cần đăng nhập" */
  nhan: string;
  /** Mở sẵn hộp đăng nhập khi vừa vào trang (bấm từ lưới đã là ý muốn đăng nhập rồi) */
  moSanHopThoai?: boolean;
  /** Địa chỉ quay lại sau khi đăng nhập */
  quayLai: string;
}

/**
 * Màn khoá của trang xem `/video/<mã>` — dùng khi video không mở được cho người đang xem.
 * Vẫn cho thấy ảnh bìa + tên video (người xem biết mình đang thiếu gì), kèm nút đăng nhập.
 */
export function ManKhoaVideo({ tieuDe, moTa, anhBia, nhan, moSanHopThoai = false, quayLai }: Props) {
  const [mo, setMo] = useState(moSanHopThoai);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/video"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Về kho video
      </Link>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="relative aspect-video w-full bg-black/50">
          {anhBia && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={anhBia} alt={tieuDe} className="h-full w-full object-contain opacity-45 blur-[2px]" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-black/70 text-white">
              <Lock size={22} />
            </span>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              {nhan || "Cần quyền xem"}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h1 className="text-lg font-semibold leading-snug">{tieuDe}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{moTa}</p>
          <button
            type="button"
            onClick={() => setMo(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Lock size={15} />
            Đăng nhập để xem
          </button>
        </div>
      </div>

      <HopDangNhap mo={mo} tieuDeVideo={tieuDe} moTa={moTa} quayLai={quayLai} onDong={() => setMo(false)} />
    </div>
  );
}
