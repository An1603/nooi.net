/**
 * Kiểm tra giao diện ở nhiều kích thước màn hình.
 * Trọng tâm: tràn ngang (overflow), số cột lưới, thanh lọc, lightbox.
 *
 * Dùng: node scripts/responsive.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const URL = 'http://127.0.0.1:8123/index.html';
const SHOTS = path.join(ROOT, '..', '.qa-shots');
fs.mkdirSync(SHOTS, { recursive: true });

const SIZES = [
  { name: 'iPhone-SE', w: 375, h: 667 },
  { name: 'iPhone-14', w: 390, h: 844 },
  { name: 'iPad-doc', w: 768, h: 1024 },
  { name: 'laptop', w: 1280, h: 800 },
  { name: 'desktop', w: 1680, h: 950 },
];

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const problems = [];

for (const s of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text().slice(0, 120));
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const inner = document.querySelector('.filters__inner');
    const boardScroll = document.querySelector('.filters__scroll');
    const rest = document.querySelector('.filters__rest');
    const topbar = document.querySelector('.topbar__inner');
    const grid = document.getElementById('grid');

    // đếm số cột thực tế bằng cách nhóm tile theo toạ độ left
    const lefts = new Set();
    document.querySelectorAll('.tile').forEach((t) => {
      if (t.style.display !== 'none' && t.style.left) lefts.add(t.style.left);
    });

    const over = (el) => (el ? el.scrollWidth - el.clientWidth : 0);

    return {
      overflowX: de.scrollWidth - de.clientWidth,
      boardOver: over(boardScroll),
      restOver: over(rest),
      filtersInnerH: Math.round(inner.getBoundingClientRect().height),
      topbarH: Math.round(topbar.getBoundingClientRect().height),
      gridW: grid.clientWidth,
      cols: lefts.size,
      headerH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
    };
  });

  const bad = [];
  if (r.overflowX > 0) bad.push(`tràn ngang ${r.overflowX}px`);
  if (r.cols === 0) bad.push('không có cột nào');
  if (r.headerH > s.h * 0.35) bad.push(`header chiếm ${Math.round((r.headerH / s.h) * 100)}% chiều cao`);
  // Lưu ý: dải board CỐ Ý cuộn ngang khi có nhiều board. Tràn ở đó là bình thường,
  // miễn là TRANG không tràn và vùng đó cuộn được (kiểm tra ngay bên dưới).

  console.log(
    `${s.name.padEnd(11)} ${String(s.w).padStart(4)}px  cột=${r.cols}  ` +
      `header=${r.headerH}px  lọc=${r.filtersInnerH}px  ` +
      `boardTràn=${r.boardOver}px  ` +
      (bad.length ? '⚠ ' + bad.join(' · ') : 'OK')
  );
  if (errs.length) console.log(`            lỗi console: ${errs.join(' | ')}`);

  if (bad.length) problems.push({ size: s.name, bad });
  if (errs.length) problems.push({ size: s.name, bad: errs });

  await page.screenshot({ path: path.join(SHOTS, `${s.name}-top.png`) });

  // Vùng cuộn ngang phải CUỘN được thật, không phải bị cắt cụt
  {
    const sc = await page.evaluate(() => {
      const test = (sel) => {
        const el = document.querySelector(sel);
        if (!el || el.hidden || el.offsetParent === null) return null;
        const max = el.scrollWidth - el.clientWidth;
        el.scrollLeft = 9999;
        const got = Math.round(el.scrollLeft);
        el.scrollLeft = 0;
        return { max, got };
      };
      return { board: test('.filters__scroll'), rest: test('.filters__rest') };
    });
    for (const [k, v] of Object.entries(sc)) {
      if (!v) continue;
      const ok = v.max <= 1 || v.got > 0;
      console.log(
        `            ${k.padEnd(5)}: tràn ${v.max}px, cuộn được ${v.got}px  ${ok ? 'OK' : '⚠ BỊ CẮT CỤT'}`
      );
      if (!ok) problems.push({ size: s.name, bad: [`${k} tràn nhưng không cuộn được`] });
    }
  }

  // lightbox trên màn hình nhỏ
  if (s.w < 800) {
    await page.locator('.tile').first().click();
    await page.waitForTimeout(1600);
    const lb = await page.evaluate(() => {
      const img = document.getElementById('lbImg');
      const bar = document.querySelector('.lb__bar');
      const rect = img.getBoundingClientRect();
      return {
        imgW: Math.round(rect.width),
        imgH: Math.round(rect.height),
        imgBottom: Math.round(rect.bottom),
        barTop: Math.round(bar.getBoundingClientRect().top),
        de: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    const overlap = lb.imgBottom > lb.barTop;
    console.log(
      `            lightbox: ảnh ${lb.imgW}×${lb.imgH}  đáy=${lb.imgBottom}  thanh=${lb.barTop}  ` +
        (overlap ? '⚠ ảnh đè lên thanh công cụ' : 'không đè')
    );
    if (overlap) problems.push({ size: s.name, bad: ['ảnh lightbox đè lên thanh công cụ'] });
    if (lb.de > 0) problems.push({ size: s.name, bad: [`lightbox tràn ngang ${lb.de}px`] });
    await page.screenshot({ path: path.join(SHOTS, `${s.name}-lightbox.png`) });
  }

  await ctx.close();
}

console.log('\n' + (problems.length ? `⚠ ${problems.length} vấn đề` : '✓ Không có vấn đề nào'));
console.log(`Ảnh chụp: ${SHOTS}`);
await browser.close();
