export type LuaChon = {
  value: string;
  label: string;
  diem: number;
};

export type CauHoi = {
  id: string;
  label: string;
  hint?: string;
  options: LuaChon[];
};

export type KetQuaChanDoan = {
  diem: number;
  muc: string;
  moTa: string;
  goiGoiY: string;
  tenGoi: string;
  viecLam: string[];
};

export type PublicActionState = {
  error?: string;
  ok?: string;
  ketQua?: KetQuaChanDoan;
};

export const CAU_HOI: CauHoi[] = [
  {
    id: "q1",
    label: "Bạn đang ở giai đoạn nào?",
    hint: "Chọn đúng nhất với hiện tại, không chọn theo mong muốn.",
    options: [
      { value: "y-tuong", label: "Mới có ý tưởng", diem: 0 },
      { value: "bat-dau", label: "Đã bắt đầu, chưa có doanh thu", diem: 3 },
      { value: "dang-chay", label: "Đang có doanh thu", diem: 7 },
      { value: "co-doi", label: "Đã có đội/nhân sự", diem: 10 },
    ],
  },
  {
    id: "q2",
    label: "Thu nhập hằng tháng từ công việc hiện tại?",
    hint: "Tính trung bình 3 tháng gần nhất.",
    options: [
      { value: "chua-co", label: "Chưa có thu nhập", diem: 0 },
      { value: "duoi-10", label: "Dưới 10 triệu", diem: 2 },
      { value: "10-30", label: "10 – 30 triệu", diem: 5 },
      { value: "30-50", label: "30 – 50 triệu", diem: 8 },
      { value: "tren-50", label: "Trên 50 triệu", diem: 10 },
    ],
  },
  {
    id: "q3",
    label: "Bạn đã có pháp nhân hoặc hộ kinh doanh chưa?",
    options: [
      { value: "chua-co", label: "Chưa có", diem: 0 },
      { value: "dang-lam", label: "Đang làm hồ sơ", diem: 4 },
      { value: "da-co", label: "Đã có, đang hoạt động", diem: 8 },
    ],
  },
  {
    id: "q4",
    label: "Hóa đơn và hợp đồng của bạn đang ở đâu?",
    options: [
      { value: "chua-co", label: "Chưa có", diem: 0 },
      { value: "tu-lam", label: "Tự làm, chưa chuẩn", diem: 3 },
      { value: "co-mau", label: "Có mẫu cơ bản", diem: 6 },
      { value: "day-du", label: "Đầy đủ, có kiểm soát", diem: 8 },
    ],
  },
  {
    id: "q5",
    label: "Bạn có quy trình bán hàng nào không?",
    options: [
      { value: "chua-co", label: "Chưa có, làm theo cảm hứng", diem: 0 },
      { value: "trong-dau", label: "Nằm trong đầu", diem: 3 },
      { value: "co-van-ban", label: "Đã viết thành văn bản", diem: 6 },
      { value: "co-do-luong", label: "Có văn bản và đo lường", diem: 8 },
    ],
  },
  {
    id: "q6",
    label: "Kênh online của bạn hiện tại?",
    options: [
      { value: "chua-co", label: "Chưa có kênh nào", diem: 0 },
      { value: "mot-kenh", label: "Một kênh, chưa đều", diem: 5 },
      { value: "nhieu-kenh", label: "Nhiều kênh, có nội dung đều", diem: 10 },
    ],
  },
  {
    id: "q7",
    label: "Bạn đang dùng AI vào việc gì?",
    options: [
      { value: "chua-dung", label: "Chưa dùng", diem: 0 },
      { value: "thu-nghiem", label: "Thử nghiệm lẻ tẻ", diem: 3 },
      { value: "hang-ngay", label: "Dùng hằng ngày cho vài việc", diem: 6 },
      { value: "he-thong", label: "Đã có quy trình AI", diem: 10 },
    ],
  },
  {
    id: "q8",
    label: "Bạn có người đồng hành hoặc mentor không?",
    options: [
      { value: "chua-co", label: "Chưa có", diem: 0 },
      { value: "thin-thoang", label: "Thỉnh thoảng hỏi bạn bè", diem: 5 },
      { value: "co-nguoi", label: "Có mentor/đồng hành định kỳ", diem: 10 },
    ],
  },
  {
    id: "q9",
    label: "Mục tiêu lớn nhất trong 90 ngày tới?",
    options: [
      { value: "ro-viec", label: "Rõ việc cần làm", diem: 0 },
      { value: "khach-dau", label: "Có khách hàng đầu tiên", diem: 4 },
      { value: "on-dinh", label: "Doanh thu ổn định", diem: 7 },
      { value: "he-thong", label: "Hệ thống và đội nhóm", diem: 10 },
    ],
  },
  {
    id: "q10",
    label: "Ngân sách bạn sẵn sàng đầu tư trong 3 tháng?",
    hint: "Chọn mức trung thực để OPC gợi ý đúng gói.",
    options: [
      { value: "duoi-3", label: "Dưới 3 triệu", diem: 0 },
      { value: "3-10", label: "3 – 10 triệu", diem: 3 },
      { value: "10-30", label: "10 – 30 triệu", diem: 6 },
      { value: "tren-30", label: "Trên 30 triệu", diem: 10 },
    ],
  },
];

