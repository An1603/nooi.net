import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'gallery.json'), 'utf8'));

// index của ảnh rộng nhất
let best = 0;
m.items.forEach((it, i) => {
  if (it.w > m.items[best].w) best = i;
});
console.log(`Ảnh rộng nhất: #${best} ${m.items[best].w}x${m.items[best].h}`);

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

await page.screenshot({ path: '/tmp/final-grid.png' });

await page.evaluate((i) => {
  const t = document.querySelectorAll('.tile')[i];
  t.scrollIntoView({ block: 'center' });
}, best);
await page.waitForTimeout(1500);
await page.evaluate((i) => document.querySelectorAll('.tile')[i].click(), best);
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const img = document.getElementById('lbImg');
  return {
    counter: document.getElementById('lbCounter').textContent,
    natural: `${img.naturalWidth}x${img.naturalHeight}`,
    rendered: `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}`,
  };
});
console.log('LIGHTBOX:', JSON.stringify(info));

await page.screenshot({ path: '/tmp/final-lightbox.png' });
await browser.close();
