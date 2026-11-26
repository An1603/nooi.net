"use client";

import { moHopDangNhap } from "@/lib/dang-nhap-nhanh";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  lyDo?: string;
  tieuDe?: string;
  quayLai?: string;
  title?: string;
  ariaLabel?: string;
}

/**
 * Nút "mở hộp đăng nhập" — dùng được từ server component (chỉ truyền chuỗi).
 *
 * Vì sao không dùng <Link href="/login?...">: khách đang đọc dở một bài / đang xem một lưới
 * video mà bị đá sang trang khác là mất mạch. Ở đây hộp đăng nhập hiện đè lên đúng trang
 * đang xem; đăng nhập xong quay lại `quayLai` (mặc định: trang hiện tại).
 */
export function NutMoDangNhap({
  children,
  className,
  lyDo,
  tieuDe,
  quayLai,
  title,
  ariaLabel,
}: Props) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      className={className}
      onClick={() =>
        moHopDangNhap({
          lyDo,
          tieuDe,
          quayLai: quayLai ?? window.location.pathname + window.location.search,
        })
      }
    >
      {children}
    </button>
  );
}
