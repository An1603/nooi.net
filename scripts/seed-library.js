const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error("Missing SUPABASE_ACCESS_TOKEN"); process.exit(1); }
const REF = "gsnuqrutiauhnsacgzym";

const docs = [
  { title: "Hướng dẫn Thiền cơ bản", type: "document", content: { category: "Thiền", body: "# Hướng dẫn Thiền cơ bản\n\n## 1. Tư thế\nNgồi thẳng lưng, hai chân khoanh lại, tay đặt trên đùi.\n\n## 2. Hơi thở\nHít vào bằng mũi, thở ra bằng miệng, chú ý vào hơi thở.\n\n## 3. Quán sát\nKhi tâm chạy, nhẹ nhàng đưa về hơi thở.\n\n## 4. Thời gian\nBắt đầu với 5-10 phút mỗi ngày." } },
  { title: "Thiền Quét thân 10 phút", type: "audio", content: { category: "Thiền", url: "https://example.com/meditation-scan.mp3", duration: "10:00" } },
  { title: "Nhận diện Cảm xúc", type: "document", content: { category: "Tâm lý học", body: "# Nhận diện Cảm xúc\n\nCảm xúc là tín hiệu, không phải kẻ thù.\n\n## Các bước nhận diện:\n1. Dừng lại, hít thở sâu\n2. Gọi tên cảm xúc (VD: 'Tôi đang buồn')\n3. Không phán xét, chỉ quan sát\n4. Hỏi: Cảm xúc này muốn nói gì?" } },
  { title: "Bài tập NLP: Tái lập khung", type: "document", content: { category: "Tâm lý học", body: "# Tái lập khung (Reframing)\n\nKỹ thuật NLP giúp thay đổi góc nhìn.\n\n## Bài tập:\n1. Viết một tình huống khó khăn\n2. Tìm 3 góc nhìn khác\n3. Hỏi: Người khác sẽ thấy thế nào?" } },
  { title: "Chào mặt trời 12 động tác", type: "video", content: { category: "Yoga", url: "https://www.youtube.com/watch?v=icWlgjcxuXY", duration: "15:00" } },
  { title: "Yoga cho người mới bắt đầu", type: "document", content: { category: "Yoga", body: "# Yoga cho người mới\n\n## Các tư thế cơ bản:\n1. Núi (Tadasana)\n2. Chó úp mặt (Adho Mukha Svanasana)\n3. Chiến binh I (Virabhadrasana I)\n4. Cây (Vrikshasana)\n\nGiữ mỗi tư thế 3-5 nhịp thở." } },
  { title: "Thực đơn chánh niệm", type: "document", content: { category: "Dinh dưỡng", body: "# Thực đơn chánh niệm\n\n## Nguyên tắc:\n- Ăn chậm, nhai kỹ\n- Biết ơn bữa ăn\n- Lắng nghe cơ thể\n\n## Gợi ý thực đơn:\n- Sáng: Cháo yến mạch + hạt chia\n- Trưa: Cơm gạo lứt + rau củ\n- Tối: Canh rau củ + đậu phụ" } },
  { title: "Ăn chánh niệm - Hướng dẫn", type: "document", content: { category: "Dinh dưỡng", body: "# Ăn chánh niệm\n\n1. Nhìn thức ăn\n2. Ngửi mùi thơm\n3. Nhai chậm 30 lần\n4. Cảm nhận vị\n5. Dừng khi no 80%" } },
  { title: "Thiền Từ bi (Metta)", type: "document", content: { category: "Thiền", body: "# Thiền Từ bi\n\n## Các bước:\n1. Ngồi yên, hít thở 3 hơi\n2. Cầu mong cho bản thân: 'Mong tôi được an vui'\n3. Cầu mong cho người thân\n4. Cầu mong cho tất cả chúng sinh" } },
  { title: "Thiền đi bộ (Kinh hành)", type: "document", content: { category: "Thiền", body: "# Thiền đi bộ\n\nChú ý vào từng bước chân.\n\n1. Đứng yên, ý thức thân thể\n2. Bước chân trái, nói thầm 'bước'\n3. Bước chân phải, nói thầm 'bước'\n4. Đi chậm, đều, tự nhiên\n\nThời gian: 10-20 phút." } },
];

async function run() {
  const userId = "c5dcdf15-2923-4b5d-8b35-ebfab7dc85a7"; // NGuyen An
  for (const doc of docs) {
    const contentJson = JSON.stringify(doc.content).replace(/'/g, "''");
    const titleEscaped = doc.title.replace(/'/g, "''");
    const query = `INSERT INTO documents (user_id, title, content, file_type)
      VALUES ('${userId}', '${titleEscaped}', '${contentJson}', '${doc.type}')
      ON CONFLICT DO NOTHING;`;
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    process.stdout.write(res.ok ? "." : "x");
  }
  console.log("\n✅ Seeded " + docs.length + " documents");
}
run().catch(console.error);
