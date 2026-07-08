/**
 * G2 — Tình Huống Thực Tế
 * 7 trục × 3 scenario = 21 tình huống
 * Mỗi scenario: câu chuyện thực tế → 4 lựa chọn → điểm 1-4
 */

export interface Scenario {
  id: number;          // 0-20
  axis: string;         // key của trục
  story: string;        // câu chuyện tình huống
  context: string;      // bối cảnh ngắn
  options: ScenarioOption[];
}

export interface ScenarioOption {
  text: string;
  score: number;       // 1-4 (1=kém, 4=tốt)
  feedback: string;    // giải thích ngắn sau khi chọn
}

export const SCENARIOS: Scenario[] = [
  // ============================================================
  // TRỤC 1: THẤY — Quan sát bản thân
  // ============================================================
  {
    id: 0, axis: "thay",
    story: "Bạn đang trình bày ý tưởng trong cuộc họp nhóm. Một đồng nghiệp cắt ngang và chỉ trích ý tưởng của bạn một cách gay gắt trước mặt mọi người. Bạn cảm thấy mặt nóng lên và tim đập nhanh.",
    context: "Bối cảnh: Cuộc họp quan trọng, có sếp tham dự",
    options: [
      { text: "Phản bác ngay lập tức, bảo vệ ý tưởng", score: 1, feedback: "Bạn đang phản ứng theo quán tính — chưa kịp quan sát cảm xúc của mình" },
      { text: "Im lặng nhưng trong lòng rất khó chịu, mất tập trung suốt buổi họp", score: 2, feedback: "Bạn nhận ra cảm xúc nhưng bị nó cuốn đi thay vì quan sát" },
      { text: "Hít thở vài giây, ghi nhận góp ý, hỏi lại để hiểu rõ hơn", score: 3, feedback: "Tốt — bạn đã có phản ứng quan sát, dù vẫn còn chút dao động" },
      { text: "Nhận ra cơn nóng đang dâng lên, mỉm cười, cảm ơn góp ý và tiếp tục trình bày với tâm thế điềm tĩnh", score: 4, feedback: "Bạn đã THẤY được chính mình — tách biệt giữa quan sát và phản ứng" },
    ],
  },
  {
    id: 1, axis: "thay",
    story: "Bạn vừa cãi nhau với người thân qua điện thoại. Sau khi cúp máy, bạn thấy mình đang lặp đi lặp lại cuộc tranh luận trong đầu, nghĩ ra những câu mình 'lẽ ra nên nói'.",
    context: "Bối cảnh: Buổi tối, ở nhà một mình",
    options: [
      { text: "Tiếp tục 'tập dượt' cuộc tranh luận trong đầu, càng nghĩ càng bực", score: 1, feedback: "Bạn đang bị tâm trí dẫn dắt, không nhận ra mình đang trong vòng lặp" },
      { text: "Cố gắng nghĩ sang chuyện khác nhưng đầu óc vẫn quay lại", score: 2, feedback: "Bạn biết mình đang bị cuốn nhưng chưa đủ sức dừng lại" },
      { text: "Nhận ra mình đang 'nhai lại', dừng lại và đi uống nước", score: 3, feedback: "Tốt — bạn đã bắt được mình và chủ động cắt đứt" },
      { text: "Ngồi xuống, quan sát cơn giận như một đám mây trôi qua, không phán xét, không níu kéo", score: 4, feedback: "Bạn đã thực sự THẤY — quan sát thuần túy không đồng hóa" },
    ],
  },
  {
    id: 2, axis: "thay",
    story: "Bạn lướt mạng xã hội và thấy một người bạn đăng ảnh đi du lịch sang chảnh. Ngay lập tức bạn cảm thấy một cảm giác khó chịu nhẹ trong lòng — so sánh, ganh tị, tự ti.",
    context: "Bối cảnh: Đang nghỉ trưa, lướt điện thoại",
    options: [
      { text: "Lướt tiếp, xem thêm ảnh của họ, càng xem càng thấy mình thua kém", score: 1, feedback: "Bạn đang nuôi dưỡng cảm xúc tiêu cực mà không nhận ra" },
      { text: "Tắt app nhưng cảm giác khó chịu vẫn còn, tự nhủ 'mình cũng sẽ được như thế'", score: 2, feedback: "Bạn đã nhận ra nhưng vẫn còn bám víu vào so sánh" },
      { text: "Nhận ra mình đang ganh tị, cười trừ, tự nhắc 'mỗi người mỗi hành trình'", score: 3, feedback: "Tốt — bạn đã THẤY được phản ứng của mình" },
      { text: "Quan sát cảm giác ganh tị như một vị khách ghé thăm, mỉm cười với nó rồi để nó tự đi", score: 4, feedback: "Bạn đã làm chủ được tiến trình THẤY — không dính mắc" },
    ],
  },

  // ============================================================
  // TRỤC 2: HIỂU — Thấu triệt nhân quả
  // ============================================================
  {
    id: 3, axis: "hieu",
    story: "Dự án bạn dành 3 tháng tâm huyết bị sếp từ chối không lý do rõ ràng. Bạn cảm thấy bất công và tức giận. Tối về bạn kể với bạn đời và nói 'sếp không hiểu gì cả'.",
    context: "Bối cảnh: Vừa họp xong, đang trên đường về nhà",
    options: [
      { text: "Đổ lỗi hoàn toàn cho sếp — 'ông ấy không có tầm nhìn, thiên vị'", score: 1, feedback: "Bạn đang phản ứng mà không HIỂU — chưa thấy được nhân quả" },
      { text: "Nghĩ rằng do mình trình bày chưa tốt, nhưng vẫn thấy bất công", score: 2, feedback: "Bạn đã bắt đầu tự vấn nhưng vẫn còn dính mắc vào cảm xúc" },
      { text: "Bình tĩnh phân tích: 'Có thể góc nhìn của mình chưa phù hợp với ưu tiên hiện tại của công ty'", score: 3, feedback: "Tốt — bạn đã HIỂU được nhân duyên của sự việc" },
      { text: "Thấy rõ nhiều tầng nhân quả: ưu tiên công ty, cách truyền đạt, thời điểm chưa chín muồi — và biết mình cần làm gì tiếp theo", score: 4, feedback: "Bạn đã thực sự HIỂU — thấy được bức tranh toàn cảnh và rút ra bài học" },
    ],
  },
  {
    id: 4, axis: "hieu",
    story: "Con bạn vừa làm vỡ chiếc bình quý giá mà bạn rất thích. Phản ứng đầu tiên của bạn là quát lên: 'Sao con bất cẩn thế!' Đứa trẻ òa khóc.",
    context: "Bối cảnh: Chiều cuối tuần, ở nhà",
    options: [
      { text: "Tiếp tục mắng con vì tội làm hỏng đồ đắt tiền", score: 1, feedback: "Bạn đang phản ứng theo thói quen, không HIỂU căn nguyên" },
      { text: "Dừng mắng nhưng vẫn bực, mặt nặng mày nhẹ với con", score: 2, feedback: "Bạn đã kiềm chế nhưng chưa thực sự HIỂU" },
      { text: "Hít thở, nhận ra con không cố ý và cơn giận đến từ sự tiếc nuối của mình, không phải lỗi của con", score: 3, feedback: "Tốt — bạn đã HIỂU được gốc rễ cảm xúc của mình" },
      { text: "Ngồi xuống ôm con, giải thích nhẹ nhàng, dùng tình huống này để dạy con về sự cẩn thận và cùng con dọn dẹp", score: 4, feedback: "Bạn đã chuyển hóa tình huống nhờ HIỂU sâu sắc — biến tai nạn thành bài học" },
    ],
  },
  {
    id: 5, axis: "hieu",
    story: "Một người bạn thân đột nhiên 'lơ' bạn — không trả lời tin nhắn, hủy hẹn 2 lần liên tiếp. Bạn bắt đầu suy nghĩ: 'Mình đã làm gì sai à?', 'Hay có ai nói xấu mình?'",
    context: "Bối cảnh: Kéo dài 2 tuần, bạn thấy tổn thương",
    options: [
      { text: "Cho rằng người đó 'trở mặt', quyết định nghỉ chơi luôn", score: 1, feedback: "Bạn đang kết luận mà không HIỂU — nhảy thẳng đến phán xét" },
      { text: "Nhắn tin trách móc: 'Sao dạo này bạn lạ thế?'", score: 2, feedback: "Bạn đã tìm cách giao tiếp nhưng vẫn mang tính buộc tội" },
      { text: "Tự hỏi: 'Có thể bạn ấy đang gặp chuyện gì khó khăn mà mình chưa biết?' — rồi nhẹ nhàng hỏi thăm", score: 3, feedback: "Tốt — bạn đã HIỂU rằng hành vi của người khác thường có nguyên nhân riêng" },
      { text: "Hiểu rằng mọi hành vi đều có nhân duyên — có thể bạn ấy stress, gia đình có chuyện — chủ động quan tâm mà không đòi hỏi giải thích", score: 4, feedback: "Bạn đã HIỂU sâu sắc — thấy được bức tranh rộng hơn ngoài bản thân mình" },
    ],
  },

  // ============================================================
  // TRỤC 3: BUÔNG — Xả bỏ chấp trước
  // ============================================================
  {
    id: 6, axis: "buong",
    story: "Bạn phát hiện người yêu cũ vừa đăng ảnh cưới. Dù đã chia tay 2 năm và bạn đang có mối quan hệ mới, bạn vẫn thấy nhói lòng khi xem những bức ảnh đó.",
    context: "Bối cảnh: Lướt Facebook, tình cờ thấy",
    options: [
      { text: "Xem đi xem lại album cưới, đọc bình luận, so sánh với mình", score: 1, feedback: "Bạn đang níu kéo quá khứ — chưa BUÔNG được" },
      { text: "Thấy buồn, tắt máy nhưng vẫn nghĩ về nó suốt buổi tối", score: 2, feedback: "Bạn đã cố gắng nhưng tâm trí vẫn dính mắc" },
      { text: "Thoáng buồn, tự nhủ 'chúc họ hạnh phúc', rồi tiếp tục công việc của mình", score: 3, feedback: "Tốt — bạn đã BUÔNG được phần lớn, chấp nhận thực tại" },
      { text: "Mỉm cười, thấy vui cho họ như thấy vui cho một người bạn cũ — không chút vướng bận", score: 4, feedback: "Bạn đã BUÔNG hoàn toàn — tình thương không dính mắc" },
    ],
  },
  {
    id: 7, axis: "buong",
    story: "Bạn có một chiếc xe máy cũ — kỷ niệm thời sinh viên. Nó đã hỏng từ 3 năm trước, nằm phủ bụi trong góc nhà. Mỗi lần định bán, bạn lại nghĩ 'để đấy, biết đâu có lúc cần'.",
    context: "Bối cảnh: Dọn nhà, cần không gian",
    options: [
      { text: "Giữ lại — 'kỷ niệm mà, không nỡ bỏ'", score: 1, feedback: "Bạn đang bám víu vào ký ức vật chất — chưa BUÔNG được" },
      { text: "Đắn đo mãi, cuối cùng vẫn giữ, tự hứa 'để thêm vài tháng nữa'", score: 2, feedback: "Bạn biết nên buông nhưng ý chí chưa đủ mạnh" },
      { text: "Chụp vài tấm ảnh kỷ niệm, rồi gọi người đến mua với giá rẻ", score: 3, feedback: "Tốt — bạn đã BUÔNG được vật chất nhưng vẫn giữ kỷ niệm một cách lành mạnh" },
      { text: "Nhận ra kỷ niệm nằm trong tâm, không phải trong vật — cho nó cho ai cần hơn, nhẹ lòng", score: 4, feedback: "Bạn đã BUÔNG hoàn toàn — hiểu rằng giá trị không nằm ở đồ vật" },
    ],
  },
  {
    id: 8, axis: "buong",
    story: "Một đồng nghiệp được thăng chức thay vì bạn, dù bạn nghĩ mình xứng đáng hơn. Đã 3 tháng trôi qua nhưng mỗi lần thấy người đó trong công ty, bạn vẫn thấy khó chịu.",
    context: "Bối cảnh: Công ty, hàng ngày phải gặp mặt",
    options: [
      { text: "Nói xấu sau lưng, tìm cách hạ uy tín của họ", score: 1, feedback: "Bạn đang bị chấp trước điều khiển — càng níu càng khổ" },
      { text: "Tránh mặt, không nói chuyện, tỏ thái độ lạnh nhạt", score: 2, feedback: "Bạn chưa BUÔNG — chỉ đang kìm nén" },
      { text: "Chấp nhận sự thật, tập trung phát triển bản thân thay vì so sánh", score: 3, feedback: "Tốt — bạn đã BUÔNG được phần lớn và chuyển hướng năng lượng" },
      { text: "Chúc mừng họ chân thành, hiểu rằng mọi sự đều có nhân duyên — tập trung vào con đường của mình", score: 4, feedback: "Bạn đã BUÔNG hoàn toàn — chuyển từ ganh tị sang tùy hỷ" },
    ],
  },

  // ============================================================
  // TRỤC 4: AN TRÚ — Bình an nội tại
  // ============================================================
  {
    id: 9, axis: "antru",
    story: "Bạn đang ở sân bay thì nhận được thông báo chuyến bay bị hủy do thời tiết xấu. Bạn có cuộc họp quan trọng vào sáng mai ở thành phố đích. Hành khách xung quanh đang la ó, cãi nhau với nhân viên.",
    context: "Bối cảnh: 10h tối, sân bay đông đúc, không có chuyến thay thế",
    options: [
      { text: "Nổi nóng, la ó nhân viên như những người khác, đòi bồi thường", score: 1, feedback: "Bạn đang để ngoại cảnh điều khiển — chưa có AN TRÚ" },
      { text: "Không la ó nhưng trong lòng cực kỳ bực bội, gọi điện than thở với người nhà", score: 2, feedback: "Bên ngoài có vẻ bình tĩnh nhưng nội tâm đang bất an" },
      { text: "Chấp nhận tình huống, gọi báo hủy cuộc họp, tìm phương án thay thế", score: 3, feedback: "Tốt — bạn đã có AN TRÚ, đối diện và xử lý thay vì phản ứng" },
      { text: "Thấy đây là cơ hội để nghỉ ngơi, đọc sách, quan sát sự hỗn loạn xung quanh với tâm bình thản", score: 4, feedback: "Bạn đã AN TRÚ vững chắc — tùy duyên, không lay động" },
    ],
  },
  {
    id: 10, axis: "antru",
    story: "Bạn nhận được tin nhắn lúc 11h đêm từ sếp: 'Mai 8h sáng họp khẩn, chuẩn bị báo cáo Q4'. Bạn chưa có số liệu Q4 vì kế toán chưa chốt sổ. Đêm đó bạn trằn trọc, không ngủ được.",
    context: "Bối cảnh: Đêm trước ngày họp, cảm thấy bị dồn ép",
    options: [
      { text: "Thức trắng đêm cố gắng tự tổng hợp số liệu, sáng ra mệt mỏi, cáu gắt", score: 1, feedback: "Bạn đang phản ứng vội vàng — chưa có AN TRÚ" },
      { text: "Cố ngủ nhưng không được, đầu óc quay cuồng nghĩ về hậu quả", score: 2, feedback: "Bạn đang để nỗi lo điều khiển" },
      { text: "Hít thở 5 phút, nhắn tin xin sếp thêm thời gian hoặc dùng số liệu tạm, rồi đi ngủ", score: 3, feedback: "Tốt — bạn đã có AN TRÚ để đưa ra quyết định sáng suốt" },
      { text: "Nhận ra mọi việc đều có cách giải quyết — không việc gì đáng để đánh đổi giấc ngủ và sức khỏe. Ngủ ngon, sáng mai xử lý.", score: 4, feedback: "Bạn đã AN TRÚ sâu sắc — ưu tiên sự bình an nội tại trên mọi áp lực" },
    ],
  },
  {
    id: 11, axis: "antru",
    story: "Bạn đang thiền thì hàng xóm bật nhạc ầm ĩ, tiếng khoan từ công trình gần đó, điện thoại rung liên tục. Bạn cảm thấy bực mình — 'Sao không lúc nào yên ổn thế này?'",
    context: "Bối cảnh: Sáng cuối tuần, bạn muốn có 30 phút yên tĩnh",
    options: [
      { text: "Bỏ cuộc, cáu kỉnh, bật TV lên xem cho đỡ bực", score: 1, feedback: "Bạn đang để hoàn cảnh quyết định trạng thái của mình" },
      { text: "Cố gắng thiền tiếp nhưng trong lòng khó chịu, liên tục bị phân tâm", score: 2, feedback: "Bạn đã cố gắng nhưng AN TRÚ chưa đủ mạnh" },
      { text: "Chấp nhận tiếng ồn như một phần của bài thiền, biến nó thành đối tượng quan sát", score: 3, feedback: "Tốt — bạn đã dùng chướng ngại làm phương tiện tu tập" },
      { text: "Nhận ra AN TRÚ không phụ thuộc vào yên tĩnh bên ngoài — bình an đến từ bên trong. Mỉm cười, tiếp tục thiền với tâm rộng mở.", score: 4, feedback: "Bạn đã AN TRÚ thực sự — không bị ngoại cảnh lay động" },
    ],
  },

  // ============================================================
  // TRỤC 5: BIẾT ƠN — Lòng tri ân
  // ============================================================
  {
    id: 12, axis: "bieton",
    story: "Sáng thức dậy, bạn kiểm tra điện thoại và thấy: đồng nghiệp đi du lịch Châu Âu, bạn học mua nhà mới, người quen vừa nhận giải thưởng. Bạn nhìn quanh căn phòng trọ của mình và thở dài.",
    context: "Bối cảnh: Sáng thứ Hai, chuẩn bị đi làm",
    options: [
      { text: "Cảm thấy mình thật thất bại, tự hỏi 'bao giờ mới bằng họ?'", score: 1, feedback: "Bạn đang so sánh và quên mất những gì mình đang có" },
      { text: "Tự an ủi 'thôi mỗi người mỗi số', nhưng vẫn thấy chạnh lòng", score: 2, feedback: "Bạn đã cố gắng nhưng lòng BIẾT ƠN chưa đủ sâu" },
      { text: "Tắt điện thoại, nghĩ về 3 điều mình đang có: sức khỏe, công việc ổn định, gia đình khỏe mạnh", score: 3, feedback: "Tốt — bạn đã chủ động nuôi dưỡng lòng BIẾT ƠN" },
      { text: "Mỉm cười, thấy vui cho thành công của họ, đồng thời biết ơn sâu sắc những gì mình đang có — một ngày mới, một cơ thể khỏe, một công việc để làm", score: 4, feedback: "Bạn đã BIẾT ƠN trọn vẹn — tùy hỷ với người, trân trọng những điều nhỏ bé" },
    ],
  },
  {
    id: 13, axis: "bieton",
    story: "Bạn bị ốm, nằm một mình trong phòng. Bạn bè không ai biết vì bạn không muốn làm phiền. Ngoài trời mưa, căn phòng lạnh lẽo. Bạn cảm thấy cô đơn và tủi thân.",
    context: "Bối cảnh: Một mình trong phòng trọ, sốt nhẹ",
    options: [
      { text: "Nằm nghĩ về sự cô đơn, thấy cuộc đời thật bất công", score: 1, feedback: "Bạn đang tập trung vào điều thiếu thốn" },
      { text: "Lướt mạng xã hội xem người khác vui vẻ, càng thấy tủi thân", score: 2, feedback: "So sánh làm nỗi cô đơn thêm sâu" },
      { text: "Nhận ra mình vẫn có: mái nhà che mưa, nước nóng để uống thuốc, cơ thể đang tự chữa lành", score: 3, feedback: "Tốt — bạn đã chuyển hướng sang BIẾT ƠN những điều đơn giản" },
      { text: "Thấy cơn ốm như một lời nhắc nhở cơ thể cần nghỉ ngơi — biết ơn cơ thể đã làm việc không ngừng, biết ơn sự tĩnh lặng để quay vào bên trong", score: 4, feedback: "Bạn đã BIẾT ƠN sâu sắc — thấy giá trị ngay cả trong nghịch cảnh" },
    ],
  },
  {
    id: 14, axis: "bieton",
    story: "Bạn vừa nhận lương tháng. Nhìn bảng lương, bạn thấy thấp hơn kỳ vọng. Bạn nghĩ đến những thứ mình chưa mua được: điện thoại mới, chuyến du lịch, khoản tiết kiệm còn ít.",
    context: "Bối cảnh: Cuối tháng, vừa thanh toán các hóa đơn",
    options: [
      { text: "Cảm thấy bực bội, nghĩ 'mình làm việc vất vả mà được trả có thế này'", score: 1, feedback: "Bạn đang tập trung vào điều chưa đủ" },
      { text: "So sánh lương mình với bạn bè, thấy chán nản", score: 2, feedback: "So sánh làm mất đi niềm vui với những gì đang có" },
      { text: "Tự nhắc mình: vẫn có việc làm, vẫn đủ tiền trả các hóa đơn, vẫn có đồ ăn trên bàn", score: 3, feedback: "Tốt — bạn đã nuôi dưỡng lòng BIẾT ƠN những điều cơ bản" },
      { text: "Biết ơn vì có thu nhập ổn định, biết ơn công việc cho mình cơ hội học hỏi, biết ơn những gì đã đủ đầy — phần còn lại là động lực để phát triển", score: 4, feedback: "Bạn đã BIẾT ƠN trọn vẹn — dùng lòng biết ơn làm nền tảng để vươn lên" },
    ],
  },

  // ============================================================
  // TRỤC 6: PHỤNG SỰ — Cho đi vô điều kiện
  // ============================================================
  {
    id: 15, axis: "phungsu",
    story: "Trên đường về nhà sau ngày làm việc mệt mỏi, bạn thấy một cụ bà đang loay hoay với túi đồ nặng ở chân cầu thang. Trời sắp mưa. Bạn chỉ muốn về nhà nằm nghỉ.",
    context: "Bối cảnh: 6h chiều, đang mệt và đói",
    options: [
      { text: "Đi thẳng, nghĩ 'chắc có người khác giúp'", score: 1, feedback: "Bạn đang bỏ lỡ cơ hội PHỤNG SỰ đơn giản" },
      { text: "Dừng lại hỏi 'bà có cần cháu giúp không?' nhưng trong lòng mong bà từ chối", score: 2, feedback: "Bạn có ý định tốt nhưng vẫn còn tính toán" },
      { text: "Dừng lại, xách đồ giúp bà lên cầu thang, không cần bà cảm ơn", score: 3, feedback: "Tốt — bạn đã PHỤNG SỰ một cách tự nhiên" },
      { text: "Không chỉ giúp bà xách đồ, còn hỏi thăm sức khỏe, đi cùng bà về tận nhà nếu cần — làm với tâm hoan hỷ, quên đi mệt nhọc", score: 4, feedback: "Bạn đã PHỤNG SỰ trọn vẹn — cho đi mà không cần nhận lại" },
    ],
  },
  {
    id: 16, axis: "phungsu",
    story: "Một đồng nghiệp mới vào công ty, làm việc chậm, hay mắc lỗi, ảnh hưởng đến tiến độ chung của nhóm. Mọi người bắt đầu phàn nàn và xa lánh cô ấy.",
    context: "Bối cảnh: Dự án gấp, deadline đang đến gần",
    options: [
      { text: "Tham gia phàn nàn, đề nghị trưởng nhóm chuyển cô ấy đi", score: 1, feedback: "Bạn đang đặt hiệu suất lên trên tình người" },
      { text: "Im lặng, không phàn nàn nhưng cũng không giúp đỡ", score: 2, feedback: "Bạn trung lập nhưng chưa PHỤNG SỰ" },
      { text: "Chủ động ngồi lại sau giờ làm, hướng dẫn cô ấy những phần khó", score: 3, feedback: "Tốt — bạn đã PHỤNG SỰ bằng thời gian và kiến thức" },
      { text: "Không chỉ hướng dẫn, còn động viên tinh thần, bảo vệ cô ấy trước những lời phàn nàn, giúp cô ấy tự tin hơn", score: 4, feedback: "Bạn đã PHỤNG SỰ trọn vẹn — nâng đỡ người khác vô điều kiện" },
    ],
  },
  {
    id: 17, axis: "phungsu",
    story: "Bạn nhận được email từ một tổ chức từ thiện kêu gọi quyên góp. Bạn đang tiết kiệm cho một món đồ quan trọng. Số tiền họ đề nghị không nhỏ.",
    context: "Bối cảnh: Cuối tháng, ngân sách eo hẹp",
    options: [
      { text: "Xóa email ngay, nghĩ 'việc của ai người ấy lo'", score: 1, feedback: "Bạn đang đóng lòng trước cơ hội cho đi" },
      { text: "Đọc nhưng tự nhủ 'thôi để lúc khác, giờ mình còn lo chưa xong'", score: 2, feedback: "Bạn có ý thức nhưng chưa sẵn sàng PHỤNG SỰ" },
      { text: "Gửi một khoản nhỏ hơn — trong khả năng của mình, với tâm hoan hỷ", score: 3, feedback: "Tốt — bạn đã PHỤNG SỰ trong khả năng, không cần phải nhiều" },
      { text: "Không chỉ gửi tiền, còn chia sẻ email đó cho bạn bè, dành thời gian cuối tuần tham gia hoạt động từ thiện", score: 4, feedback: "Bạn đã PHỤNG SỰ trọn vẹn — lan tỏa tinh thần cho đi" },
    ],
  },

  // ============================================================
  // TRỤC 7: TỈNH THỨC — Chánh niệm thường trực
  // ============================================================
  {
    id: 18, axis: "tinhthuc",
    story: "Bạn đang ăn trưa một mình. Theo thói quen, bạn vừa ăn vừa lướt điện thoại — đọc tin tức, check email, xem TikTok. Đến khi nhìn xuống, đĩa cơm đã hết mà bạn không nhớ mình vừa ăn gì.",
    context: "Bối cảnh: Giờ nghỉ trưa, quán ăn quen thuộc",
    options: [
      { text: "Tiếp tục vừa ăn vừa lướt — 'ăn một mình chán, phải có gì xem'", score: 1, feedback: "Bạn đang sống trên 'chế độ tự động' — chưa TỈNH THỨC" },
      { text: "Nhận ra mình vừa 'ăn vô thức', hơi tiếc nhưng rồi lại tiếp tục thói quen", score: 2, feedback: "Bạn đã thoáng TỈNH THỨC nhưng chưa đủ để thay đổi" },
      { text: "Đặt điện thoại xuống, ăn nốt bữa trong chánh niệm — cảm nhận vị, mùi, kết cấu của thức ăn", score: 3, feedback: "Tốt — bạn đã thực hành TỈNH THỨC trong lúc ăn" },
      { text: "Dành trọn bữa ăn trong chánh niệm, biết ơn từng nguyên liệu, từ người nấu đến người trồng — thấy bữa ăn là một thiền định", score: 4, feedback: "Bạn đã TỈNH THỨC sâu sắc — biến hoạt động thường ngày thành thực hành tâm linh" },
    ],
  },
  {
    id: 19, axis: "tinhthuc",
    story: "Bạn đang lái xe trên đường cao tốc. Bỗng nhiên bạn 'tỉnh' ra và nhận ra mình đã lái xe 15 phút mà không hề ý thức — đầu óc đang lang thang ở đâu đó. Bạn giật mình vì sự nguy hiểm này.",
    context: "Bối cảnh: Đường dài, một mình trong xe",
    options: [
      { text: "Nghĩ 'ai chả thế' rồi tiếp tục lái như cũ", score: 1, feedback: "Bạn đang coi TỈNH THỨC là điều không quan trọng" },
      { text: "Giật mình lo lắng một lúc, nhưng 5 phút sau lại mất tập trung", score: 2, feedback: "Bạn đã có khoảnh khắc TỈNH THỨC nhưng chưa duy trì được" },
      { text: "Hạ cửa sổ, hít thở sâu, tập trung vào cảm giác tay trên vô-lăng, mắt trên đường", score: 3, feedback: "Tốt — bạn đã chủ động đưa tâm trở về hiện tại" },
      { text: "Dùng toàn bộ chuyến đi như một bài thiền: cảm nhận từng cua đường, từng hơi thở, từng khoảnh khắc — về đến nơi với tâm tươi mới, không mệt mỏi", score: 4, feedback: "Bạn đã TỈNH THỨC trọn vẹn — biến mọi hoạt động thành cơ hội thực tập" },
    ],
  },
  {
    id: 20, axis: "tinhthuc",
    story: "Bạn có một buổi tối rảnh rỗi — không deadline, không kế hoạch. Bạn dự định đọc sách nhưng rồi mở Netflix, xem hết tập này đến tập khác. 4 tiếng trôi qua, bạn thấy trống rỗng và hơi tội lỗi.",
    context: "Bối cảnh: Tối thứ Bảy, không có việc gì bắt buộc",
    options: [
      { text: "Tiếp tục xem thêm một tập nữa — 'cũng chẳng có gì làm'", score: 1, feedback: "Bạn đang trốn chạy sự trống rỗng bằng tiêu khiển vô thức" },
      { text: "Tắt TV nhưng lại lướt điện thoại vô định, cũng hết thêm 2 tiếng", score: 2, feedback: "Bạn đã nhận ra nhưng chưa đủ TỈNH THỨC để thay đổi" },
      { text: "Tắt hết thiết bị, dành 30 phút cuối buổi tối thiền hoặc viết nhật ký", score: 3, feedback: "Tốt — bạn đã chọn TỈNH THỨC thay vì tiêu khiển" },
      { text: "Nhận ra sự trống rỗng là tín hiệu — mình cần kết nối lại với bản thân. Dành buổi tối thiền, đọc sách, ngồi yên lắng nghe nội tâm.", score: 4, feedback: "Bạn đã TỈNH THỨC sâu sắc — dùng sự trống rỗng làm cửa ngõ vào bên trong" },
    ],
  },
];

