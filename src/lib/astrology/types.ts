// Chiêm tinh học phương Tây — Types
// NOOI — Kết nối chuyển mình

export interface AstrologyInput {
  fullName: string;
  ngaySinh: string;      // YYYY-MM-DD
  gioSinh: number;       // 0-23
  gioiTinh: "nam" | "nu";
  phutSinh?: number;     // 0-59 (mặc định 0)
  noiSinh?: string;      // Tên thành phố
  viDo?: number;         // Latitude (mặc định Hà Nội: 21.0285)
  kinhDo?: number;       // Longitude (mặc định Hà Nội: 105.8542)
}

export interface PlanetPosition {
  planet: string;
  planetEn: string;
  symbol: string;
  longitude: number;     // Ecliptic longitude
  latitude: number;      // Ecliptic latitude
  sign: string;          // Cung Hoàng Đạo (Tiếng Việt)
  signEn: string;        // Cung Hoàng Đạo (English)
  signIndex: number;     // 0-11
  degrees: number;       // Độ trong cung (0-30)
  house: number;         // Nhà (1-12)
  retrograde: boolean;   // Nghịch hành?
  meaning: string;       // Ý nghĩa
  meaningEn: string;
}

export interface House {
  number: number;        // 1-12
  cusp: number;          // Vị trí (ecliptic longitude)
  sign: string;          // Cung tại đỉnh nhà
  signEn: string;
  name: string;          // Tên nhà (Tiếng Việt)
  nameEn: string;
  meaning: string;
  meaningEn: string;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  angle: number;
  orb: number;
  type: string;          // "conjunction", "sextile", "square", "trine", "opposition"
  typeEn: string;
  typeVi: string;
  meaning: string;
  meaningEn: string;
  harmonious: boolean;   // Tốt hay xấu
}

export interface Ascendant {
  longitude: number;
  sign: string;
  signEn: string;
  signIndex: number;
  degrees: number;
  meaning: string;
  meaningEn: string;
}

export interface Midheaven {
  longitude: number;
  sign: string;
  signEn: string;
  signIndex: number;
  meaning: string;
  meaningEn: string;
}

export interface AstrologyResult {
  input: AstrologyInput;
  sun: PlanetPosition;
  moon: PlanetPosition;
  planets: PlanetPosition[];
  ascendant: Ascendant;
  midheaven: Midheaven;
  houses: House[];
  aspects: Aspect[];
  dominantElement: string;     // "Lửa", "Đất", "Khí", "Nước"
  dominantQuality: string;     // "Thống lĩnh", "Cố định", "Linh hoạt"
  sunSign: string;             // Cung Mặt Trời
  moonSign: string;            // Cung Mặt Trăng
  risingSign: string;          // Cung Mọc
  interpretations: {
    tongQuan: string;
    tinhCach: string;
    suNghiep: string;
    tinhDuyen: string;
    sucKhoe: string;
    diemManh: string[];
    diemYeu: string[];
    loiKhuyen: string;
  };
}

export const ZODIAC_SIGNS = [
  { vi: "Bạch Dương", en: "Aries", symbol: "♈", element: "Lửa", quality: "Thống lĩnh", ruler: "Mars", start: 0 },
  { vi: "Kim Ngưu", en: "Taurus", symbol: "♉", element: "Đất", quality: "Cố định", ruler: "Venus", start: 30 },
  { vi: "Song Tử", en: "Gemini", symbol: "♊", element: "Khí", quality: "Linh hoạt", ruler: "Mercury", start: 60 },
  { vi: "Cự Giải", en: "Cancer", symbol: "♋", element: "Nước", quality: "Thống lĩnh", ruler: "Moon", start: 90 },
  { vi: "Sư Tử", en: "Leo", symbol: "♌", element: "Lửa", quality: "Cố định", ruler: "Sun", start: 120 },
  { vi: "Xử Nữ", en: "Virgo", symbol: "♍", element: "Đất", quality: "Linh hoạt", ruler: "Mercury", start: 150 },
  { vi: "Thiên Bình", en: "Libra", symbol: "♎", element: "Khí", quality: "Thống lĩnh", ruler: "Venus", start: 180 },
  { vi: "Bọ Cạp", en: "Scorpio", symbol: "♏", element: "Nước", quality: "Cố định", ruler: "Pluto", start: 210 },
  { vi: "Nhân Mã", en: "Sagittarius", symbol: "♐", element: "Lửa", quality: "Linh hoạt", ruler: "Jupiter", start: 240 },
  { vi: "Ma Kết", en: "Capricorn", symbol: "♑", element: "Đất", quality: "Thống lĩnh", ruler: "Saturn", start: 270 },
  { vi: "Bảo Bình", en: "Aquarius", symbol: "♒", element: "Khí", quality: "Cố định", ruler: "Uranus", start: 300 },
  { vi: "Song Ngư", en: "Pisces", symbol: "♓", element: "Nước", quality: "Linh hoạt", ruler: "Neptune", start: 330 },
];
