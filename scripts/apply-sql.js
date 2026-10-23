#!/usr/bin/env node
/**
 * Chạy một file .sql lên Supabase (Postgres) bằng service role.
 * Dùng: node scripts/apply-sql.js supabase/migrations/xxx.sql
 *
 * Gửi NGUYÊN file trong một lần (không tách theo ';') để transaction và
 * các khối nhiều câu lệnh chạy đúng thứ tự.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Thiếu đường dẫn file .sql');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) return;
    const i = t.indexOf('=');
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  });

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}
const ref = url.split('//')[1].split('.')[0];

// Ưu tiên connection string CLI đã lưu (có mật khẩu DB thật, đúng region).
const candidates = [];
try {
  const poolerUrl = fs.readFileSync(path.join(__dirname, '..', 'supabase', '.temp', 'pooler-url'), 'utf8').trim();
  if (poolerUrl.startsWith('postgresql')) {
    const u = new URL(poolerUrl);
    candidates.push({
      host: u.hostname,
      port: Number(u.port || 5432),
      database: u.pathname.replace(/^\//, '') || 'postgres',
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    });
  }
} catch {
  /* không có file thì bỏ qua */
}

candidates.push(
  { host: `db.${ref}.supabase.co`, port: 5432, database: 'postgres', user: 'postgres', password: key },
  { host: 'aws-1-ap-northeast-1.pooler.supabase.com', port: 5432, database: 'postgres', user: `postgres.${ref}`, password: key },
  { host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 5432, database: 'postgres', user: `postgres.${ref}`, password: key },
);

(async () => {
  const sql = fs.readFileSync(path.resolve(file), 'utf8');
  let client = null;
  for (const c of candidates) {
    try {
      const cl = new Client({ ...c, password: key, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      await cl.connect();
      client = cl;
      console.log(`✓ kết nối ${c.host}:${c.port}`);
      break;
    } catch (e) {
      console.log(`✗ ${c.host}: ${e.message}`);
    }
  }
  if (!client) {
    console.error('Không kết nối được database nào.');
    process.exit(1);
  }
  try {
    await client.query(sql);
    console.log(`✓ đã chạy ${path.basename(file)} (${sql.length} ký tự)`);
  } catch (e) {
    console.error('✗ lỗi SQL:', e.message);
    if (e.detail) console.error('  detail:', e.detail);
    if (e.hint) console.error('  hint:', e.hint);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
