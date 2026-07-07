const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error("Missing SUPABASE_ACCESS_TOKEN"); process.exit(1); }
const REF = "gsnuqrutiauhnsacgzym";

const docs = [
  // ── Image ──
  { title: "Biểu tượng NOOI", type: "image", content: { category: "Thiền", url: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800", caption: "Hoa sen - biểu tượng của sự tĩnh lặng" } },
  { title: "Thiền đường yên tĩnh", type: "image", content: { category: "Thiền", url: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800", caption: "Không gian thiền định" } },
  { title: "Yoga trên biển", type: "image", content: { category: "Yoga", url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800", caption: "Tư thế yoga buổi sáng" } },

  // ── Audio ──
  { title: "Thiền hơi thở 5 phút", type: "audio", content: { category: "Thiền", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: "5:00" } },
  { title: "Nhạc nền thiền", type: "audio", content: { category: "Thiền", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: "10:00" } },

  // ── PDF ──
  { title: "Hướng dẫn Thiền cơ bản PDF", type: "pdf", content: { category: "Thiền", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", pages: 12 } },
  { title: "Bài tập Yoga hàng ngày", type: "pdf", content: { category: "Yoga", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", pages: 24 } },
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
  console.log("\n✅ Seeded " + docs.length + " sample docs");
}
run().catch(console.error);
