/**
 * Nội dung trang chi tiết (landing) cho từng gói OPC.
 *
 * Nguồn: `~/hermes-notes/projects/NOOI/opc-center/00-dieu-hanh/OPC-CENTER-HE-SINH-THAI-SAN-PHAM-DICH-VU-2026-10-26.md`
 * + `OPC-CENTER-GIA-TRI-CONG-DONG-MANG-LUOI-2026-10-26.md`.
 *
 * Nguyên tắc biên tập:
 *  - Chỉ mô tả đầu ra OPC GIAO ĐƯỢC (deliverable), không hứa doanh thu/thành công.
 *  - Giá và chính sách phải khớp `opc_goi` + tài liệu sản phẩm; không tự thêm ưu đãi.
 *  - Mỗi gói trả lời 4 câu: phù hợp với ai · nhận được gì · bên trong có gì · không phù hợp với ai.
 */

export type ChiTietGoi = {
  /** 1–2 câu định vị, dùng cho hero + meta description. */
  dinhVi: string;
  /** Dấu hiệu "bạn đang ở đây" — giúp khách tự nhận diện. */
  phuHop: string[];
  /** Lọc kỳ vọng — tăng độ tin, giảm lead sai. */
  khongPhuHop: string[];
  /** 3 đầu ra cam kết (deliverable). */
  dauRa: { ten: string; moTa: string }[];
  /** Cấu phần bên trong gói / lịch trình. */
  noiDung: { ten: string; moTa: string }[];
  /** Các bước khách trải qua. */
  cachHoatDong: { buoc: string; moTa: string }[];
  thoiGian: string;
  hinhThuc: string;
  chinhSach: string[];
  faq: { hoi: string; dap: string }[];
  /** Gói liền kề để khách so sánh. */
  soSanh: { ma: string; moTa: string }[];
};

