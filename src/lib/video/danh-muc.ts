/**
 * Danh mục của kho video NOOI.
 *
 * Vì sao để trong mã chứ không mở bảng riêng: đây chỉ là NHÃN PHÂN LOẠI — giống hệt cách
 * `khung_hinh` và `kenh_phat` đang làm. Cột `videos.danh_muc` giữ MÃ (slug), còn tên hiển thị
 * khai ở đây. Muốn thêm danh mục: thêm một dòng vào DANH_MUC rồi gán mã đó cho video.
 *
 * Mã nào có trong dữ liệu mà chưa khai ở đây vẫn hiển thị được (lấy chính mã làm tên) —
 * nên không bao giờ mất video vì thiếu danh mục.
 */

export interface DanhMuc {
  slug: string;
  ten: string;
  moTa: string;
}

export const DANH_MUC: DanhMuc[] = [
  {
    slug: "mang-den",
    ten: "Măng Đen",
    moTa: "Tư liệu quy hoạch, hạ tầng và dự án Khu du lịch Măng Đen: các phân khu, cao tốc Quảng Ngãi–Kon Tum, sân bay, khu đô thị Sun Group.",
  },
  {
    slug: "quy-hoach",
    ten: "Quy hoạch",
    moTa: "Bản đồ, sơ đồ phân khu, điều chỉnh quy hoạch các khu vực NOOI quan tâm.",
  },
  {
    slug: "bai-giang",
    ten: "Bài giảng",
    moTa: "Bài giảng, chia sẻ nội bộ của NOOI.",
  },
];

export function laDanhMuc(slug: string): DanhMuc | undefined {
  return DANH_MUC.find((d) => d.slug === slug);
}

/** Tên hiển thị của một mã danh mục; mã lạ thì trả về chính mã. */
export function tenDanhMuc(slug?: string | null): string {
  if (!slug) return "";
  return laDanhMuc(slug)?.ten ?? slug;
}

/** Đường dẫn tới luồng xem của một danh mục. */
export function duongDanDanhMuc(slug: string): string {
  return `/app/danh-muc/${encodeURIComponent(slug)}`;
}

/**
 * Video có nằm trong một BÀI HỌC không — quyết định có hiện nút “Mở bài” trong luồng xem.
 *
 * Ngài An chốt 26/11/2026: *“Nút ‘Mở bài’ chỉ xuất hiện khi video có trong 1 bài học”* — video tư
 * liệu (quy hoạch, tin tức…) mà vẫn có nút đó chỉ tổ rối mắt.
 *
 * Hiện nhận diện theo danh mục **“Bài giảng”** (`bai-giang`) vì kho video CHƯA có cột nối tới bảng
 * `lessons`. Khi nào có cột nối bài học thật thì chỉ cần sửa DUY NHẤT hàm này.
 */
export const DANH_MUC_BAI_HOC = "bai-giang";

export function thuocBaiHoc(danhMuc?: string | null): boolean {
  return danhMuc === DANH_MUC_BAI_HOC;
}