export const TEN_GOI: Record<string, string> = {
  "khoi-tao": "Khởi tạo",
  "chuan-hoa": "Chuẩn hóa",
  membership: "Membership",
  pro: "Đồng hành Pro",
  "ai-agent": "AI Agent",
  retreat: "Retreat Măng Đen",
  launch: "OPC Launch",
  residency: "OPC Residency",
  partner: "OPC Partner",
  certified: "OPC Certified",
};

/** Tổng điểm tối đa của bộ câu hỏi hiện tại. */
export const DIEM_TOI_DA = CAU_HOI.reduce(
  (tong, cau) => tong + Math.max(...cau.options.map((o) => o.diem)),
  0
);

/**
 * Tính kết quả chẩn đoán từ câu trả lời.
 * Hàm thuần — dùng được ở client (hiển thị sớm) và server (ghi lead).
 */
export function tinhKetQua(answers: Record<string, string>): KetQuaChanDoan {
  let raw = 0;
  for (const cau of CAU_HOI) {
    const chon = cau.options.find((o) => o.value === answers[cau.id]);
    raw += chon?.diem ?? 0;
  }

  const diem = Math.max(0, Math.min(100, Math.round((raw / DIEM_TOI_DA) * 100)));
  const nganSach = answers.q10;
  const giaiDoan = answers.q1;

  let muc = "Người mới";
  let moTa = "Bạn đang ở điểm bắt đầu. Việc quan trọng nhất là chọn đúng một việc để kiểm chứng, thay vì học quá nhiều.";
  let goiGoiY = "khoi-tao";
  let viecLam = [
    "Chọn một việc kinh doanh để kiểm chứng trong 30 ngày",
    "Hoàn tất chẩn đoán pháp lý và chi phí cơ bản",
    "Tham gia workshop nhập môn để có bản đồ tổng thể",
  ];

  if (diem >= 30 && diem < 55) {
    muc = "Đang chuẩn hóa";
    moTa = "Bạn đã có việc để làm nhưng hệ thống còn rời rạc. Ưu tiên chuẩn hóa một quy trình và tách bạch tiền cá nhân – doanh nghiệp.";
    goiGoiY = "chuan-hoa";
    viecLam = [
      "Chuẩn hóa một quy trình bán hàng từ đầu đến cuối",
      "Tách chi phí cá nhân và chi phí doanh nghiệp",
      "Đặt 3 chỉ số đo trong 90 ngày",
    ];
  } else if (diem >= 55 && diem < 75) {
    muc = "Đang vận hành";
    moTa = "Bạn đã có doanh thu và khách hàng. Điểm nghẽn tiếp theo là hệ thống, người đồng hành và cách đo lường.";
    goiGoiY = "pro";
    viecLam = [
      "Chọn 3 KPI tăng trưởng cho 90 ngày",
      "Cài ít nhất một quy trình AI để giảm việc lặp lại",
      "Lên lịch review 30/60/90 với người đồng hành",
    ];
  } else if (diem >= 75) {
    muc = "Sẵn sàng mở rộng";
    moTa = "Bạn có nền tảng tương đối vững. Ưu tiên tiếp theo là tối ưu biên lợi nhuận, tự động hóa và mở rộng có kiểm soát.";
    goiGoiY = "pro";
    viecLam = [
      "Tối ưu biên lợi nhuận của 3 dòng sản phẩm chính",
      "Tự động hóa bán hàng – CSKH bằng AI",
      "Thiết kế kế hoạch 6 tháng cho người hoặc đội kế nhiệm",
    ];
  }

  // Ngân sách thấp nhưng nền tảng khá: bắt đầu bằng AI Agent thay vì Pro.
  if (diem >= 55 && nganSach === "duoi-3") {
    goiGoiY = "ai-agent";
    moTa += " Với ngân sách hiện tại, bắt đầu bằng AI Agent để tạo đòn bẩy trước khi lên Pro.";
  }

  // Người đã có đội, mục tiêu hệ thống, ngân sách cao: gợi ý Residency/Retreat.
  if (diem >= 75 && giaiDoan === "co-doi" && nganSach === "tren-30") {
    goiGoiY = "residency";
    moTa += " Bạn phù hợp với OPC Residency để tách khỏi guồng và thiết kế lại hệ thống trong không gian mới.";
  }

  return {
    diem,
    muc,
    moTa,
    goiGoiY,
    tenGoi: TEN_GOI[goiGoiY] ?? "OPC",
    viecLam,
  };
}
