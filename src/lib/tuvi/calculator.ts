// Tử Vi Calculator — Tứ Trụ (Four Pillars) Engine
import type { TuViInput, TuViResult, TuTru, BanMenh, Cuc, DaiHan, CanChi, ThienCan, NguHanh, NguHanhTuongSinh } from './types';
import { THIEN_CAN, DIA_CHI, getNapAm, getCuc, getSinhKhac, timHoaGiap, gioToChi } from './constants';
import { solarToLunar, calcJDN, getDayCanChiIndex, getYearCanChiIndex, getMonthCanChiIndex, getHourCanChiIndex } from './calendar';

// ----- HELPERS -----

function getThienCan(index: number): ThienCan {
  const c = THIEN_CAN[((index % 10) + 10) % 10];
  if (!c) throw new Error(`Invalid can index: ${index}`);
  return c;
}

function buildCanChi(canIndex: number, chiIndex: number): CanChi {
  const can = getThienCan(canIndex);
  const chi = DIA_CHI[((chiIndex % 12) + 12) % 12];
  const entry = timHoaGiap(canIndex, chiIndex);
  return {
    can,
    chi,
    fullName: entry?.name ?? `${can.name} ${chi.name}`,
  };
}

// ----- INTERPRETATIONS (luận giải) -----

function generateInterpretations(
  tuTru: TuTru,
  banMenhHanh: NguHanh,
  cucHanh: NguHanh,
  tuongSinh: Record<string, NguHanhTuongSinh>,
  gioiTinh: "nam" | "nu"
) {
  const menhHanh = banMenhHanh;
  const canNgay = tuTru.ngay.can;

  // Tính cách interpretations based on Tứ Trụ
  const tinhCach = generateTinhCach(tuTru, menhHanh, gioiTinh);
  const suNghiep = generateSuNghiep(tuTru, menhHanh, cucHanh);
  const tinhDuyen = generateTinhDuyen(tuTru, gioiTinh);
  const sucKhoe = generateSucKhoe(tuTru, menhHanh);
  const giaDao = generateGiaDao(tuTru);
  const taiLoc = generateTaiLoc(tuTru, menhHanh, cucHanh, tuongSinh);
  const vanHan = generateVanHan(tuTru);

  return { tinhCach, suNghiep, tinhDuyen, sucKhoe, giaDao, taiLoc, vanHan };
}

function generateTinhCach(tuTru: TuTru, menhHanh: NguHanh, gioiTinh: "nam" | "nu") {
  const canNgay = tuTru.ngay.can;
  const chiNam = tuTru.nam.chi;

  const chiTiet: string[] = [
    `Tứ trụ năm ${tuTru.nam.fullName}, tháng ${tuTru.thang.fullName}, ngày ${tuTru.ngay.fullName}, giờ ${tuTru.gio.fullName}.`,
    `Thân chủ (can ngày) là ${canNgay.name} (${canNgay.nameEn}) — ${canNgay.meaning.split('.')[0]}.`,
    `Chi năm ${DIA_CHI[chiNam.value].name} (${DIA_CHI[chiNam.value].nameEn}) cho thấy ${DIA_CHI[chiNam.value].meaning.split('.')[0].toLowerCase()}.`,
    `Bản mệnh ${menhHanh === 'kim' ? 'Kim' : menhHanh === 'moc' ? 'Mộc' : menhHanh === 'thuy' ? 'Thủy' : menhHanh === 'hoa' ? 'Hỏa' : 'Thổ'} — ${menhHanh === 'kim' ? 'cương nghị, quyết đoán' : menhHanh === 'moc' ? 'nhân hậu, linh hoạt' : menhHanh === 'thuy' ? 'thông thái, mềm dẻo' : menhHanh === 'hoa' ? 'nhiệt huyết, mạnh mẽ' : 'ổn định, đáng tin cậy'}.`,
  ];

  const gioiTinhStr = gioiTinh === "nam" ? "nam" : "nữ";
  const loiKhuyen = `Là người ${gioiTinhStr} mang mệnh ${menhHanh === 'kim' ? 'Kim' : menhHanh === 'moc' ? 'Mộc' : menhHanh === 'thuy' ? 'Thủy' : menhHanh === 'hoa' ? 'Hỏa' : 'Thổ'}, bạn nên phát huy thế mạnh ${canNgay.name === 'Giáp' || canNgay.name === 'Bính' || canNgay.name === 'Mậu' || canNgay.name === 'Canh' || canNgay.name === 'Nhâm' ? 'sự mạnh mẽ, quyết đoán' : 'sự mềm dẻo, tinh tế'} của mình. Hãy cân bằng giữa lý trí và cảm xúc để đạt được thành công.`;

  const noidung = `Bạn là người có tính cách ${chiNam.value === 2 || chiNam.value === 6 || chiNam.value === 10 ? 'mạnh mẽ, độc lập' : chiNam.value === 3 || chiNam.value === 7 || chiNam.value === 11 ? 'nhẹ nhàng, tinh tế' : chiNam.value === 0 || chiNam.value === 4 || chiNam.value === 8 ? 'thông minh, linh hoạt' : 'kiên định, đáng tin cậy'}. ${canNgay.meaning.split('.')[0]}. Bạn có xu hướng ${gioiTinh === 'nam' ? 'hướng ngoại, thích giao tiếp và lãnh đạo' : 'hướng nội, sâu sắc và giàu trực giác'}.`;

  return { noidung, chiTiet, loiKhuyen };
}

