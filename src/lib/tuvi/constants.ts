// Tử Vi Phương Đông — Constants & Lookup Tables
import type { ThienCan, DiaChi, NguHanh, NguHanhInfo, NguHanhTuongSinh } from './types';

// ===================== 1. THIÊN CAN (10 Heavenly Stems) =====================
export const THIEN_CAN: ThienCan[] = [
  { value: 0, name: "Giáp", nameEn: "Jia", hanh: "moc", amDuong: "duong",
    meaning: "Giáp là Dương Mộc, tượng trưng cho cây đại thụ. Người mang can Giáp có tính cách mạnh mẽ, kiên định, có tinh thần tiên phong và khả năng lãnh đạo.",
    meaningEn: "Jia is Yang Wood, symbolizing a big tree. Strong, determined, pioneering spirit with leadership ability." },
  { value: 1, name: "Ất", nameEn: "Yi", hanh: "moc", amDuong: "am",
    meaning: "Ất là Âm Mộc, tượng trưng cho cây cỏ mềm mại. Người mang can Ất mềm dẻo, uyển chuyển, giàu lòng trắc ẩn và có khả năng thích nghi cao.",
    meaningEn: "Yi is Yin Wood, symbolizing grass and vines. Flexible, adaptable, compassionate with high adaptability." },
  { value: 2, name: "Bính", nameEn: "Bing", hanh: "hoa", amDuong: "duong",
    meaning: "Bính là Dương Hỏa, tượng trưng cho mặt trời. Người mang can Bính nhiệt tình, sôi nổi, hào phóng và có sức lan tỏa mạnh mẽ.",
    meaningEn: "Bing is Yang Fire, symbolizing the sun. Enthusiastic, passionate, generous with strong radiance." },
  { value: 3, name: "Đinh", nameEn: "Ding", hanh: "hoa", amDuong: "am",
    meaning: "Đinh là Âm Hỏa, tượng trưng cho ngọn đèn. Người mang can Đinh ấm áp, tinh tế, chu đáo và có khả năng tập trung cao độ.",
    meaningEn: "Ding is Yin Fire, symbolizing a candle flame. Warm, refined, thoughtful with deep concentration." },
  { value: 4, name: "Mậu", nameEn: "Wu", hanh: "tho", amDuong: "duong",
    meaning: "Mậu là Dương Thổ, tượng trưng cho núi cao. Người mang can Mậu vững chãi, đáng tin cậy, trung thành và có tinh thần trách nhiệm cao.",
    meaningEn: "Wu is Yang Earth, symbolizing a mountain. Steadfast, reliable, loyal with high responsibility." },
  { value: 5, name: "Kỷ", nameEn: "Ji", hanh: "tho", amDuong: "am",
    meaning: "Kỷ là Âm Thổ, tượng trưng cho đất vườn. Người mang can Kỷ cẩn thận, tỉ mỉ, khiêm tốn và giàu lòng nhân ái.",
    meaningEn: "Ji is Yin Earth, symbolizing garden soil. Meticulous, careful, humble with great compassion." },
  { value: 6, name: "Canh", nameEn: "Geng", hanh: "kim", amDuong: "duong",
    meaning: "Canh là Dương Kim, tượng trưng cho kiếm sắc. Người mang can Canh cương trực, quyết đoán, mạnh mẽ và có ý chí sắt đá.",
    meaningEn: "Geng is Yang Metal, symbolizing a sharp sword. Upright, decisive, strong with iron will." },
  { value: 7, name: "Tân", nameEn: "Xin", hanh: "kim", amDuong: "am",
    meaning: "Tân là Âm Kim, tượng trưng cho trang sức. Người mang can Tân tinh tế, thanh lịch, có gu thẩm mỹ cao và cầu toàn.",
    meaningEn: "Xin is Yin Metal, symbolizing jewelry. Elegant, refined, aesthetic with perfectionist tendencies." },
  { value: 8, name: "Nhâm", nameEn: "Ren", hanh: "thuy", amDuong: "duong",
    meaning: "Nhâm là Dương Thủy, tượng trưng cho đại dương. Người mang can Nhâm rộng lượng, thông thái, có tầm nhìn xa và khả năng thích ứng.",
    meaningEn: "Ren is Yang Water, symbolizing the ocean. Generous, wise, visionary with great adaptability." },
  { value: 9, name: "Quý", nameEn: "Gui", hanh: "thuy", amDuong: "am",
    meaning: "Quý là Âm Thủy, tượng trưng cho mưa. Người mang can Quý nhạy cảm, trực giác tốt, sâu sắc và giàu lòng trắc ẩn.",
    meaningEn: "Gui is Yin Water, symbolizing rain. Sensitive, intuitive, profound with great empathy." },
];

