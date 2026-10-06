#!/usr/bin/env node
/**
 * supabase-sql.js — Chạy SQL trên Supabase (Management API) với token TỰ ĐỘNG.
 *
 * Tự tìm token còn sống theo thứ tự:
 *   1. SUPABASE_ACCESS_TOKEN trong ~/.hermes/.env
 *   2. SUPABASE_ACCESS_TOKEN trong nooi.net/.env.local
 *   3. ~/.supabase/access-token  (token của lệnh `supabase login`)
 *
 * Cách dùng:
 *   node scripts/supabase-sql.js --check              # kiểm tra token nào còn sống
 *   node scripts/supabase-sql.js <file.sql>           # chạy cả file (chia theo ';')
 *   node scripts/supabase-sql.js --query "SELECT 1"   # chạy 1 câu
 *   node scripts/supabase-sql.js <file.sql> --save    # chạy + lưu token tốt vào .env.local
 *
 * Ghi chú: token dạng sbp_ KHÔNG tự gia hạn được; hết hạn thì chạy `supabase login`
 * (1 lệnh, xác nhận trên trình duyệt) là token mới xuất hiện ở ~/.supabase/access-token.
 * Muốn KHÔNG bao giờ phải làm lại: dùng mật khẩu DB (không hết hạn) thay cho token.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERMES_ENV = path.join(os.homedir(), ".hermes", ".env");
const LOCAL_ENV = path.join(__dirname, "..", ".env.local");
const CLI_TOKEN = path.join(os.homedir(), ".supabase", "access-token");

function readEnv(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}
function getVar(text, key) {
  const m = text.match(new RegExp("^" + key + "\\s*=\\s*\"?([^\"\\n]+)\"?", "m"));
  return m ? m[1].trim() : "";
}
function setVar(file, key, value) {
  let t = readEnv(file);
  const line = `${key}=${value}`;
  if (new RegExp("^" + key + "\\s*=", "m").test(t)) {
    t = t.replace(new RegExp("^" + key + "\\s*=.*$", "m"), line);
  } else {
    t = t.replace(/\n*$/, "\n") + line + "\n";
  }
  fs.writeFileSync(file, t, { mode: 0o600 });
}

const localEnv = readEnv(LOCAL_ENV);
const ref = (getVar(localEnv, "NEXT_PUBLIC_SUPABASE_URL") || "").split("//")[1]?.split(".")[0] || "";
if (!ref) {
  console.error("✗ Không tìm thấy NEXT_PUBLIC_SUPABASE_URL trong .env.local");
  process.exit(1);
}

const candidates = [
  { src: "~/.hermes/.env", token: getVar(readEnv(HERMES_ENV), "SUPABASE_ACCESS_TOKEN") },
  { src: "nooi.net/.env.local", token: getVar(localEnv, "SUPABASE_ACCESS_TOKEN") },
  { src: "~/.supabase/access-token (CLI)", token: readEnv(CLI_TOKEN).trim() },
].filter((c) => c.token);

async function api(token, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (res.status === 401) return { ok: false, status: 401 };
  return { ok: res.ok, status: res.status, text };
}

async function pickToken() {
  for (const c of candidates) {
    const r = await api(c.token, "SELECT 1 AS ok");
    console.log(`  ${r.ok ? "✓ sống" : "✗ chết (" + r.status + ")"}  ← ${c.src}`);
    if (r.ok) return c;
  }
  return null;
}

(async () => {
  const args = process.argv.slice(2);
  if (!ref) process.exit(1);
  console.log(`Dự án Supabase: ${ref}`);
  const chosen = await pickToken();
  if (!chosen) {
    console.error(
      "\n✗ KHÔNG có token Supabase nào còn sống.\n" +
        "  → Chạy:  supabase login        (xác nhận trên trình duyệt, ~20 giây)\n" +
        "  → Hoặc tạo Personal Access Token mới tại https://supabase.com/dashboard/account/tokens\n" +
        "  → Hoặc (bền nhất) dùng mật khẩu DB — không bao giờ hết hạn."
    );
    process.exit(2);
  }
  if (args[0] === "--check") {
    console.log("\n✓ Dùng được token từ:", chosen.src);
    process.exit(0);
  }
  const sql =
    args[0] === "--query"
      ? args.slice(1).join(" ")
      : fs.readFileSync(args.find((a) => !a.startsWith("--")), "utf8");

  let failed = 0;
  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    const r = await api(chosen.token, stmt);
    if (r.ok) {
      console.log("✓", stmt.split("\n")[0].slice(0, 70));
      if (r.text && r.text !== "[]") console.log("   →", r.text.slice(0, 400));
    } else {
      failed++;
      console.log("⚠", stmt.split("\n")[0].slice(0, 70), "→", String(r.text).slice(0, 200));
    }
  }
  if (args.includes("--save") && chosen.src !== "nooi.net/.env.local") {
    setVar(LOCAL_ENV, "SUPABASE_ACCESS_TOKEN", chosen.token);
    console.log("✓ Đã lưu token tốt vào nooi.net/.env.local");
  }
  process.exit(failed ? 1 : 0);
})();