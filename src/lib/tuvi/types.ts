// Types for Tử Vi Phương Đông (Eastern Astrology)
// NOOI — Kết nối chuyển mình

export type GioiTinh = "nam" | "nu";

export interface TuViInput {
  fullName: string;
  ngaySinh: string;    // YYYY-MM-DD (Dương lịch)
  gioSinh: number;     // 0-23 (giờ hiện đại)
  gioiTinh: GioiTinh;
}

export interface LunarDate {
  nam: number;
  thang: number;
  ngay: number;
  nhuan: boolean;
}

export interface ThienCan {
  value: number;       // 0-9: Giáp(0), Ất(1), Bính(2), Đinh(3), Mậu(4), Kỷ(5), Canh(6), Tân(7), Nhâm(8), Quý(9)
  name: string;
  nameEn: string;
  hanh: NguHanh;
  amDuong: AmDuong;
  meaning: string;
  meaningEn: string;
}

export interface DiaChi {
  value: number;       // 0-11: Tý(0), Sửu(1), Dần(2), Mão(3), Thìn(4), Tỵ(5), Ngọ(6), Mùi(7), Thân(8), Dậu(9), Tuất(10), Hợi(11)
  name: string;
  nameEn: string;
  hanh: NguHanh;
  amDuong: AmDuong;
  meaning: string;
  meaningEn: string;
}

export interface CanChi {
  can: ThienCan;
  chi: DiaChi;
  /** Full name e.g. "Giáp Tý", "Ất Sửu" */
  fullName: string;
}

export type NguHanh = "kim" | "moc" | "thuy" | "hoa" | "tho";
export type AmDuong = "am" | "duong";

export type NguHanhTuongSinh = "tuong_sinh" | "tuong_khac" | "binh_thuong";

export interface NguHanhInfo {
  name: string;         // Vietnamese name
  nameEn: string;       // English name
  color: string;        // Associated color
  direction: string;    // Direction
  mua: string;          // Season
  positive: string[];
  negative: string[];
  body: string;         // Related body parts
}

export interface TuTru {
  nam: CanChi;
  thang: CanChi;
  ngay: CanChi;    // Ngày chủ (can ngày là Thân chủ)
  gio: CanChi;
}

export interface BanMenh {
  /** Nạp âm full name e.g. "Hải Trung Kim" */
  napAm: string;
  napAmEn: string;
  hanh: NguHanh;
  hanhName: string;
  /** Interpretation of the Life Element */
  meaning: string;
  meaningEn: string;
}

export interface Cuc {
  name: string;
  nameEn: string;
  hanh: NguHanh;
  value: number;       // 1-6 (Kim=1, Mộc=2, Thủy=3, Hỏa=4, Thổ=5...)
  meaning: string;
  meaningEn: string;
}

export interface Cung {
  value: number;       // 1-12: Mệnh(1), Phụ Mẫu(2), Phúc Đức(3), Điền Trạch(4), Quan Lộc(5),...
  name: string;
  nameEn: string;
  meaning: string;
  meaningEn: string;
  hanh: NguHanh;
}

export interface DaiHan {
  tuoiBatDau: number;
  tuoiKetThuc: number;
  cung: CanChi;
  thoiGian: string;    // e.g. "25-34 tuổi"
}

export interface TuViResult {
  input: TuViInput;
  lunarDate: LunarDate;
  tuTru: TuTru;
  thanChu: ThienCan;           // Can ngày = Thân chủ
  banMenh: BanMenh;
  cuc: Cuc;
  cungMenh: Cung;
  cungThan: Cung;
  daiHan: DaiHan[];
  ngayHienTai: string;         // Current date analysis
  tuongSinhKhac: {
    menhCuc: NguHanhTuongSinh;    // Mệnh vs Cục
    namThang: NguHanhTuongSinh;   // Can Chi năm vs tháng
    thangNgay: NguHanhTuongSinh;  // Can Chi tháng vs ngày
    ngayGio: NguHanhTuongSinh;    // Can Chi ngày vs giờ
  };
  phanTich: {
    tinhCach: PhanTichItem;
    suNghiep: PhanTichItem;
    tinhDuyen: PhanTichItem;
    sucKhoe: PhanTichItem;
    giaDao: PhanTichItem;
    taiLoc: PhanTichItem;
    vanHan: PhanTichItem;
  };
  namHienTai: NamHan;
}

export interface PhanTichItem {
  noidung: string;
  chiTiet: string[];
  loiKhuyen: string;
}

export interface NamHan {
  nam: number;       // Year (e.g. 2026)
  amLich: string;    // e.g. "Bính Ngọ"
  hanh: NguHanh;
  tuongKhacTuoi: boolean;
  sao: string;
  han: string;
  meaning: string;
  meaningEn: string;
}
