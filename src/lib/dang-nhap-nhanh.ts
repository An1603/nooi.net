/**
 * Cổng đăng nhập nhanh — MỘT chỗ phát yêu cầu "mở hộp đăng nhập".
 *
 * Vì sao có tệp này: hộp đăng nhập chỉ được dựng MỘT lần trong `(public)/layout.tsx`
 * (`HopDangNhapNhanh`). Mọi chỗ cần hỏi đăng nhập — thẻ video bị khoá, bài viết kho tri thức,
 * đường dẫn riêng tư — chỉ gọi `moHopDangNhap()`. Nhờ vậy khách không bao giờ bị đá sang một
 * trang đăng nhập khác, và chỉ có một kiểu hộp duy nhất trên toàn site.
 */

export interface YeuCauDangNhap {
  /** Câu giải thích vì sao phải đăng nhập (hiện dưới tiêu đề) */
  lyDo?: string;
  /** Tên nội dung đang bị khoá — hiện cho khách biết mình đang muốn mở gì */
  tieuDe?: string;
  /** Đăng nhập xong quay lại đúng địa chỉ này (đường dẫn nội bộ) */
  quayLai?: string;
  /** true = hộp tự hiện sau một lúc (nhắc nhẹ); đóng đi thì nhớ 7 ngày */
  nhanNhac?: boolean;
}

type NguoiNghe = (yc: YeuCauDangNhap | null) => void;

const nguoiNghe = new Set<NguoiNghe>();
let hienTai: YeuCauDangNhap | null = null;

export function moHopDangNhap(yc: YeuCauDangNhap = {}) {
  hienTai = yc;
  nguoiNghe.forEach((fn) => {
    try {
      fn(hienTai);
    } catch {
      /* một chỗ nghe lỗi không được làm hỏng chỗ khác */
    }
  });
}

export function dongHopDangNhap() {
  hienTai = null;
  nguoiNghe.forEach((fn) => {
    try {
      fn(null);
    } catch {
      /* bỏ qua */
    }
  });
}

export function dangKyHopDangNhap(fn: NguoiNghe) {
  nguoiNghe.add(fn);
  return () => {
    nguoiNghe.delete(fn);
  };
}

/** Hộp có đang mở không (dùng cho nút bấm cần biết trạng thái) */
export function hopDangNhapDangMo() {
  return hienTai;
}

/** Đã có hộp đăng nhập gắn trên trang chưa (để nơi gọi biết có mở được hộp hay phải điều hướng) */
export function coHopDangNhap() {
  return nguoiNghe.size > 0;
}