function generateSuNghiep(tuTru: TuTru, menhHanh: NguHanh, cucHanh: NguHanh) {
  const chiTiet: string[] = [];

  if (cucHanh === menhHanh || getSinhKhac(cucHanh, menhHanh) === 'tuong_sinh') chiTiet.push("Mệnh và Cục tương sinh/tương đồng → sự nghiệp hanh thông.");
  if (getSinhKhac(cucHanh, menhHanh) === 'tuong_khac') chiTiet.push("Mệnh và Cục tương khắc → cần nỗ lực vượt qua thử thách trong sự nghiệp.");

  const huongNghe: string = menhHanh === 'kim' ? 'phù hợp với các ngành liên quan đến kim loại, máy móc, tài chính, ngân hàng, luật pháp.' :
    menhHanh === 'moc' ? 'phù hợp với các ngành liên quan đến giáo dục, nghệ thuật, sáng tạo, nông nghiệp, y học.' :
    menhHanh === 'thuy' ? 'phù hợp với các ngành liên quan đến giao tiếp, truyền thông, du lịch, thương mại, công nghệ.' :
    menhHanh === 'hoa' ? 'phù hợp với các ngành liên quan đến năng lượng, điện tử, truyền thông, giải trí, lãnh đạo.' :
    'phù hợp với các ngành liên quan đến bất động sản, xây dựng, nông nghiệp, quản lý.';

  const noidung = `Sự nghiệp của bạn có sự ổn định và phát triển bền vững. ${huongNghe.charAt(0).toUpperCase() + huongNghe.slice(1)}`;

  const loiKhuyen = `Hãy tập trung vào thế mạnh của mình, ${menhHanh === 'kim' ? 'rèn luyện sự kiên nhẫn và linh hoạt' : menhHanh === 'moc' ? 'phát huy khả năng sáng tạo và kết nối' : menhHanh === 'thuy' ? 'tận dụng trí thông minh và khả năng giao tiếp' : menhHanh === 'hoa' ? 'phát huy nhiệt huyết và khả năng lãnh đạo' : 'xây dựng nền tảng vững chắc và mở rộng quan hệ'}. Học hỏi không ngừng và kiên trì với mục tiêu dài hạn.`;

  return { noidung, chiTiet, loiKhuyen };
}

function generateTinhDuyen(tuTru: TuTru, gioiTinh: "nam" | "nu") {
  const chiNgay = tuTru.ngay.chi;
  const chiThang = tuTru.thang.chi;
  const chiGio = tuTru.gio.chi;

  const chiTiet: string[] = [
    `Ngày sinh thuộc chi ${DIA_CHI[chiNgay.value].name} (${DIA_CHI[chiNgay.value].nameEn}) — ${DIA_CHI[chiNgay.value].meaning.split('.')[0].toLowerCase()}.`,
    `Tháng sinh chi ${DIA_CHI[chiThang.value].name} cho thấy ${gioiTinh === 'nam' ? 'đường tình duyên' : 'hôn nhân gia đạo'} có ${chiThang.value === 0 || chiThang.value === 6 || chiThang.value === 4 || chiThang.value === 10 ? 'nhiều may mắn' : 'sự ổn định'}.`,
  ];

  const noidung = `Tình duyên của bạn có ${chiNgay.value === chiGio.value ? 'sự hài hòa và đồng điệu về tâm hồn' : 'nhiều trải nghiệm phong phú'}. ${gioiTinh === 'nam' ? 'Bạn là người chung thủy, có trách nhiệm trong tình yêu' : 'Bạn giàu cảm xúc, tinh tế và sâu sắc trong tình yêu'}.`;
  const loiKhuyen = `Trong chuyện tình cảm, hãy lắng nghe trái tim mình nhưng đừng quên lý trí. Tìm người có sự đồng điệu về tâm hồn và chia sẻ được những giá trị sống với bạn.`;

  return { noidung, chiTiet, loiKhuyen };
}