/**
 * Nhóm scenarios theo trục
 */
export const AXES = [
  { key: "thay", label: "THẤY", desc: "Quan sát bản thân", icon: "👁️" },
  { key: "hieu", label: "HIỂU", desc: "Thấu triệt nhân quả", icon: "🔍" },
  { key: "buong", label: "BUÔNG", desc: "Xả bỏ chấp trước", icon: "🍂" },
  { key: "antru", label: "AN TRÚ", desc: "Bình an nội tại", icon: "🏠" },
  { key: "bieton", label: "BIẾT ƠN", desc: "Lòng tri ân", icon: "🙏" },
  { key: "phungsu", label: "PHỤNG SỰ", desc: "Cho đi vô điều kiện", icon: "🤲" },
  { key: "tinhthuc", label: "TỈNH THỨC", desc: "Chánh niệm thường trực", icon: "🧘" },
];

/**
 * Tính điểm cho từng trục từ kết quả scenarios
 */
export function computeScores(answers: Record<number, number>) {
  const result: Record<string, { total: number; count: number; avg: number; score: number }> = {};
  
  for (const axis of AXES) {
    result[axis.key] = { total: 0, count: 0, avg: 0, score: 0 };
  }

  for (const [idStr, score] of Object.entries(answers)) {
    const id = parseInt(idStr);
    const scenario = SCENARIOS.find(s => s.id === id);
    if (!scenario) continue;
    
    result[scenario.axis].total += score;
    result[scenario.axis].count += 1;
  }

  // Tính avg và quy về thang 1-10
  for (const axis of AXES) {
    const r = result[axis.key];
    r.avg = r.count > 0 ? r.total / r.count : 0;
    r.score = r.count > 0 ? Math.round((r.avg / 4) * 10) : 5;
  }

  return result;
}