// ===================== 2. ĐỊA CHI (12 Earthly Branches) =====================
export const DIA_CHI: DiaChi[] = [
  { value: 0, name: "Tý", nameEn: "Rat", hanh: "thuy", amDuong: "duong",
    meaning: "Tý thuộc hành Thủy, tượng trưng cho sự khởi đầu và tiềm năng. Người tuổi Tý thông minh, nhanh nhẹn, giàu óc sáng tạo và có khả năng thích ứng cao. Họ có khiếu ngoại giao và thường gặp nhiều may mắn trong cuộc sống.",
    meaningEn: "Rat symbolizes new beginnings. Intelligent, quick-witted, creative with high adaptability and diplomatic skills." },
  { value: 1, name: "Sửu", nameEn: "Ox", hanh: "tho", amDuong: "am",
    meaning: "Sửu thuộc hành Thổ, tượng trưng cho sức mạnh bền bỉ. Người tuổi Sửu chăm chỉ, kiên trì, đáng tin cậy và có tinh thần trách nhiệm cao. Họ là chỗ dựa vững chắc cho gia đình và bạn bè.",
    meaningEn: "Ox symbolizes endurance. Hardworking, persistent, reliable with high responsibility. A solid support for family." },
  { value: 2, name: "Dần", nameEn: "Tiger", hanh: "moc", amDuong: "duong",
    meaning: "Dần thuộc hành Mộc, tượng trưng cho sức mạnh và uy quyền. Người tuổi Dần dũng cảm, tự tin, có tố chất lãnh đạo và tinh thần phiêu lưu. Họ luôn tiên phong trong mọi lĩnh vực.",
    meaningEn: "Tiger symbolizes power and authority. Brave, confident, natural leader with adventurous spirit." },
  { value: 3, name: "Mão", nameEn: "Rabbit", hanh: "moc", amDuong: "am",
    meaning: "Mão thuộc hành Mộc, tượng trưng cho sự thanh lịch. Người tuổi Mão nhẹ nhàng, khéo léo, giàu lòng nhân ái và có gu thẩm mỹ tinh tế. Họ được nhiều người yêu mến.",
    meaningEn: "Rabbit symbolizes elegance. Gentle, diplomatic, compassionate with refined aesthetic taste." },
  { value: 4, name: "Thìn", nameEn: "Dragon", hanh: "tho", amDuong: "duong",
    meaning: "Thìn thuộc hành Thổ, tượng trưng cho quyền uy và may mắn. Người tuổi Thìn uy nghi, tài năng, có hoài bão lớn và ý chí mạnh mẽ. Họ sinh ra để làm nên nghiệp lớn.",
    meaningEn: "Dragon symbolizes authority and luck. Dignified, talented, ambitious with strong willpower." },
  { value: 5, name: "Tỵ", nameEn: "Snake", hanh: "hoa", amDuong: "am",
    meaning: "Tỵ thuộc hành Hỏa, tượng trưng cho trí tuệ sâu sắc. Người tuổi Tỵ thông thái, bí ẩn, có trực giác nhạy bén và khả năng phân tích sắc sảo. Họ là những nhà tư tưởng lớn.",
    meaningEn: "Snake symbolizes deep wisdom. Wise, mysterious, intuitive with sharp analytical skills." },
  { value: 6, name: "Ngọ", nameEn: "Horse", hanh: "hoa", amDuong: "duong",
    meaning: "Ngọ thuộc hành Hỏa, tượng trưng cho sự tự do. Người tuổi Ngọ nhiệt tình, yêu tự do, năng động và có tinh thần thể thao. Họ thích phiêu lưu và khám phá.",
    meaningEn: "Horse symbolizes freedom. Enthusiastic, freedom-loving, energetic with a sporty spirit." },
  { value: 7, name: "Mùi", nameEn: "Goat", hanh: "tho", amDuong: "am",
    meaning: "Mùi thuộc hành Thổ, tượng trưng cho sự hiền hòa. Người tuổi Mùi nhân hậu, điềm đạm, yêu nghệ thuật và có tâm hồn lãng mạn. Họ sống tình cảm và giàu lòng vị tha.",
    meaningEn: "Goat symbolizes gentleness. Kind, calm, artistic with a romantic soul and compassionate heart." },
  { value: 8, name: "Thân", nameEn: "Monkey", hanh: "kim", amDuong: "duong",
    meaning: "Thân thuộc hành Kim, tượng trưng cho sự linh hoạt. Người tuổi Thân thông minh, lanh lợi, hài hước và có khả năng thích ứng xuất sắc. Họ là bậc thầy về giao tiếp.",
    meaningEn: "Monkey symbolizes agility. Intelligent, witty, humorous with excellent adaptability and communication." },
  { value: 9, name: "Dậu", nameEn: "Rooster", hanh: "kim", amDuong: "am",
    meaning: "Dậu thuộc hành Kim, tượng trưng cho sự chính xác. Người tuổi Dậu tỉ mỉ, đúng giờ, có tinh thần trách nhiệm và khả năng tổ chức xuất sắc. Họ luôn đạt được mục tiêu đề ra.",
    meaningEn: "Rooster symbolizes precision. Meticulous, punctual, responsible with excellent organizational skills." },
  { value: 10, name: "Tuất", nameEn: "Dog", hanh: "tho", amDuong: "duong",
    meaning: "Tuất thuộc hành Thổ, tượng trưng cho lòng trung thành. Người tuổi Tuất trung thành, chính trực, đáng tin cậy và có tinh thần bảo vệ gia đình. Họ là người bạn đáng tin cậy nhất.",
    meaningEn: "Dog symbolizes loyalty. Faithful, honest, reliable with a strong protective instinct for family." },
  { value: 11, name: "Hợi", nameEn: "Pig", hanh: "thuy", amDuong: "am",
    meaning: "Hợi thuộc hành Thủy, tượng trưng cho sự phú quý. Người tuổi Hợi tốt bụng, hào phóng, lạc quan và tận hưởng cuộc sống. Họ được quý nhân phù trợ.",
    meaningEn: "Pig symbolizes wealth. Kind-hearted, generous, optimistic with a joie de vivre. Blessed with good fortune." },
];

