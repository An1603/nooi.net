/**
 * KHO TRI THỨC — nội dung bài viết.
 *
 * Vì sao để trong mã nguồn thay vì bảng cơ sở dữ liệu (giai đoạn 1): kho tri thức cần
 * *chất lượng biên tập*, không cần tốc độ đăng. Sáu bài trụ dưới đây là bản viết tay, có
 * người chịu trách nhiệm nội dung. Khi nào cần đăng 2–3 bài/tuần thì mới chuyển sang bảng
 * `knowledge_articles` và giữ nguyên giao diện — dữ liệu đổi, khuôn không đổi.
 *
 * LUẬT TRÍCH ĐOẠN: `moDau` luôn hiện cho mọi người (phần “free”), `than` chỉ hiện khi đã
 * đăng nhập. Không đặt toàn bộ nội dung vào `moDau` — như vậy là bỏ luôn cửa đăng nhập.
 */
export type BaiViet = {
  slug: string;
  tieuDe: string;
  moTa: string;
  chuDe: "Nền tảng" | "Thực hành" | "Kiến thức";
  phut: number;
  capNhat: string;
  /** phần mở — công khai, 2 đoạn */
  moDau: string[];
  /** phần thân — dành cho thành viên đã đăng nhập */
  than: string[];
  /** gợi ý đọc kèm, dùng slug bài khác */
  lienQuan?: string[];
};

