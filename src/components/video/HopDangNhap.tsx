"use client";

import { useEffect } from "react";
import { Lock, X } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";

interface Props {
  /** Hộp thoại có đang mở không */
  mo: boolean;
  /** Tên video đang bị khoá (nếu có) — hiện cho người xem biết mình đang muốn mở gì */
  tieuDeVideo?: string;
  /** Vì sao phải đăng nhập (lấy từ `xetQuyenXem().moTa`) */
  moTa: string;
  /** Đăng nhập xong quay lại đúng địa chỉ này */
  quayLai: string;
  onDong: () => void;
}

/**
 * Hộp thoại đăng nhập ngay trên trang (không rời trang).
 *
 * Vì sao không đẩy sang `/login`: người xem đang ở giữa lưới video, bấm một video bị khoá mà bị
 * đá sang trang khác là mất mạch. Ở đây hộp thoại hiện đè lên, đăng nhập xong quay lại ĐÚNG video
 * vừa bấm (`quayLai`), phía sau vẫn là lưới video.
 *
 * Dấu X, bấm nền, và phím Esc đều đóng được — nhưng KHÔNG đóng khi đang bấm vào chính hộp thoại.
 */
export function HopDangNhap({ mo, tieuDeVideo, moTa, quayLai, onDong }: Props) {
  // Esc để đóng
  useEffect(() => {
    if (!mo) return;
    const nghe = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDong();
    };
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  }, [mo, onDong]);

  if (!mo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đăng nhập để xem video"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10 backdrop-blur-sm"
      onClick={onDong}
    >
      <div
        className="relative w-full max-w-md rounded-[14px] border border-border bg-background p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDong}
          aria-label="Đóng"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex items-start gap-3 pr-8">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {tieuDeVideo ? "Video này cần đăng nhập" : "Đăng nhập để xem video"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{moTa}</p>
            {tieuDeVideo && (
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">“{tieuDeVideo}”</p>
            )}
          </div>
        </div>

        {/* Dùng lại đúng biểu mẫu đăng nhập của trang /login — một nguồn duy nhất, không chép lại */}
        <AuthForm defaultTab="signin" redirectTo={quayLai} />
      </div>
    </div>
  );
}