// ===================== 3. NGŨ HÀNH (Five Elements) =====================
export const NGU_HANH: Record<NguHanh, NguHanhInfo> = {
  kim: { name: "Kim", nameEn: "Metal", color: "Trắng, Xám", direction: "Tây", mua: "Thu",
    positive: ["Cương nghị", "Quyết đoán", "Chính trực", "Kỷ luật", "Sắc sảo"],
    negative: ["Cứng nhắc", "Lạnh lùng", "Bảo thủ", "Dễ tổn thương"],
    body: "Phổi, Da, Ruột già" },
  moc: { name: "Mộc", nameEn: "Wood", color: "Xanh lá", direction: "Đông", mua: "Xuân",
    positive: ["Nhân từ", "Linh hoạt", "Sáng tạo", "Phát triển", "Kiên định"],
    negative: ["Bảo thủ", "Nóng nảy", "Phân tán", "Ích kỷ"],
    body: "Gan, Mắt, Gân" },
  thuy: { name: "Thủy", nameEn: "Water", color: "Đen, Xanh dương", direction: "Bắc", mua: "Đông",
    positive: ["Thông thái", "Mềm dẻo", "Nhạy cảm", "Giao tiếp tốt", "Sâu sắc"],
    negative: ["Quá nhạy cảm", "Dễ thay đổi", "Lo lắng", "Ỷ lại"],
    body: "Thận, Tai, Xương" },
  hoa: { name: "Hỏa", nameEn: "Fire", color: "Đỏ, Hồng, Tím", direction: "Nam", mua: "Hạ",
    positive: ["Nhiệt tình", "Hào phóng", "Truyền cảm hứng", "Uy nghiêm", "Nhanh nhẹn"],
    negative: ["Nóng nảy", "Hấp tấp", "Kiêu ngạo", "Bồn chồn"],
    body: "Tim, Mạch máu, Lưỡi" },
  tho: { name: "Thổ", nameEn: "Earth", color: "Vàng, Nâu", direction: "Trung tâm", mua: "Cuối hạ",
    positive: ["Trung thành", "Ổn định", "Đáng tin", "Kiên nhẫn", "Bao dung"],
    negative: ["Chậm chạp", "Bảo thủ", "Cứng đầu", "Không linh hoạt"],
    body: "Lá lách, Dạ dày, Cơ" },
};

// ===================== 4. NGŨ HÀNH TƯƠNG SINH TƯƠNG KHẮC =====================
const SINH_CYCLE: Record<NguHanh, NguHanh> = {
  moc: "hoa", hoa: "tho", tho: "kim", kim: "thuy", thuy: "moc"
};
const KHAC_CYCLE: Record<NguHanh, NguHanh> = {
  moc: "tho", tho: "thuy", thuy: "hoa", hoa: "kim", kim: "moc"
};

