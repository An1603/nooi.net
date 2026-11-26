"use client";

import { useEffect, useRef } from "react";
import { dangKyHopDangNhap, moHopDangNhap } from "@/lib/dang-nhap-nhanh";

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
 * Cầu nối cho lưới video — KHÔNG tự vẽ hộp thoại nữa.
 *
 * Trước đây tệp này dựng một hộp đăng nhập riêng (modal giữa màn hình). Nay toàn site chỉ có
 * MỘT hộp đăng nhập (`components/auth/HopDangNhapNhanh` — thẻ nhỏ góc trên phải), nên ở đây chỉ
 * còn nhiệm vụ: khi một video bị khoá được bấm, phát yêu cầu mở hộp kèm lý do + đích quay lại;
 * khi khách đóng hộp thì gọi `onDong` để lưới xoá trạng thái "đang xin quyền".
 *
 * Giữ nguyên chữ ký cũ để hai nơi đang dùng (`LuoiVideoCongKhai`, `VideoFeedDoc`) không phải sửa.
 */
export function HopDangNhap({ mo, tieuDeVideo, moTa, quayLai, onDong }: Props) {
  // Giữ callback trong ref: hai nơi gọi truyền arrow function mới mỗi lần render, nếu để trong
  // deps thì effect chạy lại liên tục và hộp đăng nhập bị mở lại ngay sau khi khách đóng.
  const dongRef = useRef(onDong);
  dongRef.current = onDong;
  const noiDungRef = useRef({ tieuDeVideo, moTa, quayLai });
  noiDungRef.current = { tieuDeVideo, moTa, quayLai };

  useEffect(() => {
    if (!mo) return;
    const n = noiDungRef.current;
    // Hộp đang mở vì lý do khác (ví dụ lời nhắc tự động) thì thay bằng lý do đúng của video này.
    moHopDangNhap({ tieuDe: n.tieuDeVideo, lyDo: n.moTa, quayLai: n.quayLai });
    return dangKyHopDangNhap((yc) => {
      if (!yc) dongRef.current();
    });
  }, [mo]);

  return null;
}
