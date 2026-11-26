#!/usr/bin/env node
/**
 * Sinh `public/gallery/data/gallery.json` từ `data/gallery.js`.
 *
 * Vì sao cần: trang tĩnh cũ nạp dữ liệu bằng thẻ <script> gán `window.__NOOI_GALLERY__`
 * (chỉ dùng được trong trang HTML tĩnh). Trang Next đọc JSON qua fetch nên phải có bản JSON.
 *
 * Giữ CẢ HAI bản: pipeline scrape vẫn ghi `gallery.js` (không đụng vào công cụ cào), script
 * này chỉ chuyển thể. Chạy tự động trong `scripts/sync-gallery.sh` sau mỗi lần đồng bộ.
 *
 * Cách dùng: node scripts/build-gallery-json.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(process.cwd(), "public/gallery/data");
const NGUON = path.join(ROOT, "gallery.js");
const DICH = path.join(ROOT, "gallery.json");

if (!fs.existsSync(NGUON)) {
  console.error(`✗ Không thấy ${NGUON}`);
  process.exit(1);
}

const ma = fs.readFileSync(NGUON, "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(ma, ctx, { timeout: 5000 });

const d = ctx.window.__NOOI_GALLERY__;
if (!d || !Array.isArray(d.items)) {
  console.error("✗ Dữ liệu không đúng dạng { boards, items }");
  process.exit(1);
}

// Chỉ giữ trường giao diện cần — bỏ `pin` (link Pinterest) để nhẹ bớt payload.
const gon = {
  total: d.total ?? d.items.length,
  scrapedAt: d.scrapedAt ?? null,
  boards: (d.boards || [])
    .filter((b) => b && !b.error)
    .map((b) => ({ slug: b.slug, name: b.name || b.slug, count: b.count ?? 0 })),
  items: d.items.map((it) => ({
    id: it.id,
    board: it.board,
    w: it.w,
    h: it.h,
    color: it.color || null,
    thumb: it.thumb,
    full: it.full,
  })),
};

fs.writeFileSync(DICH, JSON.stringify(gon), "utf8");
const kb = Math.round(fs.statSync(DICH).size / 1024);
console.log(`✓ gallery.json — ${gon.items.length} ảnh · ${gon.boards.length} board · ${kb} KB`);