export function getSinhKhac(h1: NguHanh, h2: NguHanh): NguHanhTuongSinh {
  if (SINH_CYCLE[h1] === h2) return "tuong_sinh";
  if (KHAC_CYCLE[h1] === h2) return "tuong_khac";
  return "binh_thuong";
}

// ===================== 5. 60 HOA GIÁP =====================
export interface HoaGiapEntry {
  index: number;
  canIndex: number;
  chiIndex: number;
  name: string;
  napAm: string;
  napAmEn: string;
  napAmHanh: NguHanh;
}

export const HOA_GIAP_60: HoaGiapEntry[] = [
  { index: 0, canIndex: 0, chiIndex: 0, name: "Giáp Tý", napAm: "Hải Trung Kim", napAmEn: "Gold in the Sea", napAmHanh: "kim" },
  { index: 1, canIndex: 1, chiIndex: 1, name: "Ất Sửu", napAm: "Hải Trung Kim", napAmEn: "Gold in the Sea", napAmHanh: "kim" },
  { index: 2, canIndex: 2, chiIndex: 2, name: "Bính Dần", napAm: "Lô Trung Hỏa", napAmEn: "Fire in the Stove", napAmHanh: "hoa" },
  { index: 3, canIndex: 3, chiIndex: 3, name: "Đinh Mão", napAm: "Lô Trung Hỏa", napAmEn: "Fire in the Stove", napAmHanh: "hoa" },
  { index: 4, canIndex: 4, chiIndex: 4, name: "Mậu Thìn", napAm: "Đại Lâm Mộc", napAmEn: "Forest Wood", napAmHanh: "moc" },
  { index: 5, canIndex: 5, chiIndex: 5, name: "Kỷ Tỵ", napAm: "Đại Lâm Mộc", napAmEn: "Forest Wood", napAmHanh: "moc" },
  { index: 6, canIndex: 6, chiIndex: 6, name: "Canh Ngọ", napAm: "Lộ Bàng Thổ", napAmEn: "Earth on the Road", napAmHanh: "tho" },
  { index: 7, canIndex: 7, chiIndex: 7, name: "Tân Mùi", napAm: "Lộ Bàng Thổ", napAmEn: "Earth on the Road", napAmHanh: "tho" },
  { index: 8, canIndex: 8, chiIndex: 8, name: "Nhâm Thân", napAm: "Kiếm Phong Kim", napAmEn: "Sword Metal", napAmHanh: "kim" },
  { index: 9, canIndex: 9, chiIndex: 9, name: "Quý Dậu", napAm: "Kiếm Phong Kim", napAmEn: "Sword Metal", napAmHanh: "kim" },
  { index: 10, canIndex: 0, chiIndex: 10, name: "Giáp Tuất", napAm: "Sơn Đầu Hỏa", napAmEn: "Fire on the Mountain", napAmHanh: "hoa" },
  { index: 11, canIndex: 1, chiIndex: 11, name: "Ất Hợi", napAm: "Sơn Đầu Hỏa", napAmEn: "Fire on the Mountain", napAmHanh: "hoa" },
  { index: 12, canIndex: 2, chiIndex: 0, name: "Bính Tý", napAm: "Giản Hạ Thủy", napAmEn: "Water under the Bridge", napAmHanh: "thuy" },
  { index: 13, canIndex: 3, chiIndex: 1, name: "Đinh Sửu", napAm: "Giản Hạ Thủy", napAmEn: "Water under the Bridge", napAmHanh: "thuy" },
  { index: 14, canIndex: 4, chiIndex: 2, name: "Mậu Dần", napAm: "Thành Đầu Thổ", napAmEn: "Earth on the City Wall", napAmHanh: "tho" },
  { index: 15, canIndex: 5, chiIndex: 3, name: "Kỷ Mão", napAm: "Thành Đầu Thổ", napAmEn: "Earth on the City Wall", napAmHanh: "tho" },
  { index: 16, canIndex: 6, chiIndex: 4, name: "Canh Thìn", napAm: "Bạch Lạp Kim", napAmEn: "White Wax Metal", napAmHanh: "kim" },
  { index: 17, canIndex: 7, chiIndex: 5, name: "Tân Tỵ", napAm: "Bạch Lạp Kim", napAmEn: "White Wax Metal", napAmHanh: "kim" },
  { index: 18, canIndex: 8, chiIndex: 6, name: "Nhâm Ngọ", napAm: "Dương Liễu Mộc", napAmEn: "Willow Wood", napAmHanh: "moc" },
  { index: 19, canIndex: 9, chiIndex: 7, name: "Quý Mùi", napAm: "Dương Liễu Mộc", napAmEn: "Willow Wood", napAmHanh: "moc" },
  { index: 20, canIndex: 0, chiIndex: 8, name: "Giáp Thân", napAm: "Tuyền Trung Thủy", napAmEn: "Water from Spring", napAmHanh: "thuy" },
  { index: 21, canIndex: 1, chiIndex: 9, name: "Ất Dậu", napAm: "Tuyền Trung Thủy", napAmEn: "Water from Spring", napAmHanh: "thuy" },
  { index: 22, canIndex: 2, chiIndex: 10, name: "Bính Tuất", napAm: "Ốc Thượng Thổ", napAmEn: "Earth on the Roof", napAmHanh: "tho" },
  { index: 23, canIndex: 3, chiIndex: 11, name: "Đinh Hợi", napAm: "Ốc Thượng Thổ", napAmEn: "Earth on the Roof", napAmHanh: "tho" },
  { index: 24, canIndex: 4, chiIndex: 0, name: "Mậu Tý", napAm: "Tích Lịch Hỏa", napAmEn: "Thunder Fire", napAmHanh: "hoa" },
  { index: 25, canIndex: 5, chiIndex: 1, name: "Kỷ Sửu", napAm: "Tích Lịch Hỏa", napAmEn: "Thunder Fire", napAmHanh: "hoa" },
  { index: 26, canIndex: 6, chiIndex: 2, name: "Canh Dần", napAm: "Tùng Bách Mộc", napAmEn: "Pine Wood", napAmHanh: "moc" },
  { index: 27, canIndex: 7, chiIndex: 3, name: "Tân Mão", napAm: "Tùng Bách Mộc", napAmEn: "Pine Wood", napAmHanh: "moc" },
  { index: 28, canIndex: 8, chiIndex: 4, name: "Nhâm Thìn", napAm: "Trường Lưu Thủy", napAmEn: "Flowing Water", napAmHanh: "thuy" },
  { index: 29, canIndex: 9, chiIndex: 5, name: "Quý Tỵ", napAm: "Trường Lưu Thủy", napAmEn: "Flowing Water", napAmHanh: "thuy" },
  { index: 30, canIndex: 0, chiIndex: 6, name: "Giáp Ngọ", napAm: "Sa Trung Kim", napAmEn: "Gold in Sand", napAmHanh: "kim" },
  { index: 31, canIndex: 1, chiIndex: 7, name: "Ất Mùi", napAm: "Sa Trung Kim", napAmEn: "Gold in Sand", napAmHanh: "kim" },
  { index: 32, canIndex: 2, chiIndex: 8, name: "Bính Thân", napAm: "Sơn Hạ Hỏa", napAmEn: "Fire at the Mountain Foot", napAmHanh: "hoa" },
  { index: 33, canIndex: 3, chiIndex: 9, name: "Đinh Dậu", napAm: "Sơn Hạ Hỏa", napAmEn: "Fire at the Mountain Foot", napAmHanh: "hoa" },
  { index: 34, canIndex: 4, chiIndex: 10, name: "Mậu Tuất", napAm: "Bình Địa Mộc", napAmEn: "Plain Wood", napAmHanh: "moc" },
  { index: 35, canIndex: 5, chiIndex: 11, name: "Kỷ Hợi", napAm: "Bình Địa Mộc", napAmEn: "Plain Wood", napAmHanh: "moc" },
  { index: 36, canIndex: 6, chiIndex: 0, name: "Canh Tý", napAm: "Bích Thượng Thổ", napAmEn: "Earth on the Wall", napAmHanh: "tho" },
  { index: 37, canIndex: 7, chiIndex: 1, name: "Tân Sửu", napAm: "Bích Thượng Thổ", napAmEn: "Earth on the Wall", napAmHanh: "tho" },
  { index: 38, canIndex: 8, chiIndex: 2, name: "Nhâm Dần", napAm: "Kim Bạch Kim", napAmEn: "Precious Gold", napAmHanh: "kim" },
  { index: 39, canIndex: 9, chiIndex: 3, name: "Quý Mão", napAm: "Kim Bạch Kim", napAmEn: "Precious Gold", napAmHanh: "kim" },
  { index: 40, canIndex: 0, chiIndex: 4, name: "Giáp Thìn", napAm: "Phúc Đăng Hỏa", napAmEn: "Lamp Fire", napAmHanh: "hoa" },
  { index: 41, canIndex: 1, chiIndex: 5, name: "Ất Tỵ", napAm: "Phúc Đăng Hỏa", napAmEn: "Lamp Fire", napAmHanh: "hoa" },
  { index: 42, canIndex: 2, chiIndex: 6, name: "Bính Ngọ", napAm: "Thiên Hà Thủy", napAmEn: "Rain Water", napAmHanh: "thuy" },
  { index: 43, canIndex: 3, chiIndex: 7, name: "Đinh Mùi", napAm: "Thiên Hà Thủy", napAmEn: "Rain Water", napAmHanh: "thuy" },
  { index: 44, canIndex: 4, chiIndex: 8, name: "Mậu Thân", napAm: "Đại Trạch Thổ", napAmEn: "Great Plain Earth", napAmHanh: "tho" },
  { index: 45, canIndex: 5, chiIndex: 9, name: "Kỷ Dậu", napAm: "Đại Trạch Thổ", napAmEn: "Great Plain Earth", napAmHanh: "tho" },
  { index: 46, canIndex: 6, chiIndex: 10, name: "Canh Tuất", napAm: "Thoa Xuyến Kim", napAmEn: "Ornamental Gold", napAmHanh: "kim" },
  { index: 47, canIndex: 7, chiIndex: 11, name: "Tân Hợi", napAm: "Thoa Xuyến Kim", napAmEn: "Ornamental Gold", napAmHanh: "kim" },
  { index: 48, canIndex: 8, chiIndex: 0, name: "Nhâm Tý", napAm: "Tang Đố Mộc", napAmEn: "Mulberry Wood", napAmHanh: "moc" },
  { index: 49, canIndex: 9, chiIndex: 1, name: "Quý Sửu", napAm: "Tang Đố Mộc", napAmEn: "Mulberry Wood", napAmHanh: "moc" },
  { index: 50, canIndex: 0, chiIndex: 2, name: "Giáp Dần", napAm: "Đại Khê Thủy", napAmEn: "Stream Water", napAmHanh: "thuy" },
  { index: 51, canIndex: 1, chiIndex: 3, name: "Ất Mão", napAm: "Đại Khê Thủy", napAmEn: "Stream Water", napAmHanh: "thuy" },
  { index: 52, canIndex: 2, chiIndex: 4, name: "Bính Thìn", napAm: "Sa Trung Thổ", napAmEn: "Sand Earth", napAmHanh: "tho" },
  { index: 53, canIndex: 3, chiIndex: 5, name: "Đinh Tỵ", napAm: "Sa Trung Thổ", napAmEn: "Sand Earth", napAmHanh: "tho" },
  { index: 54, canIndex: 4, chiIndex: 6, name: "Mậu Ngọ", napAm: "Thiên Thượng Hỏa", napAmEn: "Fire from Heaven", napAmHanh: "hoa" },
  { index: 55, canIndex: 5, chiIndex: 7, name: "Kỷ Mùi", napAm: "Thiên Thượng Hỏa", napAmEn: "Fire from Heaven", napAmHanh: "hoa" },
  { index: 56, canIndex: 6, chiIndex: 8, name: "Canh Thân", napAm: "Thạch Lựu Mộc", napAmEn: "Pomegranate Wood", napAmHanh: "moc" },
  { index: 57, canIndex: 7, chiIndex: 9, name: "Tân Dậu", napAm: "Thạch Lựu Mộc", napAmEn: "Pomegranate Wood", napAmHanh: "moc" },
  { index: 58, canIndex: 8, chiIndex: 10, name: "Nhâm Tuất", napAm: "Đại Hải Thủy", napAmEn: "Great Ocean Water", napAmHanh: "thuy" },
  { index: 59, canIndex: 9, chiIndex: 11, name: "Quý Hợi", napAm: "Đại Hải Thủy", napAmEn: "Great Ocean Water", napAmHanh: "thuy" },
];

