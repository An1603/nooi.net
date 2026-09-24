/**
 * Sinh asset logo cho thư viện ảnh từ bộ nhận diện NOOI.
 *
 * Vì sao cần script này thay vì dùng file gốc:
 *  - File gốc 1630×1630 nhưng phần hình chỉ chiếm giữa, thừa nhiều lề trong suốt
 *    -> phải cắt sát nội dung (alpha bounding box) rồi mới đưa vào web.
 *  - `Nooi_icon_c.png` / `Nooi_icon_w_c.png` có một VÒNG TRÒN mờ (alpha ~50%) phía
 *    sau ký hiệu. Đưa thẳng vào web thì trên nền sáng vòng tròn gần như tàng hình,
 *    trên nền tối lại thành một đĩa sáng — hai chế độ nhìn khác hẳn nhau. Nên phải
 *    tách ký hiệu ra khỏi vòng tròn (trừ nền theo alpha).
 *  - `Nooi_Logo_iconNew_w.png` là bản TRẮNG, chỉ dùng được trên nền tối. Trang có
 *    cả chế độ sáng và tối nên cần cả bản màu lẫn bản trắng.
 *
 * Dùng: node scripts/logo-assets.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = '/Users/nguyenan/Desktop/MEDIA/NOOi_Brand/OK_New_icon';
const OUT_DIR = path.join(ROOT, 'assets');

fs.mkdirSync(OUT_DIR, { recursive: true });

const SRC = {
  markColor: path.join(SRC_DIR, 'Nooi_icon_c.png'), // ký hiệu trong vòng tròn mờ
  markWhite: path.join(SRC_DIR, 'Nooi_icon_w_c.png'), // ký hiệu trắng trong vòng tròn mờ
  lockup: path.join(SRC_DIR, 'Nooi_Logo_iconNew.png'), // logo + tagline, màu
  lockupWhite: path.join(SRC_DIR, 'Nooi_Logo_iconNew_w.png'), // logo + tagline, trắng
};

for (const [k, p] of Object.entries(SRC)) {
  if (!fs.existsSync(p)) throw new Error(`Không thấy file nguồn "${k}": ${p}`);
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage();
await page.goto('about:blank');

// about:blank không nạp được ảnh file:// (khác origin) -> nhúng base64.
const toDataUrl = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');

const results = await page.evaluate(
  async ({ srcMarkColor, srcMarkWhite, srcLockup, srcLockupWhite }) => {
    const load = async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    };

    const canvasOf = (img) => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c;
    };

    /** Hộp bao quanh phần tử có alpha > 8 */
    const contentBox = (c) => {
      const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
      let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          if (data[(y * c.width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) throw new Error('ảnh trống');
      return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    };

    /**
     * Tách ký hiệu khỏi vòng tròn mờ phía sau.
     * Vòng tròn là một lớp alpha đồng nhất (không đổi màu nền). Tìm alpha phổ biến
     * nhất dưới 250 -> đó là alpha của vòng tròn (b), rồi nén dải alpha lại:
     *   a_moi = (a - b) / (255 - b)
     * Nhờ vậy vòng tròn về 0, ký hiệu giữ nguyên 1, và viền răng cưa vẫn mượt.
     */
    const stripBadge = (c) => {
      const ctx = c.getContext('2d', { willReadFrequently: true });
      const id = ctx.getImageData(0, 0, c.width, c.height);
      const d = id.data;

      const hist = new Array(256).fill(0);
      for (let i = 3; i < d.length; i += 4) hist[d[i]]++;
      let bgA = 0, best = 0;
      for (let a = 1; a < 250; a++) {
        if (hist[a] > best) { best = hist[a]; bgA = a; }
      }

      const span = 255 - bgA || 1;
      for (let i = 3; i < d.length; i += 4) {
        const a = d[i];
        d[i] = a <= bgA ? 0 : Math.round(((a - bgA) / span) * 255);
      }
      ctx.putImageData(id, 0, 0);
      return { canvas: c, bgAlpha: bgA, soPixelNen: best };
    };

    /** Cắt sát nội dung rồi vẽ vừa khít vào canvas đích (giữ tỉ lệ) */
    const fit = (srcCanvas, opts) => {
      const box = contentBox(srcCanvas);
      const out = document.createElement('canvas');
      out.width = opts.w;
      out.height = opts.h;
      const ctx = out.getContext('2d');

      if (opts.bg) {
        ctx.fillStyle = opts.bg;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(0, 0, opts.w, opts.h, opts.radius || 0);
        else ctx.rect(0, 0, opts.w, opts.h);
        ctx.fill();
      }

      const pad = opts.pad || 0;
      const scale = Math.min((opts.w - pad * 2) / box.w, (opts.h - pad * 2) / box.h);
      const dw = box.w * scale;
      const dh = box.h * scale;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(srcCanvas, box.x, box.y, box.w, box.h, (opts.w - dw) / 2, (opts.h - dh) / 2, dw, dh);

      return { url: out.toDataURL('image/png'), box, out: { w: opts.w, h: opts.h } };
    };

    const report = {};

    /** Màu đặc trưng nhất của ký hiệu (bỏ qua pixel gần trong suốt) */
    const dominant = (c) => {
      const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
      const tally = new Map();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 200) continue;
        const k = (data[i] >> 3) + ',' + (data[i + 1] >> 3) + ',' + (data[i + 2] >> 3);
        tally.set(k, (tally.get(k) || 0) + 1);
      }
      let bestK = null, bestN = 0;
      for (const [k, n] of tally) if (n > bestN) { bestN = n; bestK = k; }
      const [r, g, b] = bestK.split(',').map((v) => Number(v) * 8 + 4);
      return '#' + [r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('');
    };

    // --- Ký hiệu (đã tách vòng tròn) ---
    const mc = stripBadge(canvasOf(await load(srcMarkColor)));
    report.markBgAlpha = mc.bgAlpha;
    report.mauThuongHieu = dominant(mc.canvas);
    const mark = fit(mc.canvas, { w: 256, h: 256, pad: 8 });
    report.markBox = mark.box;

    const mw = stripBadge(canvasOf(await load(srcMarkWhite)));
    report.markWhiteBgAlpha = mw.bgAlpha;
    const markWhite = fit(mw.canvas, { w: 256, h: 256, pad: 8 });

    // --- Logo đầy đủ (nền trong suốt sẵn, chỉ cắt + thu) ---
    const lg = fit(canvasOf(await load(srcLockup)), { w: 640, h: 320 });
    report.lockupBox = lg.box;
    const lgW = fit(canvasOf(await load(srcLockupWhite)), { w: 640, h: 320 });

    // --- Logo khoá ngang cho thanh trên ---
    // Tỉ lệ nội dung thật là 1386×577 ≈ 2.40:1. Canvas 640×320 (2:1) ở trên bị
    // letterbox nên thừa lề trên/dưới; bản này dùng đúng tỉ lệ để khối logo trong
    // header không bị đội thêm khoảng trong suốt.
    const hd = fit(canvasOf(await load(srcLockup)), { w: 560, h: 233 });
    const hdW = fit(canvasOf(await load(srcLockupWhite)), { w: 560, h: 233 });

    // --- Favicon: nền TÍM ĐẶC + ký hiệu trắng ---
    // Nền sáng (#fafaf9) gần như tàng hình trên thanh tab sáng; nền tím đặc thì
    // hiện rõ trên cả tab sáng lẫn tối, lại đúng màu thương hiệu.
    const purple = report.mauThuongHieu;
    const fav = fit(mw.canvas, { w: 96, h: 96, pad: 22, bg: purple, radius: 22 });
    const touch = fit(mw.canvas, { w: 180, h: 180, pad: 40, bg: purple, radius: 0 });

    return {
      report,
      files: {
        'nooi-mark.png': mark.url,
        'nooi-mark-white.png': markWhite.url,
        'nooi-logo.png': lg.url,
        'nooi-logo-white.png': lgW.url,
        'nooi-header.png': hd.url,
        'nooi-header-white.png': hdW.url,
        'favicon.png': fav.url,
        'apple-touch-icon.png': touch.url,
      },
    };
  },
  {
    srcMarkColor: toDataUrl(SRC.markColor),
    srcMarkWhite: toDataUrl(SRC.markWhite),
    srcLockup: toDataUrl(SRC.lockup),
    srcLockupWhite: toDataUrl(SRC.lockupWhite),
  }
);

console.log('Sinh asset logo vào assets/ …\n');
const r = results.report;
console.log(`  màu thương hiệu           : ${r.mauThuongHieu}`);
console.log(`  vòng tròn nền (icon màu) : alpha ≈ ${r.markBgAlpha}`);
console.log(`  vòng tròn nền (icon trắng): alpha ≈ ${r.markWhiteBgAlpha}`);
console.log(`  nội dung ký hiệu          : ${r.markBox.w}×${r.markBox.h}`);
console.log(`  nội dung logo             : ${r.lockupBox.w}×${r.lockupBox.h}\n`);

for (const [name, dataUrl] of Object.entries(results.files)) {
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log(`  ✓ ${name.padEnd(24)} ${(buf.length / 1024).toFixed(1)} KB`);
}

await browser.close();
console.log('\nXong. Nguồn:', SRC_DIR);
