const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = "gsnuqrutiauhnsacgzym";

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN env");
  process.exit(1);
}

const queries = [
  `INSERT INTO mentors (user_id, title, bio, specialties, experience_years, rating, review_count)
   VALUES ('c5dcdf15-2923-4b5d-8b35-ebfab7dc85a7', 'Chuyên gia Thiền & Khí công', 'Đồng hành cùng bạn trên hành trình tĩnh lặng.',
   ARRAY['Thiền Vipassana', 'Khí công', 'Chánh niệm'], 5, 4.8, 20)
   ON CONFLICT (user_id) DO NOTHING;`,
  `INSERT INTO mentors (user_id, title, bio, specialties, experience_years, rating, review_count)
   VALUES ('6d273d8b-800d-48da-bfce-d37033625e68', 'Chuyên gia Tâm lý học', 'Giúp bạn thấu hiểu cảm xúc.',
   ARRAY['Tâm lý học', 'NLP', 'Tham vấn'], 8, 4.9, 35)
   ON CONFLICT (user_id) DO NOTHING;`,
  `INSERT INTO mentors (user_id, title, bio, specialties, experience_years, rating, review_count)
   VALUES ('c0989a47-61dc-40e7-9628-7194f0a59800', 'Huấn luyện Thiền & Yoga', 'Kết nối thân-tâm qua thực hành.',
   ARRAY['Yoga', 'Thiền', 'Dinh dưỡng'], 3, 4.7, 15)
   ON CONFLICT (user_id) DO NOTHING;`,
];

async function run() {
  for (const query of queries) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    process.stdout.write(res.ok ? '.' : 'x');
  }
  console.log('\nDone');
}
run().catch(console.error);