function generateSucKhoe(tuTru: TuTru, menhHanh: NguHanh) {
  const chiTiet: string[] = [];
  const hoatDong = menhHanh === 'kim' ? 'hô hấp, da' :
    menhHanh === 'moc' ? 'gan, mắt' :
    menhHanh === 'thuy' ? 'thận, tiết niệu' :
    menhHanh === 'hoa' ? 'tim mạch, huyết áp' :
    'tiêu hóa, dạ dày';

  chiTiet.push(`Theo Ngũ hành, mệnh ${menhHanh === 'kim' ? 'Kim' : menhHanh === 'moc' ? 'Mộc' : menhHanh === 'thuy' ? 'Thủy' : menhHanh === 'hoa' ? 'Hỏa' : 'Thổ'} cần chú ý ${hoatDong}.`);

  const tuongSinhKhac = getSinhKhac(tuTru.nam.can.hanh, tuTru.ngay.can.hanh);
  if (tuongSinhKhac === 'tuong_khac') chiTiet.push("Có xung khắc giữa năm và ngày — cần chú ý sức khỏe tổng thể, nghỉ ngơi điều độ.");

  const noidung = `Sức khỏe của bạn nhìn chung ${chiTiet.length <= 1 ? 'tốt, có sức đề kháng cao' : 'cần chú ý hơn một chút'}. Cơ địa thuộc mệnh ${menhHanh === 'kim' ? 'Kim' : menhHanh === 'moc' ? 'Mộc' : menhHanh === 'thuy' ? 'Thủy' : menhHanh === 'hoa' ? 'Hỏa' : 'Thổ'}, cần quan tâm đến ${hoatDong}.`;
  const loiKhuyen = `Duy trì lối sống lành mạnh, tập thể dục đều đặn và khám sức khỏe định kỳ. Đặc biệt chú ý đến ${hoatDong}.`;

  return { noidung, chiTiet, loiKhuyen };
}

function generateGiaDao(tuTru: TuTru) {
  const chiTiet: string[] = [
    `Tứ trụ năm ${tuTru.nam.fullName} — ảnh hưởng từ gia tộc, dòng họ.`,
    `Tháng ${tuTru.thang.fullName} — mối quan hệ với cha mẹ và anh em.`,
  ];

  const noidung = `Gia đạo của bạn có sự gắn kết và yêu thương. Mối quan hệ với gia đình khá tốt đẹp, có sự hỗ trợ từ người thân.`;
  const loiKhuyen = `Gia đình là nền tảng quan trọng. Hãy dành thời gian cho người thân, vun đắp các mối quan hệ gia đình và giữ gìn truyền thống tốt đẹp.`;

  return { noidung, chiTiet, loiKhuyen };
}