export function timHoaGiap(canIndex: number, chiIndex: number): HoaGiapEntry | undefined {
  return HOA_GIAP_60.find(h => h.canIndex === canIndex && h.chiIndex === chiIndex);
}

export function getNapAm(canIndex: number, chiIndex: number): { napAm: string; hanh: NguHanh } {
  const entry = timHoaGiap(canIndex, chiIndex);
  return entry ? { napAm: entry.napAm, hanh: entry.napAmHanh } : { napAm: "", hanh: "tho" };
}

// ===================== 6. GIỜ SINH (Birth Hour → Địa Chi) =====================
export function gioToChi(gio: number): number {
  // Tý (23-1), Sửu (1-3), Dần (3-5), Mão (5-7), Thìn (7-9), Tỵ (9-11)
  // Ngọ (11-13), Mùi (13-15), Thân (15-17), Dậu (17-19), Tuất (19-21), Hợi (21-23)
  if (gio >= 23 || gio < 1) return 0;  // Tý
  if (gio >= 1 && gio < 3) return 1;   // Sửu
  if (gio >= 3 && gio < 5) return 2;   // Dần
  if (gio >= 5 && gio < 7) return 3;   // Mão
  if (gio >= 7 && gio < 9) return 4;   // Thìn
  if (gio >= 9 && gio < 11) return 5;  // Tỵ
  if (gio >= 11 && gio < 13) return 6; // Ngọ
  if (gio >= 13 && gio < 15) return 7; // Mùi
  if (gio >= 15 && gio < 17) return 8; // Thân
  if (gio >= 17 && gio < 19) return 9; // Dậu
  if (gio >= 19 && gio < 21) return 10; // Tuất
  return 11; // Hợi (21-23)
}

