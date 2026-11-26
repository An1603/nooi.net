"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chia sẻ liên kết — MỘT chỗ duy nhất cho cả lưới lẫn luồng xem.
 *
 * Cách hoạt động (theo thứ tự):
 *   1. Máy có hộp chia sẻ của hệ điều hành (điện thoại, Safari/Chrome) → mở hộp đó để người xem
 *      chọn Zalo / Messenger / Sao chép… Đây là đường tốt nhất trên điện thoại.
 *   2. Máy tính (không có hộp chia sẻ) → **sao chép liên kết** và báo một dòng nhỏ.
 *   3. Trình duyệt chặn cả hai → hiện hộp để người xem tự sao chép.
 *
 * Người xem bấm HUỶ trong hộp chia sẻ thì im lặng, KHÔNG chép liên kết — chép trong trường hợp đó
 * là làm việc người xem không muốn.
 */
export async function chiaSe(tieuDe: string, duong: string): Promise<"da-chia-se" | "da-chep" | "huy" | "loi"> {
  const url = duong.startsWith("http") ? duong : new URL(duong, window.location.origin).toString();

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: tieuDe, url });
      return "da-chia-se";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "huy";
      // Không chia sẻ được (máy không có ứng dụng nhận) → thử cách dưới
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "da-chep";
  } catch {
    try {
      window.prompt("Sao chép liên kết để chia sẻ:", url);
      return "da-chep";
    } catch {
      return "loi";
    }
  }
}

interface Props {
  tieuDe: string;
  /** Đường dẫn tương đối (vd `/video/<mã>`) hoặc địa chỉ đầy đủ */
  duong: string;
  /** Nhãn đọc cho trình đọc màn hình */
  nhan?: string;
  /** Có chữ đi kèm không (nút trong thanh công cụ) */
  coChu?: boolean;
  className?: string;
  co?: number;
}

/** Nút chia sẻ kèm một dòng báo nhỏ tự tắt. */
export function NutChiaSe({ tieuDe, duong, nhan = "Chia sẻ", coChu = false, className, co = 15 }: Props) {
  const [tin, setTin] = useState<string | null>(null);
  const [daGan, setDaGan] = useState(false);
  const hen = useRef<number | null>(null);

  // Dòng báo phải nằm Ở NGOÀI cùng trang, không phải trong nút. Lý do: nút này nằm trong khung
  // video vốn có `backdrop-filter`, mà thuộc tính đó biến khung chứa thành gốc toạ độ của
  // `position: fixed` — dòng báo sẽ bị nhốt trong cột nút rộng 40px và dồn thành cột chữ
  // (đã gặp thật 26/11/2026). Đưa ra `document.body` bằng cổng (`createPortal`) là hết.
  useEffect(() => setDaGan(true), []);

  const bam = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const kq = await chiaSe(tieuDe, duong);
    const loi =
      kq === "da-chep"
        ? "Đã sao chép liên kết"
        : kq === "da-chia-se"
          ? "Đã mở hộp chia sẻ"
          : kq === "loi"
            ? "Không sao chép được — hãy chép địa chỉ trên thanh địa chỉ"
            : null;
    if (!loi) return;
    setTin(loi);
    if (hen.current) window.clearTimeout(hen.current);
    hen.current = window.setTimeout(() => setTin(null), 2400);
  };

  return (
    <>
      <button
        type="button"
        onClick={bam}
        aria-label={nhan}
        title={nhan}
        className={cn("inline-flex items-center justify-center gap-1.5", className)}
      >
        <Share2 size={co} />
        {coChu && <span className="text-xs font-medium">Chia sẻ</span>}
      </button>
      {tin &&
        daGan &&
        createPortal(
          <span
            role="status"
            className="pointer-events-none fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/85 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur"
          >
            {tin}
          </span>,
          document.body
        )}
    </>
  );
}