function generateTaiLoc(tuTru: TuTru, menhHanh: NguHanh, cucHanh: NguHanh, tuongSinh: Record<string, NguHanhTuongSinh>) {
  const chiTiet: string[] = [];

  if (getSinhKhac(menhHanh, cucHanh) === 'tuong_sinh') chiTiet.push("Mệnh sinh Cục → tài lộc dồi dào, có khả năng tích lũy.");
  if (getSinhKhac(cucHanh, menhHanh) === 'tuong_sinh') chiTiet.push("Cục sinh Mệnh → được trợ giúp về tài chính từ nhiều phía.");
  if (getSinhKhac(menhHanh, cucHanh) === 'tuong_khac') chiTiet.push("Mệnh khắc Cục → cần quản lý tài chính cẩn thận.");

  const noidung = `Tài lộc của bạn ${chiTiet.length > 0 ? 'có triển vọng tốt' : 'ở mức ổn định'}. ${menhHanh === 'kim' ? 'Bạn có khả năng quản lý tài chính tốt' : menhHanh === 'moc' ? 'Tài chính của bạn phát triển theo hướng bền vững' : menhHanh === 'thuy' ? 'Bạn có nhiều nguồn thu nhập khác nhau' : menhHanh === 'hoa' ? 'Bạn có khả năng kiếm tiền tốt nhờ sự năng động' : 'Tài chính ổn định nhờ sự chăm chỉ và kiên trì'}.`;
  const loiKhuyen = `Quản lý tài chính thông minh, chi tiêu hợp lý và đầu tư vào những lĩnh vực phù hợp với mệnh ${menhHanh === 'kim' ? 'Kim' : menhHanh === 'moc' ? 'Mộc' : menhHanh === 'thuy' ? 'Thủy' : menhHanh === 'hoa' ? 'Hỏa' : 'Thổ'} của bạn.`;

  return { noidung, chiTiet, loiKhuyen };
}

function generateVanHan(tuTru: TuTru) {
  const namHienTai = new Date().getFullYear();
  const chiTiet: string[] = [];

  const chiNam = tuTru.nam.chi.value;
  const chiNamHienTai = (namHienTai - 4) % 12;

  // Check if current year conflicts with birth year
  const tamHai = [chiNam + 1, chiNam + 2, chiNam + 9].map(x => ((x % 12) + 12) % 12);
  if (tamHai.includes(chiNamHienTai)) chiTiet.push("Năm nay có thể gặp Tam Hải — nên cẩn trọng trong công việc và tài chính.");

  const noidung = `Vận hạn của bạn ${chiTiet.length === 0 ? 'tương đối bình thường, không có biến động lớn' : 'có những thử thách nhất định, cần tỉnh táo và thận trọng'}.`;
  const loiKhuyen = `Dù vận hạn thế nào, điều quan trọng nhất là giữ tâm thế tích cực, sống tốt và làm việc chăm chỉ. Vận mệnh có thể thay đổi nhờ nỗ lực của bản thân.`;

  return { noidung, chiTiet, loiKhuyen };
}

function generateNamHienTai(tuTru: TuTru, nam: number) {
  const { canIndex, chiIndex } = getYearCanChiIndex(nam);
  const can = getThienCan(canIndex);
  const entry = timHoaGiap(canIndex, chiIndex);
  const napAm = getNapAm(canIndex, chiIndex);
  const chiNam = DIA_CHI[chiIndex];

  const meaning = `Năm ${entry?.name ?? ''} — ${napAm.napAm} — thuộc hành ${napAm.hanh === 'kim' ? 'Kim' : napAm.hanh === 'moc' ? 'Mộc' : napAm.hanh === 'thuy' ? 'Thủy' : napAm.hanh === 'hoa' ? 'Hỏa' : 'Thổ'}. Năm nay có sự kết hợp giữa ${can.name} và ${chiNam.name}, mang đến ${napAm.hanh === tuTru.nam.can.hanh || getSinhKhac(napAm.hanh, tuTru.nam.can.hanh) === 'tuong_sinh' ? 'nhiều may mắn và cơ hội phát triển' : 'những thử thách cần vượt qua để trưởng thành'}.`;

  return {
    nam,
    amLich: entry?.name ?? '',
    hanh: napAm.hanh,
    tuongKhacTuoi: napAm.hanh !== tuTru.nam.can.hanh && getSinhKhac(napAm.hanh, tuTru.nam.can.hanh) === 'tuong_khac',
    sao: 'Thái Dương',
    han: 'Thiên Không',
    meaning,
    meaningEn: "",
  };
}

// ===================== MAIN EXPORT =====================