export const GIO_CHI_LABELS: { chi: number; label: string; labelEn: string; range: string }[] = [
  { chi: 0, label: "Tý", labelEn: "Rat", range: "23:00-00:59" },
  { chi: 1, label: "Sửu", labelEn: "Ox", range: "01:00-02:59" },
  { chi: 2, label: "Dần", labelEn: "Tiger", range: "03:00-04:59" },
  { chi: 3, label: "Mão", labelEn: "Rabbit", range: "05:00-06:59" },
  { chi: 4, label: "Thìn", labelEn: "Dragon", range: "07:00-08:59" },
  { chi: 5, label: "Tỵ", labelEn: "Snake", range: "09:00-10:59" },
  { chi: 6, label: "Ngọ", labelEn: "Horse", range: "11:00-12:59" },
  { chi: 7, label: "Mùi", labelEn: "Goat", range: "13:00-14:59" },
  { chi: 8, label: "Thân", labelEn: "Monkey", range: "15:00-16:59" },
  { chi: 9, label: "Dậu", labelEn: "Rooster", range: "17:00-18:59" },
  { chi: 10, label: "Tuất", labelEn: "Dog", range: "19:00-20:59" },
  { chi: 11, label: "Hợi", labelEn: "Pig", range: "21:00-22:59" },
];