export const BAI_VIET: BaiViet[] = [
  {
    slug: "bon-buoc-chuyen-hoa",
    tieuDe: "Bốn bước chuyển hóa: THẤY – HIỂU – SỐNG – LAN TỎA",
    moTa: "Khung nền của toàn bộ hệ sinh thái NOOI — từ quan sát trung thực đến phụng sự không cần khoe khoang.",
    chuDe: "Nền tảng",
    phut: 7,
    capNhat: "2026-11-20",
    moDau: [
      "Phần lớn người tìm đến thiền, khí công hay trị liệu đều bắt đầu bằng một câu hỏi rất cụ thể: làm sao để bớt căng thẳng. Nhưng thứ giữ họ lại lâu hơn là một câu hỏi khác — vì sao tôi lại lặp lại đúng kiểu căng thẳng ấy. Bốn bước dưới đây là con đường trả lời câu thứ hai.",
      "Bước một: THẤY. Chưa cần sửa gì cả, chỉ cần nhìn rõ điều đang diễn ra — trong thân, trong cảm xúc, trong cách mình phản ứng. Nghe thì đơn giản nhưng đây là bước khó nhất, vì tâm trí có xu hướng biện minh nhanh hơn nhận biết. Một người thật sự thấy mình đang ghen, đang sợ, đang muốn kiểm soát — đã khác rất nhiều so với người chỉ nói về mình bằng những từ đẹp.",
    ],
    than: [
      "Bước hai: HIỂU. Thấy mà không hiểu thì dễ rơi vào tự trách. Hiểu ở đây là nhận ra cơ chế: cảm giác này sinh ra từ nhu cầu nào, nhu cầu ấy hình thành từ khi nào, và nó được nuôi dưỡng mỗi ngày bằng những thói quen nào. NOOI gọi đây là chuyển tri thức thành trí tuệ — không phải biết thêm một khái niệm, mà là thôi bị khái niệm dẫn dắt.",
      "Bước ba: SỐNG. Không có bước này, hai bước đầu chỉ là sự sáng suốt trên giấy. Sống là biến hiểu biết thành kỷ luật nhỏ, lặp lại được trong ngày thường: mười lăm phút ngồi yên buổi sáng, ba dòng nhật ký buổi tối, một lần dừng lại trước khi trả lời tin nhắn khiến mình bực. Giá trị nằm ở tính đều đặn, không nằm ở cường độ.",
      "Bước bốn: LAN TỎA. Khi bên trong đã bớt chao đảo, người xung quanh tự nhiên thấy dễ chịu hơn khi ở cạnh bạn. Lan tỏa không phải là đi thuyết phục người khác thiền. Nó là hệ quả của ba bước trước — và là phép thử trung thực nhất: nếu người thân thấy bạn dễ chịu hơn, bước ba đang chạy đúng.",
      "Điều đáng lưu ý: bốn bước không phải đường thẳng. Người thực hành lâu năm vẫn quay lại bước THẤY mỗi khi có biến cố. Cái tiến bộ không phải là “đi hết bốn bước”, mà là vòng quay ấy ngày càng ngắn lại.",
    ],
    lienQuan: ["bay-tang-chuyen-hoa", "thien-muoi-lam-phut"],
  },
  {
    slug: "bay-tang-chuyen-hoa",
    tieuDe: "Bảy tầng chuyển hóa — bản đồ để không lạc đường",
    moTa: "Từ ngủ mê đến giải thoát: cách NOOI mô tả các mức độ tỉnh thức như một bản đồ, không phải một bảng xếp hạng.",
    chuDe: "Nền tảng",
    phut: 9,
    capNhat: "2026-11-20",
    moDau: [
      "Mọi hành trình dài đều cần bản đồ, không phải để khoe đã đi được bao xa, mà để biết mình đang ở đâu khi mất phương hướng. Bảy tầng là bản đồ như vậy: một cách mô tả các mức độ tỉnh thức, tổng hợp từ triết học Phật giáo, Lão giáo và tâm lý học hiện đại.",
      "Tầng một là Ngủ mê: sống bằng phản xạ, bị dẫn dắt bởi bản năng mà không hay biết. Đây không phải lời chê — phần lớn nhân loại vận hành ở tầng này phần lớn thời gian, kể cả người thông minh và thành đạt. Điều đáng nói là không ai tự biết mình đang ở đó.",
    ],
    than: [
      "Tầng hai là Thức tỉnh: bắt đầu nghi ngờ, nhận ra mình đang lặp lại một khuôn mẫu. Tầng ba là Tìm đường: chủ động đọc, thiền, trị liệu — và đây là tầng dễ lạc nhất, vì kiến thức nhiều lên trong khi thực hành chưa tương xứng. Người ở tầng ba thường nói rất hay về chuyển hóa.",
      "Tầng bốn là Làm chủ: nhận trách nhiệm 100% cho đời mình, thấy rõ và tháo gỡ khuôn mẫu vô thức. Tầng năm là Dòng chảy: sống từ bên trong ra, nghĩ–nói–làm đồng nhất, không gồng mà vẫn mạnh. Tầng sáu là Hòa nhập: ranh giới “tôi” mỏng đi, từ bi tự chảy, phụng sự như tay phải giúp tay trái.",
      "Tầng bảy là Giải thoát: vượt khỏi mọi khái niệm đối đãi. Vài người mỗi thế hệ. Cần nói rõ: bản đồ này KHÔNG dùng để chấm điểm ai, cũng không ai tự xếp mình lên tầng cao. Cách dùng đúng là hỏi: hôm nay mình đang phản ứng từ tầng nào, và có thể lùi lại một bước để nhìn không.",
      "Trong ứng dụng NOOI, bảy tầng gắn với các bài thực hành cụ thể ở từng mức — để bản đồ không dừng ở việc đọc cho hay.",
    ],
    lienQuan: ["bon-buoc-chuyen-hoa", "doc-vi-than-tam"],
  },
  {
    slug: "thien-muoi-lam-phut",
    tieuDe: "Mười lăm phút thiền — bản hướng dẫn không huyền bí",
    moTa: "Một buổi thiền tối thiểu, đủ để duy trì 30 ngày, kèm ba lỗi phổ biến khiến người mới bỏ cuộc.",
    chuDe: "Thực hành",
    phut: 6,
    capNhat: "2026-11-22",
    moDau: [
      "Thiền không cần đệm, không cần nhạc, không cần một căn phòng yên tĩnh hoàn hảo. Cần một chiếc ghế, mười lăm phút và một quyết định không đứng dậy giữa chừng. Càng đơn giản thì càng dễ duy trì — và duy trì mới là thứ tạo ra thay đổi.",
      "Cách làm: ngồi thẳng lưng, hai chân đặt phẳng, tay để trên đùi, mắt nhắm hoặc mở hờ nhìn xuống. Đưa sự chú ý về hơi thở — không điều khiển hơi thở, chỉ biết mình đang thở vào, đang thở ra. Khi tâm trí chạy đi (chắc chắn sẽ chạy), nhận ra và quay về. Mỗi lần quay về là một lần tập, không phải một lần thất bại.",
    ],
    than: [
      "Ba lỗi làm người mới bỏ cuộc. Một là cố làm cho tâm trí trống — không ai làm được, và cố chỉ tạo thêm căng. Hai là đánh giá buổi ngồi: “hôm nay tệ quá, toàn nghĩ linh tinh”. Thực ra buổi ngồi có ích đúng ở chỗ bạn nhận ra mình đang nghĩ linh tinh. Ba là tăng thời lượng quá nhanh: từ mười lăm phút nhảy lên bốn mươi lăm phút trong tuần hai, rồi bỏ hẳn tuần ba.",
      "Gợi ý duy trì 30 ngày: cố định một khung giờ (sáng, trước khi mở điện thoại), đánh dấu mỗi ngày hoàn thành, và cho phép phiên bản tối thiểu 5 phút vào hôm bận. Chuỗi ngày liên tục quan trọng hơn tổng số phút.",
      "Sau hai tuần, thêm một bước nhỏ: sau khi ngồi xong, ghi ba dòng — hôm nay thân thế nào, tâm thế nào, có gì đáng nhớ. Ba dòng ấy là cầu nối giữa thiền và đời sống, và cũng là dữ liệu để bạn tự thấy mình đang thay đổi ở đâu.",
    ],
    lienQuan: ["bon-buoc-chuyen-hoa"],
  },
  {
    slug: "khi-cong-duong-sinh",
    tieuDe: "Khí công dưỡng sinh: thở, đứng, và sự chậm có chủ đích",
    moTa: "Ba bài tập nền cho người ngồi nhiều, kèm nguyên tắc an toàn để không tự làm mình đau.",
    chuDe: "Thực hành",
    phut: 6,
    capNhat: "2026-11-22",
    moDau: [
      "Khí công không phải môn thể dục mạnh hơn yoga, cũng không phải phép thuật. Đó là hệ thống bài tập phối hợp hơi thở, tư thế và sự chú ý, nhằm làm chậm lại và làm mềm những chỗ đang co. Với người ngồi nhiều, giá trị lớn nhất nằm ở chỗ nó đánh thức những vùng cơ thể đã “tắt” mà ta không còn biết là nó đã tắt.",
      "Bài một — thở bụng: nằm hoặc ngồi, một tay đặt trên bụng. Hít vào để bụng nâng lên, thở ra để bụng hạ xuống, chậm hơn nhịp tự nhiên. Mười hơi. Bài hai — đứng buông: đứng chân rộng bằng vai, gối hơi mềm, rũ vai, để tay rơi tự do, quét sự chú ý từ đỉnh đầu xuống bàn chân trong ba lượt.",
    ],
    than: [
      "Bài ba — xoay mở: xoay nhẹ cổ tay, vai, hông theo vòng tròn nhỏ, chậm, không gắng biên độ. Mục tiêu là “thấy lại” khớp chứ không phải kéo căng. Cả ba bài mất khoảng mười phút, làm được ngay tại bàn làm việc, không cần thay đồ.",
      "Nguyên tắc an toàn, đọc kỹ: không nín thở để cố giữ tư thế; không tập khi vừa ăn no; đau nhói, chóng mặt, tê tay thì dừng ngay và trở về hơi thở bình thường. Khí công là thực hành tích lũy — không có buổi nào cần cố.",
      "Người có bệnh nền tim mạch, huyết áp, hoặc đang hậu phẫu nên hỏi bác sĩ trước khi tập thở sâu và giữ hơi lâu. Đây là ranh giới giữa tự chăm sóc và tự làm hại mình.",
    ],
    lienQuan: ["dinh-duong-hoc-chuc-nang", "thien-muoi-lam-phut"],
  },
  {
    slug: "dinh-duong-hoc-chuc-nang",
    tieuDe: "Dinh dưỡng học chức năng: ăn để tâm ổn định",
    moTa: "Mối liên hệ giữa đường huyết, giấc ngủ và cảm xúc — bắt đầu từ bữa sáng, không phải từ thực phẩm bổ sung.",
    chuDe: "Kiến thức",
    phut: 7,
    capNhat: "2026-11-24",
    moDau: [
      "Khi nói “ăn uống ảnh hưởng đến cảm xúc”, nhiều người nghĩ ngay đến những thứ phải mua thêm. Thực tế, yếu tố ảnh hưởng mạnh nhất thường là thứ đơn giản nhất: đường huyết có ổn định trong ngày hay không. Đường huyết lên vọt rồi tụt sâu tạo ra đúng cái cảm giác mà ta hay gọi là “hôm nay tâm trạng tệ”.",
      "Bữa sáng nhiều tinh bột nhanh (bánh mì trắng, nước ngọt, cháo đường) cho cảm giác tỉnh táo ngắn rồi buồn ngủ và thèm ngọt giữa buổi. Đổi sang bữa sáng có đạm và chất béo tốt — trứng, sữa chua không đường, hạt — thường làm giảm hẳn số lần “thèm vặt” mà không cần ý chí.",
    ],
    than: [
      "Ba nguyên tắc dễ làm hơn ăn kiêng: (1) mỗi bữa có một nguồn đạm rõ ràng; (2) rau chiếm khoảng một nửa đĩa, ăn trước phần tinh bột; (3) không uống đồ ngọt khi bụng đói. Ba điều này đủ để đường huyết bớt dao động mà không phải đếm calo.",
      "Về giấc ngủ: thiếu ngủ làm tăng cảm giác đói và giảm khả năng tự kiềm chế. Vì vậy mọi lời khuyên dinh dưỡng đều vô hiệu nếu ngủ dưới sáu tiếng. Với người ngủ kém, sửa giấc ngủ trước, sửa đĩa ăn sau.",
      "Về thực phẩm bổ sung: chỉ nên dùng khi có xét nghiệm hoặc chỉ định. Uống vitamin theo trào lưu không giúp tâm ổn định, và có thể tốn kém vô ích. Đây là quan điểm của NOOI: đơn giản, có căn cứ, không bán nỗi sợ.",
      "Một lưu ý cuối: đừng biến việc ăn thành kỷ luật đạo đức. Một bữa tiệc với gia đình có giá trị tinh thần lớn hơn việc giữ đúng tỉ lệ đĩa ăn. Sức khỏe là phương tiện để sống, không phải mục tiêu để canh chừng.",
    ],
    lienQuan: ["khi-cong-duong-sinh"],
  },
  {
    slug: "doc-vi-than-tam",
    tieuDe: "Đọc vị thân tâm: ba câu hỏi trước khi phản ứng",
    moTa: "Một công cụ tâm lý học ứng dụng để chen vào khoảng giữa cảm xúc và hành động.",
    chuDe: "Kiến thức",
    phut: 5,
    capNhat: "2026-11-24",
    moDau: [
      "Giữa một cảm xúc và hành động của bạn có một khoảng rất ngắn — thường dưới hai giây. Toàn bộ việc thực hành tâm lý học ứng dụng nằm ở chỗ làm khoảng ấy rộng ra. Không phải để kìm nén, mà để có lựa chọn.",
      "Ba câu hỏi, hỏi thật nhanh trong đầu: (1) Trong thân, tôi đang cảm thấy gì — nóng mặt, nặng ngực, hàm siết? (2) Cảm xúc này tên là gì — tức, sợ, xấu hổ, hay chỉ là mệt? (3) Nó đang đòi tôi làm gì ngay lúc này? Chỉ cần trả lời được ba câu, phản ứng thường mất đi khoảng một nửa cường độ.",
    ],
    than: [
      "Vì sao phải bắt đầu từ thân: phần lớn người ta nhận ra mình đang tức khi đã nói xong câu làm tổn thương người khác. Cảm giác trong thân đến trước cảm xúc được gọi tên. Bắt tín hiệu sớm hơn nửa giây là thắng cả một cuộc tranh cãi.",
      "Điều quan trọng thứ hai: phân biệt “mệt” với “giận”. Rất nhiều trận cãi trong gia đình thực chất là một người đang kiệt sức. Câu hỏi số hai có tác dụng chẩn đoán — trả lời sai thì giải pháp sai: nghỉ ngơi sẽ chữa được cái mà tranh luận không chữa được.",
      "Sau khi trả lời ba câu, hãy chọn một hành động nhỏ nhất có thể: uống một cốc nước, đi bộ ba phút, hoặc nói “để tôi nghĩ một chút rồi mình nói tiếp”. Câu hoãn ấy không phải né tránh, mà là cách giữ cho cuộc nói chuyện còn đường quay lại.",
      "Ghi lại kết quả trong nhật ký vài lần mỗi tuần. Sau hai tuần, bạn sẽ thấy mẫu hình: cùng một loại tình huống, cùng một phản ứng. Thấy được mẫu hình là lúc bước THẤY của NOOI bắt đầu có dữ liệu thật.",
    ],
    lienQuan: ["bon-buoc-chuyen-hoa", "bay-tang-chuyen-hoa"],
  },
];

export function timBaiViet(slug: string): BaiViet | undefined {
  return BAI_VIET.find((b) => b.slug === slug);
}

export const CHU_DE = ["Nền tảng", "Thực hành", "Kiến thức"] as const;