export const CHI_TIET_GOI: Record<string, ChiTietGoi> = {
  "khoi-tao": {
    dinhVi:
      "Bạn muốn làm kinh doanh một mình nhưng chưa biết mình đang thiếu gì. Khởi tạo là bước chẩn đoán 20 phút, trả về một trang kết luận: điểm mạnh, điểm nghẽn và việc nên làm trước.",
    phuHop: [
      "Bạn chưa có doanh thu, hoặc mới có vài đơn lẻ tẻ.",
      "Bạn đang tự làm mọi thứ và không biết việc nào đáng làm trước.",
      "Bạn phân vân giữa tự học, thuê người làm hộ hay tìm người đồng hành.",
      "Bạn mới nghỉ việc, chuyển nghề hoặc vừa bắt đầu bán một sản phẩm mới.",
    ],
    khongPhuHop: [
      "Bạn đã vận hành ổn định và cần người làm cùng ngay — xem Đồng hành Pro.",
      "Bạn cần pháp lý, thuế, ngân hàng, hóa đơn được làm hộ ngay — xem OPC Launch.",
    ],
    dauRa: [
      {
        ten: "Bản chẩn đoán 1 trang",
        moTa: "Điểm mạnh, ba điểm nghẽn lớn nhất và mức độ chín của mô hình hiện tại.",
      },
      {
        ten: "Lộ trình 30 ngày",
        moTa: "Một việc ưu tiên, thứ tự làm và dấu hiệu để biết mình đã đúng hướng.",
      },
      {
        ten: "Vé vào cộng đồng",
        moTa: "Tham gia workshop hằng tháng, thư viện mẫu và nhóm cùng giai đoạn.",
      },
    ],
    noiDung: [
      { ten: "10 câu hỏi chẩn đoán", moTa: "Làm online, khoảng 20 phút, không cần thẻ." },
      { ten: "Báo cáo tự động", moTa: "Kết luận theo mô hình OPC: năng lực, quy trình, pháp lý, kênh bán." },
      { ten: "Workshop 90 phút/tháng", moTa: "Một chủ đề vận hành cụ thể, có phần hỏi đáp." },
      { ten: "Thư viện mẫu", moTa: "Bảng giá, hợp đồng, SOP, prompt AI dùng lại được." },
      { ten: "Cộng đồng theo giai đoạn", moTa: "Nhóm người đang ở cùng chặng, không phải nhóm chat hỗn hợp." },
    ],
    cachHoatDong: [
      { buoc: "1. Trả lời 10 câu", moTa: "Bạn mô tả hiện trạng: doanh thu, thời gian, kỹ năng, điểm nghẽn." },
      { buoc: "2. Nhận báo cáo", moTa: "Hệ thống trả về bản chẩn đoán 1 trang kèm lộ trình 30 ngày." },
      { buoc: "3. Chọn một việc", moTa: "Chỉ một việc ưu tiên — không phải danh sách 20 việc." },
      { buoc: "4. Vào cộng đồng", moTa: "Dự workshop, dùng thư viện mẫu, hỏi khi bị chặn." },
      { buoc: "5. Nâng cấp khi cần", moTa: "Chỉ mua gói tiếp theo khi việc 30 ngày đã chạy." },
    ],
    thoiGian: "20 phút chẩn đoán · workshop 90 phút mỗi tháng",
    hinhThuc: "Online toàn quốc",
    chinhSach: [
      "Miễn phí, không cần thẻ, không cam kết mua gói.",
      "Không cần đến Măng Đen.",
      "Kết quả chẩn đoán là của bạn; OPC chỉ dùng để tư vấn nếu bạn yêu cầu.",
    ],
    faq: [
      { hoi: "Chẩn đoán có thật sự miễn phí?", dap: "Có. Bạn không nhập thẻ, không bị trừ tiền. OPC chỉ liên hệ khi bạn để lại nhu cầu." },
      { hoi: "Kết quả có phải bản báo giá bán gói?", dap: "Không. Báo cáo nêu điểm nghẽn và việc nên làm. Nếu gói nào không phù hợp, OPC phải nói rõ." },
      { hoi: "Tôi chưa có ý tưởng kinh doanh thì có làm được không?", dap: "Được. Chẩn đoán sẽ chỉ ra bạn đang thiếu năng lực, thị trường hay nguồn lực trước khi bàn đến sản phẩm." },
      { hoi: "Có cần đến Măng Đen không?", dap: "Không. Toàn bộ bước này diễn ra online." },
    ],
    soSanh: [
      { ma: "chuan-hoa", moTa: "Khi bạn đã biết điểm nghẽn và cần một quy trình đủ chuẩn để bán ổn định." },
      { ma: "launch", moTa: "Khi bạn cần pháp lý, thuế, ngân hàng, hóa đơn được làm hộ trong 30 ngày." },
    ],
  },

  "chuan-hoa": {
    dinhVi:
      "Một quy trình đủ chuẩn để bán ổn định — không phải thêm một khóa học để biết thêm. Bạn ra khỏi gói với quy trình đã viết, hồ sơ pháp lý cơ bản và một tài sản số dùng được ngay.",
    phuHop: [
      "Bạn là freelancer, KOL, chủ shop online có doanh thu nhưng thu nhập chập chờn.",
      "Bạn đang làm theo bản năng, mỗi khách một kiểu, không có quy trình lặp lại.",
      "Bạn có sản phẩm tốt nhưng chưa đóng gói được offer, bảng giá, quy trình giao.",
      "Bạn cần một tài sản số hoàn chỉnh (landing, profile, bộ báo giá) để bán nghiêm túc.",
    ],
    khongPhuHop: [
      "Bạn cần người làm hộ toàn bộ phần pháp lý và vận hành — xem OPC Launch.",
      "Bạn đã có hệ thống và cần tối ưu 90 ngày — xem Đồng hành Pro.",
    ],
    dauRa: [
      {
        ten: "Một quy trình chuẩn hóa",
        moTa: "Từ tiếp nhận khách đến báo giá, giao hàng, chăm sóc lại — có biểu mẫu và người chịu trách nhiệm.",
      },
      {
        ten: "Bộ hồ sơ pháp lý cơ bản",
        moTa: "Checklist pháp lý, kế toán, hợp đồng mẫu, hóa đơn và nghĩa vụ thuế cần biết.",
      },
      {
        ten: "Một tài sản số hoàn chỉnh",
        moTa: "Landing/profile, bộ báo giá và lời chào bán dùng được ngay sau khóa.",
      },
    ],
    noiDung: [
      { ten: "6 tuần · 6 module", moTa: "Mỗi tuần một phần việc, có bài tập áp vào chính doanh nghiệp của bạn." },
      { ten: "1 bài tập lớn", moTa: "Chuẩn hóa một quy trình thật, nộp và được chấm." },
      { ten: "Chấm bài & sửa", moTa: "Phản hồi cụ thể trên bài của bạn, không phải nhận xét chung." },
      { ten: "Checklist pháp lý – kế toán", moTa: "Biết mình đang thiếu gì trước khi bị nhắc." },
      { ten: "Phần mềm kế toán miễn phí", moTa: "Công cụ tối thiểu để xuất hóa đơn và theo dõi dòng tiền." },
    ],
    cachHoatDong: [
      { buoc: "1. Chọn quy trình", moTa: "Chọn một quy trình đang đau nhất: bán, giao hàng hay chăm sóc khách." },
      { buoc: "2. Học theo mẫu", moTa: "Mỗi module có khuôn, ví dụ và tiêu chí đạt." },
      { buoc: "3. Áp vào doanh nghiệp", moTa: "Bạn viết quy trình thật của mình, không làm bài giả định." },
      { buoc: "4. Nộp & được chấm", moTa: "Sửa theo phản hồi đến khi quy trình dùng được." },
      { buoc: "5. Đóng gói tài sản số", moTa: "Landing/profile, báo giá và lời chào bán hoàn chỉnh." },
    ],
    thoiGian: "6 tuần · khoảng 3–5 giờ mỗi tuần",
    hinhThuc: "Online, có chấm bài",
    chinhSach: [
      "2,5 triệu/lần.",
      "Hoàn 100% trong 7 ngày nếu bạn chưa học quá 20% nội dung.",
      "Combo 2 khóa 4,2 triệu nếu bạn cần chuẩn hóa thêm một quy trình thứ hai.",
    ],
    faq: [
      { hoi: "Khác gì khóa học thông thường?", dap: "Bạn không chỉ nghe mà phải nộp một quy trình thật và được chấm. Đầu ra là tài liệu dùng được, không phải chứng chỉ." },
      { hoi: "Tôi không có nhiều thời gian, có theo được không?", dap: "Trung bình 3–5 giờ mỗi tuần trong 6 tuần. Nếu lịch quá dày, hãy chọn OPC Launch để có người làm cùng." },
      { hoi: "Ngành của tôi khác thì có áp dụng được?", dap: "Khuôn quy trình dùng chung; phần bài tập được sửa theo ngành của bạn." },
      { hoi: "Có xuất hóa đơn không?", dap: "Có. OPC xác nhận thông tin xuất hóa đơn trước khi thu tiền." },
    ],
    soSanh: [
      { ma: "khoi-tao", moTa: "Nếu bạn chưa chắc điểm nghẽn nằm ở đâu, làm chẩn đoán trước." },
      { ma: "pro", moTa: "Nếu bạn đã có quy trình và cần tăng trưởng có người đồng hành 90 ngày." },
    ],
  },

  membership: {
    dinhVi:
      "Không đơn độc trên đường làm kinh doanh. Mỗi tháng bạn có ít nhất một workshop, một buổi office hours, một tài liệu mới và một nhóm người cùng giai đoạn để hỏi thật.",
    phuHop: [
      "Bạn đã có doanh thu nhỏ và cần người cùng ngành để so sánh, hỏi, không lặp lại lỗi.",
      "Bạn cần cập nhật chính sách, thuế, công cụ và cơ hội kết nối đối tác.",
      "Bạn muốn accountability — có người nhắc việc và một nhịp sinh hoạt đều.",
      "Bạn cần ưu đãi pháp lý, kế toán, AI, không gian và nguồn hàng đã sàng lọc.",
    ],
    khongPhuHop: [
      "Bạn cần mentor 1-1 và KPI 90 ngày — xem Đồng hành Pro.",
      "Bạn chỉ cần tự động hóa việc lặp — xem AI Agent.",
    ],
    dauRa: [
      {
        ten: "Mỗi tháng một nhịp",
        moTa: "Ít nhất 1 workshop 90 phút + 1 office hours + 1 tài liệu mới.",
      },
      {
        ten: "Cộng đồng theo giai đoạn",
        moTa: "Nhóm cùng chặng và cùng ngành, có người dẫn, không phải nhóm chat hỗn hợp.",
      },
      {
        ten: "Mạng lưới và ưu đãi",
        moTa: "Đối tác, nguồn hàng, nhân lực, ưu đãi pháp lý – kế toán – AI – không gian.",
      },
    ],
    noiDung: [
      { ten: "Cộng đồng doanh nhân OPC", moTa: "Sinh hoạt theo giai đoạn, có quy định và người điều phối." },
      { ten: "Workshop + office hours", moTa: "Workshop 90 phút mỗi tháng; office hours 2 giờ mỗi tuần để hỏi trực tiếp." },
      { ten: "Kết nối đối tác & nguồn lực", moTa: "Matching nhà cung cấp, nguồn hàng, nhân lực, đầu mối phân phối." },
      { ten: "Sự kiện chuyên gia, khách mời", moTa: "Người đang vận hành thật, không phải diễn giả truyền cảm hứng." },
      { ten: "Ưu đãi pháp lý – kế toán, AI, không gian", moTa: "Danh sách đối tác đã kiểm tra, giá ưu đãi cho thành viên." },
      { ten: "Cơ hội giới thiệu khách hàng & case study", moTa: "Được giới thiệu khi năng lực phù hợp; học từ case thật." },
      { ten: "Thư viện mẫu & tài liệu", moTa: "Hợp đồng, báo giá, SOP, prompt AI cập nhật hằng tháng." },
    ],
    cachHoatDong: [
      { buoc: "1. Vào cộng đồng", moTa: "Hoàn tất hồ sơ, chọn nhóm theo giai đoạn và ngành." },
      { buoc: "2. Dự nhịp tháng", moTa: "Workshop, office hours, sự kiện chuyên gia." },
      { buoc: "3. Dùng thư viện", moTa: "Tải mẫu, áp vào việc đang làm, hỏi khi bị chặn." },
      { buoc: "4. Kết nối", moTa: "Được matching khi có nhu cầu đối tác, nguồn hàng, nhân lực." },
      { buoc: "5. Nâng cấp khi cần", moTa: "Lên AI Agent hoặc Pro khi việc đã vượt khỏi nhu cầu cộng đồng." },
    ],
    thoiGian: "Theo tháng, huỷ bất kỳ lúc nào",
    hinhThuc: "Online + sự kiện khu vực",
    chinhSach: [
      "399.000đ/tháng.",
      "3,99 triệu/năm — tặng 2 tháng.",
      "Huỷ bất kỳ lúc nào; không hoàn tháng đã dùng.",
      "Có hợp đồng và hóa đơn khi doanh nghiệp cần.",
    ],
    faq: [
      { hoi: "Có phải chỉ là một nhóm chat?", dap: "Không. Có lịch workshop, office hours và người điều phối; nhóm chat chỉ là kênh hỏi giữa các buổi." },
      { hoi: "Office hours khác workshop thế nào?", dap: "Workshop là chủ đề chung; office hours để bạn hỏi đúng việc của mình." },
      { hoi: "Mentor cộng đồng có phải mentor 1-1?", dap: "Không. Mentor 1-1 và matching ưu tiên thuộc gói Đồng hành Pro." },
      { hoi: "Tôi ở tỉnh xa thì có tham gia được?", dap: "Được. Phần lớn hoạt động diễn ra online; sự kiện khu vực là tùy chọn." },
    ],
    soSanh: [
      { ma: "pro", moTa: "Khi bạn cần người chịu trách nhiệm cùng 3 KPI trong 90 ngày." },
      { ma: "ai-agent", moTa: "Khi bạn cần giảm việc lặp thay vì thêm hoạt động cộng đồng." },
    ],
  },

  pro: {
    dinhVi:
      "Ba KPI tăng trưởng trong 90 ngày, có người chịu trách nhiệm cùng bạn. Pro không bán thêm bài học — Pro bán nhịp làm việc, người theo sát và quyết định đúng ở từng mốc 30/60/90.",
    phuHop: [
      "Bạn đang vận hành, có doanh thu, nhưng tăng trưởng phụ thuộc vào sức của chính bạn.",
      "Bạn cần tăng doanh thu hoặc lợi nhuận mà không muốn tuyển thêm người.",
      "Bạn đã có quy trình cơ bản và cần người cùng nhìn số, chốt ưu tiên.",
      "Bạn cần một người có tên chịu trách nhiệm, không phải một khóa học tự học.",
    ],
    khongPhuHop: [
      "Bạn chưa có quy trình nào — nên qua Chuẩn hóa hoặc OPC Launch trước.",
      "Bạn chỉ cần cộng đồng và cập nhật — Membership là đủ.",
    ],
    dauRa: [
      {
        ten: "Kế hoạch 90 ngày với 3 KPI",
        moTa: "Ba chỉ số bạn chọn, có mốc 30/60/90 và người theo dõi.",
      },
      {
        ten: "Một quy trình được tự động hóa",
        moTa: "Ít nhất một việc lặp được chuyển cho AI hoặc quy trình chuẩn.",
      },
      {
        ten: "Báo cáo kết quả 90 ngày",
        moTa: "Bằng chứng để bạn quyết định gia hạn, nâng gói hay dừng.",
      },
    ],
    noiDung: [
      { ten: "Success manager có tên", moTa: "Một người theo bạn suốt 90 ngày, không đổi liên tục." },
      { ten: "2 buổi 1-1 mỗi tháng", moTa: "Làm việc trên số và quyết định, không phải nghe giảng." },
      { ten: "AI Agent vận hành", moTa: "Quyền dùng AI Agent để xử lý việc lặp trong tháng." },
      { ten: "Kế toán – pháp lý theo nhu cầu", moTa: "Kết nối đối tác đã kiểm tra khi phát sinh việc." },
      { ten: "Review 30/60/90", moTa: "Ba mốc đánh giá, có thể đổi ưu tiên nếu số liệu không đi đúng." },
      { ten: "Báo cáo tiến độ", moTa: "Tóm tắt việc đã làm, chỉ số đã đổi, việc tiếp theo." },
    ],
    cachHoatDong: [
      { buoc: "1. Chẩn đoán 90 ngày", moTa: "Xem số hiện tại, năng lực đội, điểm nghẽn lớn nhất." },
      { buoc: "2. Chốt 3 KPI", moTa: "Chọn ba chỉ số quan trọng nhất, bỏ phần còn lại." },
      { buoc: "3. Nhịp hai tuần", moTa: "Họp 1-1, giao việc, kiểm tra số, xử lý chặn." },
      { buoc: "4. Review 30/60/90", moTa: "Đánh giá đúng mốc; điều chỉnh kế hoạch nếu cần." },
      { buoc: "5. Quyết định", moTa: "Gia hạn, nâng gói hoặc dừng — dựa trên báo cáo, không dựa trên cảm giác." },
    ],
    thoiGian: "Tối thiểu 3 tháng",
    hinhThuc: "Online 1-1 + AI Agent + đối tác chuyên môn",
    chinhSach: [
      "3,5 triệu/tháng; cam kết tối thiểu 3 tháng.",
      "35 triệu/năm — tặng 2 tháng.",
      "Pro + AI: 4,2 triệu/tháng.",
      "Huỷ sau 3 tháng; không hoàn tháng đã dùng.",
    ],
    faq: [
      { hoi: "Ai chọn 3 KPI?", dap: "Bạn và success manager cùng chọn, dựa trên số thật. OPC không áp chỉ số không đo được." },
      { hoi: "Nếu 90 ngày không đạt KPI thì sao?", dap: "Báo cáo sẽ nói rõ phần nào chưa đạt và vì sao. OPC không hứa doanh thu; cam kết là nhịp làm việc, người phụ trách và báo cáo trung thực." },
      { hoi: "Pro có thay nhân sự của tôi không?", dap: "Không. Pro là người đồng hành và hệ công cụ; việc thực thi vẫn thuộc đội của bạn." },
      { hoi: "Tôi đang dùng AI Agent, có cần mua Pro?", dap: "Pro gồm AI Agent. Nếu chỉ cần tự động hóa, AI Agent là đủ." },
    ],
    soSanh: [
      { ma: "membership", moTa: "Nếu bạn chỉ cần cộng đồng, workshop và ưu đãi." },
      { ma: "residency", moTa: "Nếu bạn cần không gian sống – làm việc dài hạn tại NOOI Forest." },
    ],
  },

  "ai-agent": {
    dinhVi:
      "Ba quy trình được cài trong 7 ngày, tiết kiệm 10–20 giờ mỗi tháng. AI Agent của OPC không phải chatbot để thử — là ba việc cụ thể được tự động, có log và có người tối ưu hằng tháng.",
    phuHop: [
      "Bạn đang làm marketing, bán hàng hoặc chăm sóc khách một mình và bị lặp việc.",
      "Bạn muốn giảm tải nhưng chưa muốn tuyển thêm người.",
      "Bạn đã có dữ liệu cơ bản (sản phẩm, giá, khách, kịch bản) để AI làm việc.",
      "Bạn muốn thử AI có kiểm soát, có giới hạn và có báo cáo.",
    ],
    khongPhuHop: [
      "Bạn cần người ra quyết định chiến lược — xem Đồng hành Pro.",
      "Bạn chưa có quy trình và dữ liệu tối thiểu — làm Chuẩn hóa trước.",
    ],
    dauRa: [
      {
        ten: "3 quy trình chạy trong 7 ngày",
        moTa: "Chọn theo ngành: nội dung, phễu bán, phản hồi khách, nhắc việc.",
      },
      {
        ten: "Bộ dữ liệu mẫu & kịch bản",
        moTa: "Prompt, giọng điệu, quy tắc trả lời và dữ liệu nền để AI không nói sai.",
      },
      {
        ten: "Log và báo cáo giờ tiết kiệm",
        moTa: "Biết AI đã làm gì, tiết kiệm bao nhiêu, chỗ nào cần sửa.",
      },
    ],
    noiDung: [
      { ten: "Cấp quyền trong 24 giờ", moTa: "Không phải chờ đợi nhiều ngày sau khi thanh toán." },
      { ten: "3 use case theo ngành", moTa: "Chọn từ thư viện use case đã chạy, không tự mò." },
      { ten: "Dữ liệu mẫu & giọng điệu", moTa: "AI trả lời đúng sản phẩm, đúng giá, đúng cách nói của bạn." },
      { ten: "Tối ưu hằng tháng", moTa: "Rà log, sửa prompt, bỏ việc không hiệu quả." },
      { ten: "Giới hạn lượt dùng rõ ràng", moTa: "Biết mình được bao nhiêu, tránh phát sinh ngoài dự kiến." },
    ],
    cachHoatDong: [
      { buoc: "1. Chọn 3 việc", moTa: "Chọn ba việc lặp gây tốn thời gian nhất." },
      { buoc: "2. Kết nối dữ liệu", moTa: "Nạp sản phẩm, giá, kịch bản và kênh đang dùng." },
      { buoc: "3. Chạy thử 7 ngày", moTa: "Dùng thật, có log, có người theo." },
      { buoc: "4. Đo giờ tiết kiệm", moTa: "So sánh trước và sau, bỏ việc không đáng tự động." },
      { buoc: "5. Tối ưu hằng tháng", moTa: "Cập nhật prompt và use case theo mùa kinh doanh." },
    ],
    thoiGian: "Cấp quyền trong 24 giờ · 3 quy trình trong 7 ngày",
    hinhThuc: "Online, dùng trên nền tảng OPC",
    chinhSach: [
      "990.000đ/tháng.",
      "9,9 triệu/năm.",
      "Dùng thử 7 ngày; hoàn tiền nếu chưa cấu hình được quy trình nào.",
    ],
    faq: [
      { hoi: "AI có thay nhân viên không?", dap: "Không. AI xử lý việc lặp; việc cần phán đoán và quan hệ vẫn do bạn." },
      { hoi: "Dữ liệu của tôi có an toàn?", dap: "Dữ liệu dùng để cấu hình và vận hành tài khoản của bạn; OPC không bán hoặc chia sẻ cho bên khác." },
      { hoi: "Tôi không biết kỹ thuật thì có dùng được?", dap: "Được. OPC cấu hình 3 quy trình ban đầu; bạn chỉ cần duyệt nội dung và theo dõi log." },
      { hoi: "Giới hạn lượt dùng là bao nhiêu?", dap: "Giới hạn theo gói và được ghi rõ khi kích hoạt, để bạn không bị phát sinh ngoài dự kiến." },
    ],
    soSanh: [
      { ma: "pro", moTa: "Khi bạn cần cả người đồng hành chiến lược, không chỉ tự động hóa." },
      { ma: "chuan-hoa", moTa: "Khi quy trình chưa chuẩn — tự động hóa cái sai sẽ nhanh hơn." },
    ],
  },

  retreat: {
    dinhVi:
      "Dừng lại 3–7 ngày để nhìn rõ 90 ngày tiếp theo. Retreat Măng Đen không phải kỳ nghỉ — là thời gian tách khỏi guồng, làm việc sâu với mentor và mang về một kế hoạch có người cùng kiểm tra.",
    phuHop: [
      "Bạn đang chạy liên tục và mất khả năng nhìn xa.",
      "Bạn cần quyết định một bước ngoặt: mở rộng, thu gọn, đổi mô hình hay dừng một việc.",
      "Bạn muốn gặp những người đang ở tầm tương tự, không phải mạng lưới danh thiếp.",
      "Bạn cần một nhịp phục hồi và một thói quen giữ được sau khi về.",
    ],
    khongPhuHop: [
      "Bạn cần ở dài 1–6 tháng — xem OPC Residency.",
      "Bạn mới bắt đầu và chưa có việc gì để nhìn lại — làm Khởi tạo trước.",
    ],
    dauRa: [
      {
        ten: "Kế hoạch 90 ngày sau retreat",
        moTa: "Viết tại chỗ, có mốc và việc tuần đầu sau khi về.",
      },
      {
        ten: "Ba kết nối chất lượng",
        moTa: "Người có thể hỏi tiếp, không phải danh thiếp.",
      },
      {
        ten: "Một thói quen phục hồi",
        moTa: "Thiết kế theo lịch thật của bạn, không phải lời khuyên chung.",
      },
    ],
    noiDung: [
      { ten: "Pre-work 2 tuần", moTa: "Bài tập và dữ liệu gửi trước để đến nơi là làm việc được ngay." },
      { ten: "3–7 ngày tại Măng Đen", moTa: "Tách khỏi guồng, có thời gian làm việc sâu và nghỉ thật." },
      { ten: "Mentor chuyên sâu", moTa: "Phiên làm việc 1-1 và nhóm theo đúng quyết định của bạn." },
      { ten: "Thiền, vận động, nhịp sinh hoạt", moTa: "Phục hồi thể chất để quyết định không dựa trên kiệt sức." },
      { ten: "Mastermind", moTa: "Chia sẻ và phản biện giữa những người cùng tầm." },
      { ten: "Follow-up 30 ngày", moTa: "Một buổi kiểm tra sau khi về để kế hoạch không bị bỏ." },
    ],
    cachHoatDong: [
      { buoc: "1. Đăng ký & xác nhận lịch", moTa: "Chọn đợt phù hợp; OPC xác nhận công suất trước khi thu cọc." },
      { buoc: "2. Pre-work", moTa: "Gửi hiện trạng, quyết định cần chốt và dữ liệu liên quan." },
      { buoc: "3. Retreat", moTa: "Làm việc sâu, nghỉ, kết nối trong 3–7 ngày." },
      { buoc: "4. Chốt kế hoạch 90 ngày", moTa: "Ra về với kế hoạch viết tay, không phải cảm hứng." },
      { buoc: "5. Follow-up", moTa: "Kiểm tra sau 30 ngày, điều chỉnh nếu lệch." },
    ],
    thoiGian: "3–7 ngày + pre-work 2 tuần + follow-up 30 ngày",
    hinhThuc: "Offline tại NOOI Forest, Măng Đen",
    chinhSach: [
      "Gói chuẩn 25 triệu/khách.",
      "Đoàn 5 người trở lên giảm 10%.",
      "Cọc 50%; huỷ trước 15 ngày mất cọc; OPC huỷ thì hoàn tiền.",
      "Lịch trình và chính sách huỷ được gửi trước khi thanh toán.",
    ],
    faq: [
      { hoi: "Có cần kinh nghiệm gì không?", dap: "Không. Cần một quyết định thật và sự sẵn lòng nhìn lại." },
      { hoi: "Đi một mình hay theo đội?", dap: "Cả hai. Đoàn 5+ có ưu đãi; đi một mình vẫn có nhóm và mentor." },
      { hoi: "Thời tiết Măng Đen thế nào?", dap: "Mát quanh năm, có mưa theo mùa. Lịch trình có phương án trong nhà." },
      { hoi: "Tôi cần chuẩn bị gì?", dap: "Máy tính, dữ liệu về việc đang làm và 2 tuần pre-work theo hướng dẫn." },
    ],
    soSanh: [
      { ma: "residency", moTa: "Khi bạn cần ở dài 1–6 tháng để làm việc, không chỉ 3–7 ngày." },
      { ma: "pro", moTa: "Khi bạn cần nhịp đồng hành 90 ngày ngay tại nơi đang sống." },
    ],
  },

  launch: {
    dinhVi:
      "Từ ý tưởng đến doanh nghiệp chạy được trong 30 ngày — có người làm cùng, không tự mò. Launch là gói done-for-you: pháp lý, thuế, ngân hàng, hóa đơn, chữ ký số, website và ba quy trình AI.",
    phuHop: [
      "Bạn là hộ kinh doanh hoặc freelancer có doanh thu, muốn hợp pháp hóa và chạy ngay.",
      "Bạn cần hóa đơn, tài khoản ngân hàng, chữ ký số để làm việc với doanh nghiệp.",
      "Bạn không muốn tự đọc thông tư, tự xếp hồ sơ và tự sửa sai.",
      "Bạn cần website/landing và quy trình AI cơ bản ngay từ ngày đầu.",
    ],
    khongPhuHop: [
      "Bạn chỉ cần học cách làm — xem Chuẩn hóa.",
      "Bạn đã có pháp nhân và hệ thống vận hành — xem Pro hoặc AI Agent.",
    ],
    dauRa: [
      {
        ten: "Pháp lý và tài chính cơ bản",
        moTa: "Pháp nhân/hộ kinh doanh, mã số thuế, tài khoản ngân hàng, hóa đơn điện tử, chữ ký số.",
      },
      {
        ten: "Bộ công cụ bán hàng",
        moTa: "Website/landing, bộ báo giá, hợp đồng mẫu và quy trình giao hàng.",
      },
      {
        ten: "Ba quy trình AI",
        moTa: "Chạy được ngay: nội dung, phản hồi khách, nhắc việc.",
      },
    ],
    noiDung: [
      { ten: "8 mốc trong 30 ngày", moTa: "Mỗi mốc có người phụ trách, việc cần bạn ký và dấu hiệu hoàn tất." },
      { ten: "Một success manager", moTa: "Đầu mối duy nhất, không phải tự tìm từng bộ phận." },
      { ten: "Đối tác pháp lý – kế toán", moTa: "Đơn vị đã kiểm tra, làm đúng hồ sơ và nghĩa vụ thuế." },
      { ten: "Kiểm tra hoàn tất", moTa: "Rà lại từng mốc trước khi bàn giao, không giao nửa vời." },
    ],
    cachHoatDong: [
      { buoc: "1. Khảo sát 30 phút", moTa: "Xác định loại hình, ngành, doanh thu và việc cần làm ngay." },
      { buoc: "2. Lộ trình 8 mốc", moTa: "Bạn thấy rõ việc nào làm trước, việc nào song song." },
      { buoc: "3. Thực thi", moTa: "OPC và đối tác làm; bạn ký và cung cấp giấy tờ theo danh sách." },
      { buoc: "4. Kiểm tra hoàn tất", moTa: "Đối chiếu hồ sơ, tài khoản, hóa đơn, chữ ký số, website." },
      { buoc: "5. Bàn giao", moTa: "Bạn nhận bộ hồ sơ và hướng dẫn duy trì hằng tháng." },
    ],
    thoiGian: "30 ngày kể từ khi đủ giấy tờ",
    hinhThuc: "Online + đối tác pháp lý/kế toán tại địa phương",
    chinhSach: [
      "9,8 triệu/lần — gói cơ bản.",
      "14,8 triệu — có website và AI nâng cao.",
      "Không hứa \"thành lập trong 3 ngày\"; thời gian phụ thuộc cơ quan nhà nước.",
      "Phí nhà nước và lệ phí đóng theo thực tế, tách khỏi phí dịch vụ.",
    ],
    faq: [
      { hoi: "Có cần gặp trực tiếp không?", dap: "Phần lớn online; một số bước cần ký hoặc xác nhận theo quy định địa phương." },
      { hoi: "Vì sao không cam kết đúng 30 ngày?", dap: "Vì thời gian cấp phép thuộc cơ quan nhà nước. OPC cam kết giữ đúng 8 mốc phần việc của mình." },
      { hoi: "Có bao gồm phí thành lập của nhà nước?", dap: "Không. Phí nhà nước đóng theo thực tế và được báo trước." },
      { hoi: "Sau 30 ngày có được hỗ trợ tiếp?", dap: "Có hướng dẫn duy trì; nếu cần đồng hành tiếp, chọn Membership hoặc Pro." },
    ],
    soSanh: [
      { ma: "chuan-hoa", moTa: "Khi bạn muốn tự làm và chỉ cần quy trình, không cần làm hộ." },
      { ma: "pro", moTa: "Khi doanh nghiệp đã chạy và bạn cần tăng trưởng 90 ngày." },
    ],
  },

  residency: {
    dinhVi:
      "Sống và làm việc 1–6 tháng tại NOOI Forest — nơi yên tĩnh để làm việc sâu, có desk, có cộng đồng và một nhịp sống không bị thành phố định đoạt.",
    phuHop: [
      "Bạn là remote worker, KOL, solopreneur cần không gian sống – làm việc dài hạn.",
      "Bạn muốn tách khỏi ồn ào để hoàn thành một dự án lớn.",
      "Bạn cần cộng đồng nhỏ, có mastermind và wellness đều đặn.",
      "Bạn muốn thử sống ở Măng Đen trước khi quyết định lâu dài.",
    ],
    khongPhuHop: [
      "Bạn chỉ có 3–7 ngày — xem Retreat Măng Đen.",
      "Bạn cần đồng hành kinh doanh chuyên sâu — xem Đồng hành Pro.",
    ],
    dauRa: [
      {
        ten: "Chỗ ở và bàn làm việc",
        moTa: "Phòng riêng, desk, internet, điện nước — dùng được ngay.",
      },
      {
        ten: "Nhịp cộng đồng",
        moTa: "1 mastermind mỗi tuần và 1 buổi wellness mỗi tuần.",
      },
      {
        ten: "Ưu đãi Pro",
        moTa: "Giá ưu đãi nếu bạn muốn dùng gói đồng hành trong thời gian lưu trú.",
      },
    ],
    noiDung: [
      { ten: "Lưu trú tối thiểu 3 tháng", moTa: "Đủ dài để làm việc thật, không phải chuyến thử." },
      { ten: "Phòng riêng + desk", moTa: "Không gian làm việc riêng, có internet và điện nước." },
      { ten: "Mastermind 1 buổi/tuần", moTa: "Nhóm nhỏ, có người điều phối." },
      { ten: "Wellness 1 buổi/tuần", moTa: "Vận động, thiền hoặc phục hồi theo lịch." },
      { ten: "Check-in / check-out rõ ràng", moTa: "Ngày nhận phòng, ngày trả, chính sách gia hạn." },
    ],
    cachHoatDong: [
      { buoc: "1. Chọn phòng & thời gian", moTa: "Xem công suất, chọn hạng phòng và số tháng." },
      { buoc: "2. Xác nhận", moTa: "OPC xác nhận phòng, desk và ngày nhận phòng trước khi thanh toán." },
      { buoc: "3. Nhận phòng", moTa: "Check-in, nhận desk, vào nhóm cộng đồng." },
      { buoc: "4. Sinh hoạt", moTa: "Làm việc, mastermind, wellness, kết nối trong Forest." },
      { buoc: "5. Gia hạn", moTa: "Quyết định ở tiếp dựa trên công suất và trải nghiệm thật." },
    ],
    thoiGian: "1–6 tháng, tối thiểu 3 tháng",
    hinhThuc: "Offline tại NOOI Forest, Măng Đen",
    chinhSach: [
      "Gói chuẩn 7 triệu/tháng.",
      "Dorm, cabin và suite báo giá theo công suất và thời gian lưu trú.",
      "Ở 3–6 tháng có ưu đãi theo chính sách tại thời điểm đặt.",
      "Xác nhận phòng và chính sách huỷ trước khi thanh toán.",
    ],
    faq: [
      { hoi: "Internet có đủ để làm việc không?", dap: "Có internet cho desk và phòng ở; OPC nêu rõ phương án dự phòng khi thời tiết xấu." },
      { hoi: "Có bếp và chỗ ăn không?", dap: "Có khu sinh hoạt chung; phương án ăn uống được thông báo khi xác nhận." },
      { hoi: "Có nhận gia đình hoặc đội nhóm?", dap: "Tùy hạng phòng và công suất — OPC xác nhận trước khi đặt." },
      { hoi: "Đi từ sân bay thế nào?", dap: "OPC gửi hướng dẫn di chuyển và hỗ trợ đặt xe khi bạn xác nhận lịch." },
    ],
    soSanh: [
      { ma: "retreat", moTa: "Khi bạn chỉ có 3–7 ngày để dừng lại và chốt kế hoạch." },
      { ma: "pro", moTa: "Khi bạn cần người theo sát kinh doanh, không chỉ không gian." },
    ],
  },

  partner: {
    dinhVi:
      "Mang quyền lợi OPC đến hội viên của tổ chức bạn — có cohort, có dashboard, có báo cáo quý. Partner không phải chương trình giới thiệu lấy link; là một chương trình co-branded có người quản lý.",
    phuHop: [
      "Bạn là hội doanh nhân, hiệp hội, ngân hàng, trường đại học hoặc coworking.",
      "Bạn cần quyền lợi thực chất cho hội viên, không chỉ voucher.",
      "Bạn muốn đo được bao nhiêu hội viên tham gia và tiến bộ.",
      "Bạn cần một chương trình có báo cáo để giải trình với ban lãnh đạo.",
    ],
    khongPhuHop: [
      "Bạn chỉ cần đào tạo nội bộ một lần — OPC thiết kế riêng, không dùng gói này.",
      "Bạn chưa xác định được nhóm hội viên mục tiêu.",
    ],
    dauRa: [
      {
        ten: "Cohort co-branded 6 tuần",
        moTa: "Chương trình mang tên hai bên, có lịch và tiêu chí hoàn thành.",
      },
      {
        ten: "Chẩn đoán hội viên",
        moTa: "Mỗi hội viên nhận bản chẩn đoán và lộ trình riêng.",
      },
      {
        ten: "Dashboard và báo cáo quý",
        moTa: "Số tham gia, tiến độ, chuyển đổi và khuyến nghị cho quý sau.",
      },
    ],
    noiDung: [
      { ten: "1 buổi định hướng", moTa: "Thống nhất mục tiêu, nhóm hội viên và cách đo." },
      { ten: "1 cohort 6 tuần", moTa: "Nội dung theo ngành của tổ chức, có người dẫn." },
      { ten: "Ưu đãi thành viên", moTa: "Giá ưu đãi cho hội viên khi dùng sản phẩm OPC." },
      { ten: "Quản lý riêng", moTa: "Một đầu mối phụ trách chương trình của bạn." },
      { ten: "Báo cáo quý", moTa: "Số liệu và khuyến nghị, không phải báo cáo hình thức." },
    ],
    cachHoatDong: [
      { buoc: "1. Khảo sát tổ chức", moTa: "Xác định nhóm hội viên, mục tiêu và ngân sách." },
      { buoc: "2. Thiết kế cohort", moTa: "Chọn nội dung, lịch và tiêu chí hoàn thành." },
      { buoc: "3. Truyền thông & mở đăng ký", moTa: "OPC cung cấp tài liệu co-branded." },
      { buoc: "4. Chạy 6 tuần", moTa: "Có người dẫn, có chẩn đoán và theo dõi tiến độ." },
      { buoc: "5. Báo cáo & gia hạn", moTa: "Báo cáo quý, quyết định mở rộng hoặc dừng." },
    ],
    thoiGian: "12 tháng, triển khai cohort đầu trong 30–45 ngày",
    hinhThuc: "Online + buổi offline theo khu vực",
    chinhSach: [
      "30 triệu/năm — gói cơ bản.",
      "Gói mở rộng thiết kế riêng theo quy mô hội viên.",
      "Chia sẻ doanh thu theo thoả thuận.",
      "Tiêu chuẩn đối tác và huấn luyện trước khi co-brand.",
    ],
    faq: [
      { hoi: "Bao lâu thì triển khai được?", dap: "Cohort đầu thường trong 30–45 ngày kể từ khi thống nhất mục tiêu." },
      { hoi: "Có cần đội nội bộ của tôi không?", dap: "Cần một đầu mối phối hợp; OPC lo nội dung và vận hành cohort." },
      { hoi: "Dữ liệu hội viên xử lý thế nào?", dap: "Chỉ dùng cho chương trình, có thoả thuận và báo cáo tổng hợp, không bán dữ liệu." },
      { hoi: "Báo cáo gồm những gì?", dap: "Số tham gia, tỷ lệ hoàn thành, chẩn đoán, chuyển đổi sang gói trả phí và khuyến nghị." },
    ],
    soSanh: [
      { ma: "certified", moTa: "Khi bạn cần chứng nhận năng lực cho từng cá nhân thay vì cả chương trình." },
      { ma: "pro", moTa: "Khi hội viên của bạn cần đồng hành 1-1 sau cohort." },
    ],
  },

  certified: {
    dinhVi:
      "Bằng chứng năng lực — không phải bằng mua. OPC Certified đánh giá trên portfolio, phỏng vấn và bài thực hành, để khách và đối tác của bạn có căn cứ tin bạn làm được.",
    phuHop: [
      "Bạn đã có kết quả thật và cần bằng chứng khi làm với khách/đối tác.",
      "Bạn muốn một tiêu chuẩn rõ ràng thay vì tự nhận \"chuyên gia\".",
      "Bạn cần badge/hồ sơ năng lực để đưa vào hồ sơ thầu, website, hợp đồng.",
      "Bạn muốn biết mình còn thiếu năng lực nào để bổ sung.",
    ],
    khongPhuHop: [
      "Bạn chưa có kết quả thực tế để chứng minh — hãy làm trước.",
      "Bạn tìm một chứng chỉ mua bằng tiền mà không cần đánh giá.",
    ],
    dauRa: [
      {
        ten: "Chứng nhận OPC Certified",
        moTa: "Kèm badge và hồ sơ năng lực dùng được với khách, đối tác.",
      },
      {
        ten: "Báo cáo năng lực",
        moTa: "Điểm mạnh, khoảng trống và việc cần bổ sung.",
      },
      {
        ten: "Hạn dùng rõ ràng",
        moTa: "Gia hạn hằng năm để chứng nhận còn đúng với năng lực hiện tại.",
      },
    ],
    noiDung: [
      { ten: "Đánh giá năng lực 2 giờ", moTa: "Bài thực hành trên tình huống thật." },
      { ten: "Portfolio", moTa: "Hồ sơ kết quả đã làm, có bằng chứng." },
      { ten: "Phỏng vấn 30 phút", moTa: "Trao đổi trực tiếp với người chấm độc lập." },
      { ten: "Badge OPC Certified", moTa: "Dùng trên website, hồ sơ thầu, tài liệu bán hàng." },
    ],
    cachHoatDong: [
      { buoc: "1. Nộp hồ sơ", moTa: "Portfolio và thông tin năng lực cần đánh giá." },
      { buoc: "2. Bài đánh giá", moTa: "Làm bài thực hành 2 giờ theo tình huống." },
      { buoc: "3. Phỏng vấn", moTa: "30 phút với người chấm độc lập." },
      { buoc: "4. Kết quả", moTa: "Chứng nhận, báo cáo năng lực hoặc hướng bổ sung." },
      { buoc: "5. Gia hạn", moTa: "Gia hạn hằng năm để duy trì hiệu lực." },
    ],
    thoiGian: "Đánh giá trong 1 ngày làm việc, kết quả trong 7 ngày",
    hinhThuc: "Online, có người chấm độc lập",
    chinhSach: [
      "1,5 triệu/lần.",
      "Gia hạn 500.000đ/năm.",
      "Tiêu chí công bố trước; không đạt thì báo rõ phần cần bổ sung.",
    ],
    faq: [
      { hoi: "Ai chấm?", dap: "Người chấm độc lập theo tiêu chí công bố, không phải đội bán hàng." },
      { hoi: "Có rớt không?", dap: "Có. Nếu chưa đạt, bạn nhận báo cáo khoảng trống và có thể đánh giá lại." },
      { hoi: "Badge dùng ở đâu?", dap: "Website, hồ sơ năng lực, hồ sơ thầu và tài liệu gửi khách." },
      { hoi: "Chứng nhận có hết hạn?", dap: "Có. Gia hạn hằng năm để phản ánh năng lực hiện tại." },
    ],
    soSanh: [
      { ma: "chuan-hoa", moTa: "Khi bạn cần năng lực trước, chứng nhận sau." },
      { ma: "partner", moTa: "Khi bạn cần chứng nhận cho cả một chương trình/tổ chức." },
    ],
  },
};

export function chiTietCuaGoi(ma: string): ChiTietGoi | null {
  return CHI_TIET_GOI[ma] ?? null;
}