// ===================== 7. CỤC (Element Bureau) =====================
export interface CucInfo {
  name: string;
  nameEn: string;
  hanh: NguHanh;
  value: number;
  meaning: string;
  meaningEn: string;
}

export const CUC_TABLE: Record<NguHanh, CucInfo> = {
  kim:  { name: "Kim tứ cục", nameEn: "Metal Bureau 4", hanh: "kim", value: 4,
    meaning: "Cục Kim — số 4. Người thuộc Kim cục có ý chí kiên định, quyết đoán, mạnh mẽ vươn lên trong cuộc sống.", meaningEn: "Metal Bureau 4. Determined, decisive, strong will to rise in life." },
  moc:  { name: "Mộc tam cục", nameEn: "Wood Bureau 3", hanh: "moc", value: 3,
    meaning: "Cục Mộc — số 3. Người thuộc Mộc cục nhân hậu, phát triển bền vững, có khả năng sinh sôi nảy nở.", meaningEn: "Wood Bureau 3. Benevolent, steadily growing, with nurturing ability." },
  thuy: { name: "Thủy nhị cục", nameEn: "Water Bureau 2", hanh: "thuy", value: 2,
    meaning: "Cục Thủy — số 2. Người thuộc Thủy cục thông thái, linh hoạt, có khả năng thích ứng và giao tiếp tốt.", meaningEn: "Water Bureau 2. Wise, flexible, adaptable with good communication skills." },
  hoa:  { name: "Hỏa lục cục", nameEn: "Fire Bureau 6", hanh: "hoa", value: 6,
    meaning: "Cục Hỏa — số 6. Người thuộc Hỏa cục nhiệt huyết, mạnh mẽ, có khả năng lan tỏa và truyền cảm hứng.", meaningEn: "Fire Bureau 6. Passionate, powerful, with radiating and inspirational ability." },
  tho:  { name: "Thổ ngũ cục", nameEn: "Earth Bureau 5", hanh: "tho", value: 5,
    meaning: "Cục Thổ — số 5. Người thuộc Thổ cục ổn định, trung thành, đáng tin cậy, là chỗ dựa vững chắc.", meaningEn: "Earth Bureau 5. Stable, loyal, reliable, a solid foundation." },
};

