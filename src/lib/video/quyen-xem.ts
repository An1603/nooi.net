/**
 * Cổng gác quyền xem video — MỘT chỗ duy nhất quyết định một video có mở được hay không.
 *
 * Vì sao gom về đây: mọi nơi hiển thị video (lưới công khai `/video`, trang xem `/video/<mã>`,
 * sau này là app) đều hỏi cùng một câu — "người này có được xem video này không?". Nếu mỗi nơi
 * tự đoán thì chỉ cần lệch một chỗ là lộ video trả phí.
 *
 * Trạng thái hiện tại: bảng `videos` mới có cột `cong_khai` (true = ai cũng xem, false = phải
 * đăng nhập). Các kiểu khoá theo **cấp độ · điểm · số dư** đã có sẵn nhãn và chỗ chèn, khi nào
 * bảng có cột (`cap_do_toi_thieu`, `diem_can`, `gia`) thì chỉ thêm điều kiện Ở ĐÂY — giao diện
 * tự hiện ổ khoá kèm đúng lời nhắn, không phải sửa trang nào.
 */

/** Kiểu khoá hiển thị trên thẻ video. `khong` = mở được. */
export type KieuKhoa = "khong" | "dang-nhap" | "cap-do" | "diem" | "so-du";

/** Trường tối thiểu để xét quyền và để vẽ một thẻ video. */
export interface VideoCongKhai {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  khung_hinh?: string | null;
  danh_muc?: string | null;
  /**
   * Thời điểm tạo — dùng để sắp xếp trên lưới công khai (mới nhất / cũ nhất).
   */
  created_at?: string | null;
  cong_khai?: boolean | null;
}

/** Người đang xem. Chưa đăng nhập thì các chỉ số đều rỗng. */
export interface NguoiXem {
  daDangNhap: boolean;
  email?: string | null;
  capDo?: number | null;
  diem?: number | null;
  soDu?: number | null;
}

export interface KetQuaXetQuyen {
  /** true = xem được */
  mo: boolean;
  kieuKhoa: KieuKhoa;
  /** Nhãn ngắn hiện trên thẻ video, ví dụ "Cần đăng nhập" */
  nhan: string;
  /** Câu giải thích hiện trong hộp đăng nhập / màn khoá */
  moTa: string;
}

const MO: KetQuaXetQuyen = { mo: true, kieuKhoa: "khong", nhan: "", moTa: "" };

/**
 * Xét quyền xem một video.
 *
 * Thứ tự xét (quan trọng — đừng đảo):
 *   1. `cong_khai = true`  → ai cũng xem, dừng ngay.
 *   2. chưa đăng nhập       → khoá "cần đăng nhập".
 *   3. đã đăng nhập         → mở (chỗ này sẽ chèn tiếp điều kiện cấp độ / điểm / số dư).
 */
export function xetQuyenXem(video: VideoCongKhai, nguoi: NguoiXem): KetQuaXetQuyen {
  if (video.cong_khai === true) return MO;

  if (!nguoi.daDangNhap) {
    return {
      mo: false,
      kieuKhoa: "dang-nhap",
      nhan: "Cần đăng nhập",
      moTa: "Video này dành cho thành viên NOOI. Đăng nhập để xem tiếp.",
    };
  }

  // —— Chỗ chèn các kiểu khoá tiếp theo (một chỗ duy nhất) ——
  // Khi bảng `videos` có cột tương ứng, thêm theo thứ tự:
  //   if (video.gia && (nguoi.soDu ?? 0) < video.gia) return { mo: false, kieuKhoa: "so-du", nhan: "Cần nạp thêm", moTa: `Cần ${…} để mở video này.` };
  //   if (video.diem_can && (nguoi.diem ?? 0) < video.diem_can) return { mo: false, kieuKhoa: "diem", nhan: "Cần thêm điểm", moTa: `Cần ${…} điểm để mở video này.` };
  //   if (video.cap_do_toi_thieu && (nguoi.capDo ?? 0) < video.cap_do_toi_thieu) return { mo: false, kieuKhoa: "cap-do", nhan: "Cần cấp độ cao hơn", moTa: `Video này mở từ cấp độ ${…}.` };
  return MO;
}

/** Lọc lấy những video phải khoá (dùng để đếm/hiện lời nhắc trên lưới). */
export function demVideoKhoa(videos: VideoCongKhai[], nguoi: NguoiXem): number {
  return videos.reduce((tong, v) => tong + (xetQuyenXem(v, nguoi).mo ? 0 : 1), 0);
}