export function calculateTuVi(input: TuViInput): TuViResult {
  const { ngaySinh, gioSinh, gioiTinh } = input;
  const [y, m, d] = ngaySinh.split('-').map(Number);

  // 1. Lunar date
  const lunarDate = solarToLunar(d, m, y);

  // 2. Tứ Trụ
  const jdn = calcJDN(d, m, y);

  // Year can chi
  const yearCC = getYearCanChiIndex(y);

  // Month can chi (based on year can and lunar month)
  const monthCC = getMonthCanChiIndex(lunarDate.thang, yearCC.canIndex);

  // Day can chi
  const dayCC = getDayCanChiIndex(jdn);

  // Hour can chi
  const hourCC = getHourCanChiIndex(gioSinh, dayCC.canIndex);

  const tuTru: TuTru = {
    nam: buildCanChi(yearCC.canIndex, yearCC.chiIndex),
    thang: buildCanChi(monthCC.canIndex, lunarDate.thang),
    ngay: buildCanChi(dayCC.canIndex, dayCC.chiIndex),
    gio: buildCanChi(hourCC.canIndex, hourCC.chiIndex),
  };

  // 3. Bản Mệnh (Nạp Âm)
  const napAm = getNapAm(yearCC.canIndex, yearCC.chiIndex);
  const banMenh: BanMenh = {
    napAm: napAm.napAm,
    napAmEn: napAm.napAm,
    hanh: napAm.hanh,
    hanhName: napAm.hanh === 'kim' ? 'Kim' : napAm.hanh === 'moc' ? 'Mộc' : napAm.hanh === 'thuy' ? 'Thủy' : napAm.hanh === 'hoa' ? 'Hỏa' : 'Thổ',
    meaning: `Bản mệnh ${napAm.napAm} — thuộc hành ${napAm.hanh === 'kim' ? 'Kim' : napAm.hanh === 'moc' ? 'Mộc' : napAm.hanh === 'thuy' ? 'Thủy' : napAm.hanh === 'hoa' ? 'Hỏa' : 'Thổ'}. Đây là nền tảng năng lượng cốt lõi của cuộc đời bạn.`,
    meaningEn: "",
  };

  // 4. Cục
  const cucInfo = getCuc(napAm.hanh);
  const cuc: Cuc = {
    name: cucInfo.name,
    nameEn: cucInfo.nameEn,
    hanh: cucInfo.hanh,
    value: cucInfo.value,
    meaning: cucInfo.meaning,
    meaningEn: cucInfo.meaningEn,
  };

  // 5. Tương sinh tương khắc
  const tuongSinhKhac = {
    menhCuc: getSinhKhac(banMenh.hanh, cuc.hanh),
    namThang: getSinhKhac(tuTru.nam.can.hanh, tuTru.thang.can.hanh),
    thangNgay: getSinhKhac(tuTru.thang.can.hanh, tuTru.ngay.can.hanh),
    ngayGio: getSinhKhac(tuTru.ngay.can.hanh, tuTru.gio.can.hanh),
  };

  // 6. Cung Mệnh, Cung Thân (simplified)
  const cungMenh: Cuc = { ...cuc, name: "Mệnh", nameEn: "Destiny" };
  const cungThan: Cuc = { ...cuc, name: "Thân", nameEn: "Self", meaning: "Cung Thân — phản ánh sự nghiệp và các mối quan hệ xã hội.", meaningEn: "" };

  // 7. Đại hạn (simplified - 10-year cycles)
  const daiHan: DaiHan[] = [];
  const cucValue = cuc.value;
  const startAge = (cucValue % 5) * 3;  // simplified calculation
  for (let i = 0; i < 8; i++) {
    const start = startAge + i * 10;
    const end = start + 9;
    const dhCanIndex = (yearCC.canIndex + i * 2) % 10;
    const dhChiIndex = (yearCC.chiIndex + i) % 12;
    daiHan.push({
      tuoiBatDau: start,
      tuoiKetThuc: end,
      cung: buildCanChi(dhCanIndex, dhChiIndex),
      thoiGian: `${start}-${end} tuổi`,
    });
  }

  // 8. Interpretations
  const phanTich = generateInterpretations(tuTru, banMenh.hanh, cuc.hanh, tuongSinhKhac, gioiTinh);

  // 9. Current year analysis
  const currentYear = new Date().getFullYear();
  const namHienTai = generateNamHienTai(tuTru, currentYear);

  return {
    input,
    lunarDate,
    tuTru,
    thanChu: tuTru.ngay.can,
    banMenh,
    cuc,
    cungMenh,
    cungThan,
    daiHan,
    ngayHienTai: new Date().toISOString().split('T')[0],
    tuongSinhKhac,
    phanTich,
    namHienTai,
  };
}