export function getCuc(hanh: NguHanh): CucInfo {
  return CUC_TABLE[hanh] ?? CUC_TABLE.tho;
}

// ===================== 8. 12 CUNG (Palaces) =====================
export interface CungInfo {
  value: number;
  name: string;
  nameEn: string;
  hanh: NguHanh;
  meaning: string;
  meaningEn: string;
}

export const CUNG_12: CungInfo[] = [
  { value: 1, name: "Mệnh", nameEn: "Destiny", hanh: "tho",
    meaning: "Cung Mệnh — cung quan trọng nhất, phản ánh bản chất, tính cách và vận mệnh tổng thể của một người.", meaningEn: "Destiny Palace — the most important palace, reflecting one's character and overall destiny." },
  { value: 2, name: "Phụ Mẫu", nameEn: "Parents", hanh: "moc",
    meaning: "Cung Phụ Mẫu — phản ánh mối quan hệ với cha mẹ, dòng họ và truyền thống gia đình.", meaningEn: "Parents Palace — reflects relationship with parents, ancestry and family traditions." },
  { value: 3, name: "Phúc Đức", nameEn: "Fortune", hanh: "hoa",
    meaning: "Cung Phúc Đức — phản ánh phúc phần, may mắn và sự che chở từ tổ tiên.", meaningEn: "Fortune Palace — reflects blessings, luck and ancestral protection." },
  { value: 4, name: "Điền Trạch", nameEn: "Property", hanh: "tho",
    meaning: "Cung Điền Trạch — phản ánh nhà cửa, đất đai, tài sản và nơi ở.", meaningEn: "Property Palace — reflects real estate, land, possessions and residence." },
  { value: 5, name: "Quan Lộc", nameEn: "Career", hanh: "hoa",
    meaning: "Cung Quan Lộc — phản ánh sự nghiệp, công danh, địa vị xã hội và thăng tiến.", meaningEn: "Career Palace — reflects career, reputation, social status and advancement." },
  { value: 6, name: "Nô Bộc", nameEn: "Servants", hanh: "thuy",
    meaning: "Cung Nô Bộc — phản ánh mối quan hệ với cấp dưới, đồng nghiệp, bạn bè và đối tác.", meaningEn: "Servants Palace — reflects relationships with subordinates, colleagues and partners." },
  { value: 7, name: "Thiên Di", nameEn: "Travel", hanh: "hoa",
    meaning: "Cung Thiên Di — phản ánh sự thay đổi, di chuyển, xuất ngoại và cơ hội ở phương xa.", meaningEn: "Travel Palace — reflects changes, migration, overseas opportunities." },
  { value: 8, name: "Tật Ách", nameEn: "Health", hanh: "thuy",
    meaning: "Cung Tật Ách — phản ánh sức khỏe, bệnh tật và những khó khăn, trở ngại trong cuộc sống.", meaningEn: "Health Palace — reflects health, illnesses and obstacles in life." },
  { value: 9, name: "Tài Bạch", nameEn: "Wealth", hanh: "kim",
    meaning: "Cung Tài Bạch — phản ánh tài chính, thu nhập, khả năng kiếm tiền và quản lý tài sản.", meaningEn: "Wealth Palace — reflects finances, income, earning ability and asset management." },
  { value: 10, name: "Tử Tức", nameEn: "Children", hanh: "thuy",
    meaning: "Cung Tử Tức — phản ánh con cái, việc sinh nở và mối quan hệ với con cháu.", meaningEn: "Children Palace — reflects children, childbirth and relationships with descendants." },
  { value: 11, name: "Phu Thê", nameEn: "Spouse", hanh: "kim",
    meaning: "Cung Phu Thê — phản ánh hôn nhân, người bạn đời và mối quan hệ vợ chồng.", meaningEn: "Spouse Palace — reflects marriage, partner and marital relationship." },
  { value: 12, name: "Huynh Đệ", nameEn: "Siblings", hanh: "moc",
    meaning: "Cung Huynh Đệ — phản ánh anh chị em, bạn bè thân thiết và các mối quan hệ ngang hàng.", meaningEn: "Siblings Palace — reflects siblings, close friends and peer relationships." },
];
