UPDATE public.projects SET
  html_content='<h3>Tổng quan</h3>
<p>NOOI Forest triển khai hệ sinh thái du lịch – nghỉ dưỡng – kinh tế tái sinh tại Măng Đen (huyện Kon Plông) và Đăk Rve (huyện Kon Rẫy), tỉnh Quảng Ngãi. Mục tiêu: khai thác hài hòa cảnh quan, khí hậu và tài nguyên bản địa, đồng thời phục hồi tài nguyên, nâng cao giá trị đất đai và phát triển sinh kế bền vững cho cộng đồng địa phương.</p>
<h3>Cấu trúc pháp lý</h3>
<ul>
<li><strong>NOOI Group</strong> — TNHH một thành viên, trụ sở Măng Đen: sở hữu tài sản vô hình (thương hiệu, công nghệ, AI Agent) và nền tảng quản trị toàn hệ thống.</li>
<li><strong>NOOI FOREST</strong> — công ty cổ phần, trụ sở Đăk Rve: triển khai dự án trong môi trường rừng theo các trụ cột kinh doanh.</li>
<li>NOOI Group góp vốn bằng <strong>quyền sử dụng tài sản trí tuệ</strong> (không chuyển quyền sở hữu) để nhận <strong>25%</strong> cổ phần; vốn điều lệ NOOI FOREST là <strong>10 tỷ đồng</strong>.</li>
<li>Đất rừng: thuê môi trường rừng <strong>200–300 ha</strong> từ BQL Rừng phòng hộ Kon Rẫy — thời hạn không quá 30 năm, chi trả tối thiểu <strong>1% doanh thu/năm</strong>.</li>
</ul>
<h3>Năm trụ cột kinh doanh</h3>
<ol>
<li><strong>Thương mại – Dịch vụ – Du lịch</strong> — check-in săn mây, lưu trú sinh thái, F&amp;B bản địa, du lịch trải nghiệm; ưu tiên giai đoạn đầu để tạo dòng tiền.</li>
<li><strong>Nông nghiệp rừng – Dược liệu</strong> — rau củ xứ lạnh, nông nghiệp dưới tán rừng, vùng dược liệu và chế biến.</li>
<li><strong>Chữa lành – Phát triển bản thân</strong> — thiền, yoga, chánh niệm, dinh dưỡng và các chương trình nghỉ dưỡng chuyên đề.</li>
<li><strong>Kinh tế tái sinh</strong> — than sinh học, giấm gỗ, nông nghiệp tái sinh, phục hồi hệ sinh thái, tiềm năng tín chỉ carbon.</li>
<li><strong>Trung tâm Doanh nghiệp 1 người (OPC Center)</strong> — chuẩn hóa cá nhân kinh doanh độc lập thành doanh nghiệp 1 người vận hành bài bản.</li>
</ol>
<h3>Ưu đãi và tuân thủ</h3>
<ul>
<li>Cả hai pháp nhân đều thuộc địa bàn ưu đãi đầu tư: thuế thu nhập doanh nghiệp <strong>10% trong 15 năm</strong>, miễn 4 năm, giảm 50% trong 9 năm.</li>
<li>Hoạt động trồng, chăm sóc, bảo vệ rừng và nuôi trồng lâm sản thuộc ngành nghề ưu đãi.</li>
<li>Nguyên tắc vận hành: ưu tiên sinh khối có xuất xứ hợp pháp, <strong>không khai thác rừng tự nhiên</strong> để tạo nguyên liệu than sinh học.</li>
</ul>
<h3>Lộ trình</h3>
<ul>
<li><strong>Q4/2026 – Q2/2027 — Nền móng:</strong> thành lập hai pháp nhân, điều lệ và thỏa thuận cổ đông, chọn đất, đăng ký nhãn hiệu, góp vốn bằng IP.</li>
<li><strong>Q3/2027 – 2028 — Khởi chạy dòng tiền:</strong> ưu tiên Check-in và F&amp;B; khởi động OPC Center; hoàn tất đất và quy hoạch chi tiết.</li>
<li><strong>2029 — Mở rộng:</strong> mở rộng năm trụ cột, mở rộng cổ đông, triển khai hệ thống quản trị nguồn lực.</li>
<li><strong>2030+ — Tăng trưởng:</strong> nhân rộng mô hình; nghiên cứu phương án vốn khi phù hợp.</li>
</ul>',
  thumbnail_url=NULL,
  video_poster=NULL,
  team='[]'::jsonb,
  updated_at=now()
WHERE id='44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7';
UPDATE public.projects SET revenue_phases = replace(revenue_phases::text, 'Mở rộng第二期', 'Mở rộng giai đoạn 2')::jsonb WHERE id='44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7';
SELECT length(html_content) AS html_len, jsonb_array_length(highlights) AS hl, jsonb_array_length(timeline) AS gd, video_url, thumbnail_url, video_poster, jsonb_array_length(team) AS team, (revenue_phases::text LIKE '%第二%') AS con_chu_trung FROM public.projects;
