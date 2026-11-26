import {
  Images,
  Video,
  BookOpen,
  Users,
  FolderKanban,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

/**
 * SÁU PHÂN HỆ CÔNG KHAI — nguồn duy nhất.
 *
 * Vì sao gom vào một tệp: menu đầu trang, khối “Sáu cửa vào” ở trang chủ, chân trang và
 * sitemap đều phải kể ĐÚNG một danh sách. Trước đây mỗi chỗ chép tay một danh sách nên
 * có mục trỏ vào “#” hoặc lệch tên. Thêm/bớt phân hệ chỉ sửa ở đây.
 */
export type PhanHe = {
  /** mã dùng cho tracking + khoá React */
  ma: string;
  ten: string;
  href: string;
  /** một dòng, tối đa ~45 ký tự để thẻ không cao lệch nhau */
  moTa: string;
  Icon: LucideIcon;
};

export const PHAN_HE: PhanHe[] = [
  {
    ma: "thu-vien-anh",
    ten: "Thư viện ảnh",
    href: "/gallery",
    moTa: "Khoảnh khắc thiền, khí công, retreat",
    Icon: Images,
  },
  {
    ma: "kho-video",
    ten: "Kho video",
    href: "/video",
    moTa: "Bài giảng, thiền dẫn, series thực hành",
    Icon: Video,
  },
  {
    ma: "kho-tri-thuc",
    ten: "Kho tri thức",
    href: "/kho-tri-thuc",
    moTa: "Bài viết, ebook, thuật ngữ thân tâm",
    Icon: BookOpen,
  },
  {
    ma: "chuyen-gia",
    ten: "Chuyên gia",
    href: "/chuyen-gia",
    moTa: "Hồ sơ mentor, lộ trình đồng hành",
    Icon: Users,
  },
  {
    ma: "du-an",
    ten: "Dự án",
    href: "/du-an",
    moTa: "NOOI Forest, eKid, LUMi, OPC",
    Icon: FolderKanban,
  },
  {
    ma: "tien-ich",
    ten: "Tiện ích",
    href: "/tien-ich",
    moTa: "Tử vi, thần số học, nhật ký, trợ lý AI",
    Icon: LayoutGrid,
  },
];

/**
 * Nhóm “Về NOOI” — các khối giới thiệu nằm NGAY TRÊN trang chủ, không chiếm menu chính.
 * Chỉ hiện trong menu xổ của điện thoại và ở chân trang.
 */
export const MENU_GIOI_THIEU = [
  { label: "Tính năng", href: "/#features" },
  { label: "Công nghệ", href: "/#tech" },
  { label: "Đội ngũ", href: "/chuyen-gia" },
  { label: "Liên hệ", href: "/#contact" },
];
