/**
 * Kiểm tra thanh lọc khi có NHIỀU board.
 *
 * Vì sao cần: chip board nằm trong thanh lọc dính trên đầu trang. Nếu để chúng
 * xuống dòng thì cứ thêm board là header cao dần, cuối cùng chiếm gần hết màn
 * hình điện thoại. Bài test này dựng một manifest giả có đủ số board trong
 * boards.json, rồi khẳng định: header không cao quá, trang không tràn ngang,
 * và dải board cuộn được (không bị cắt cụt).
 *
 * Dùng: node scripts/many-boards.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gallery.json'), 'utf8'));
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'boards.json'), 'utf8'));

// Tên hiển thị lấy từ manifest thật nếu board đã có, còn lại tạm dùng slug
const nameOf = (slug) => (REAL.boards.find((b) => b.slug === slug) || {}).name || slug;

// Board bị ẩn (`hidden: true`) không lên web nên không tính vào đây — test phải
// dựng đúng số board mà người dùng thật sự thấy.
const slugs = CFG.boards.filter((b) => !b.hidden).map((b) => b.slug);
if (slugs.length < 2) {
  console.log('Chỉ có 1 board — không cần kiểm tra nhóm lọc theo board.');
  process.exit(0);
}

// Rải ảnh thật vào các board để mỗi chip có số khác nhau
const items = REAL.items.map((it, i) => ({ ...it, board: slugs[i % slugs.length] }));
const boards = slugs.map((slug) => ({
  slug,
  name: nameOf(slug),
  url: '',
  id: null,
  error: null,
  count: items.filter((x) => x.board === slug).length,
}));
const manifest = { boards, total: items.length, scrapedAt: new Date().toISOString(), items };

const SIZES = [
  { name: 'iPhone-SE', w: 375, h: 667 },
  { name: 'iPhone-14', w: 390, h: 844 },
  { name: 'iPad-doc', w: 768, h: 1024 },
  { name: 'laptop', w: 1280, h: 800 },
  { name: 'desktop', w: 1680, h: 950 },
];

const MAX_HEADER_PCT = 30;

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const problems = [];

for (const s of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));

  await page.route('**/data/gallery.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.__NOOI_GALLERY__ = ${JSON.stringify(manifest)};`,
    })
  );

  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);

  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const strip = document.getElementById('boardScroll');
    const rest = document.querySelector('.filters__rest');
    const max = strip.scrollWidth - strip.clientWidth;
    strip.scrollLeft = 9999;
    const got = Math.round(strip.scrollLeft);
    strip.scrollLeft = 0;

    // chip có bị bóp chữ (xuống dòng) không? so chiều cao thực với chiều cao CSS
    const chip = document.querySelector('#boardGroup [data-board]');
    const chipH = chip ? chip.getBoundingClientRect().height : 0;
    const chipStyleH = chip ? parseFloat(getComputedStyle(chip).height) : 0;

    return {
      chip: document.querySelectorAll('#boardGroup [data-board]').length,
      boardMax: max,
      boardScrollable: got > 0,
      restOver: rest.scrollWidth - rest.clientWidth,
      headerH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
      pageOverflow: de.scrollWidth - de.clientWidth,
      fadeRight: strip.classList.contains('is-more-right'),
      chipBop: Math.abs(chipH - chipStyleH) > 1,
      cols: new Set(
        [...document.querySelectorAll('.tile')]
          .filter((t) => t.style.display !== 'none' && t.style.left)
          .map((t) => t.style.left)
      ).size,
    };
  });

  const pct = Math.round((r.headerH / s.h) * 100);
  const bad = [];
  if (r.chip !== slugs.length + 1) bad.push(`${r.chip} chip (phải ${slugs.length + 1})`);
  if (r.boardMax > 1 && !r.boardScrollable) bad.push('dải board không cuộn được');
  if (r.boardMax > 1 && !r.fadeRight) bad.push('thiếu fade mép phải');
  if (r.chipBop) bad.push('chip bị bóp chữ');
  if (r.pageOverflow > 0) bad.push(`trang tràn ${r.pageOverflow}px`);
  if (pct > MAX_HEADER_PCT) bad.push(`header chiếm ${pct}%`);
  if (r.cols === 0) bad.push('không có cột nào');

  console.log(
    `${s.name.padEnd(11)} ${String(s.w).padStart(4)}px  chip=${String(r.chip).padStart(2)}  ` +
      `header=${r.headerH}px (${pct}%)  cột=${r.cols}  ` +
      `dảiBoard tràn=${r.boardMax}px cuộn=${r.boardScrollable}  ` +
      (bad.length ? '⚠ ' + bad.join(' · ') : 'OK')
  );
  if (errs.length) console.log('            lỗi: ' + errs.join(' | '));

  if (bad.length) problems.push({ size: s.name, bad });
  if (errs.length) problems.push({ size: s.name, bad: errs });

  await page.screenshot({
    path: `/tmp/many-${s.name}.png`,
    clip: { x: 0, y: 0, width: s.w, height: Math.min(s.h, 340) },
  });
  await ctx.close();
}

console.log(
  '\n' + (problems.length ? `⚠ ${problems.length} vấn đề` : `✓ ${slugs.length} board: không có vấn đề nào`)
);
await browser.close();
process.exit(problems.length ? 1 : 0);
