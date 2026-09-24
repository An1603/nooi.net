/**
 * Tải ảnh về máy + sinh manifest data/gallery.json (và gallery.js)
 *
 * Đọc data/pins-raw.json dạng { boards: [...], pins: [...] }.
 * Mỗi pin tải 2 cỡ:
 *   - images/thumbs/<sig>.jpg  (236px, cho lưới masonry -> nhẹ, nhanh)
 *   - images/full/<sig>.jpg    (bản gốc thu về tối đa 1600px, cho lightbox)
 *
 * Ảnh đặt tên theo image_signature (duy nhất toàn cầu) nên nhiều board dùng
 * chung một ảnh thì chỉ tải một lần, nhưng vẫn hiện ở cả hai board.
 *
 * AN TOÀN DỮ LIỆU — script KHÔNG BAO GIỜ XOÁ hàng loạt:
 *   - Ảnh thiếu -> tải bù. Ảnh đã có -> bỏ qua.
 *   - Khi cần nâng cấp ảnh lớn: tải bản mới vào images/.tmp, thu nhỏ, rồi
 *     rename đè lên đích (atomic) — ảnh cũ chỉ mất đúng lúc ảnh mới đã xong.
 *
 * Dùng: node scripts/download.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'data', 'pins-raw.json');
const THUMB_DIR = path.join(ROOT, 'images', 'thumbs');
const FULL_DIR = path.join(ROOT, 'images', 'full');
const TMP_DIR = path.join(ROOT, 'images', '.tmp');

const TARGET_LONG_EDGE = 1600;
const SOURCE_TAG = `orig@${TARGET_LONG_EDGE}`;
const CONCURRENCY = 6;

fs.mkdirSync(THUMB_DIR, { recursive: true });
fs.mkdirSync(FULL_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

// Đã nâng cấp lên nguồn này chưa? Nếu chưa thì thay thế ảnh lớn cũ.
const tagFile = path.join(FULL_DIR, '.source');
const currentTag = fs.existsSync(tagFile) ? fs.readFileSync(tagFile, 'utf8').trim() : '';
const needUpgrade = currentTag !== SOURCE_TAG;
if (needUpgrade) {
  console.log(`Nâng cấp ảnh lớn lên nguồn "${SOURCE_TAG}" (thay thế từng file, không xoá hàng loạt)...`);
}

const parsed = JSON.parse(fs.readFileSync(RAW, 'utf8'));
const rawBoards = Array.isArray(parsed) ? [] : parsed.boards || [];
const rawPins = Array.isArray(parsed) ? parsed.map((p) => ({ ...p, board: 'nooi-work' })) : parsed.pins || [];

console.log(`Đọc ${rawPins.length} pin / ${rawBoards.length} board từ ${path.relative(ROOT, RAW)}`);

function pick(images, keys) {
  for (const k of keys) if (images?.[k]?.url) return images[k];
  return null;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: 'https://www.pinterest.com/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error(`File quá nhỏ (${buf.length}B)`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function dims(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], {
    encoding: 'utf8',
  });
  return {
    w: Number((out.match(/pixelWidth:\s*(\d+)/) || [])[1]),
    h: Number((out.match(/pixelHeight:\s*(\d+)/) || [])[1]),
  };
}

/** File có thật sự là JPEG không (đọc magic bytes, không tin phần mở rộng) */
function isJpeg(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const b = Buffer.alloc(3);
    fs.readSync(fd, b, 0, 3, 0);
    return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Chuẩn hoá ảnh vừa tải: thu nhỏ nếu quá cỡ, và chuyển về JPEG nếu cần.
 *
 * Pinterest có lúc trả **WebP dù URL kết thúc bằng `.jpg`**. `sips -Z` chỉ sửa
 * được định dạng mà nó ĐỌC được — gặp WebP là lỗi, và lỗi đó từng làm 4 ảnh bị
 * loại khỏi thư viện. WebP chuyển được sang JPEG bằng `-s format jpeg`.
 *
 * Trả về: 'shrunk' | 'kept' | 'converted' | 'converted+shrunk' | 'loi'
 */
function normalize(tmp) {
  const d0 = dims(tmp);
  const needShrink = Math.max(d0.w, d0.h) > TARGET_LONG_EDGE;

  if (isJpeg(tmp)) {
    if (!needShrink) return 'kept';
    execFileSync('sips', ['-Z', String(TARGET_LONG_EDGE), tmp], { stdio: 'ignore' });
    return 'shrunk';
  }

  // Không phải JPEG (thường là WebP) -> chuyển định dạng, kèm thu nhỏ nếu cần
  const out = tmp.replace(/\.jpg$/i, '') + '.conv.jpg';
  const args = ['-s', 'format', 'jpeg'];
  if (needShrink) args.push('-Z', String(TARGET_LONG_EDGE));
  execFileSync('sips', [...args, tmp, '--out', out], { stdio: 'ignore' });
  fs.renameSync(out, tmp);
  return needShrink ? 'converted+shrunk' : 'converted';
}

const items = [];
// Khử trùng theo (board, signature): cùng ảnh ở 2 board vẫn hiện ở cả hai,
// nhưng cùng ảnh lặp trong 1 board thì gộp.
const usedKey = new Set();
const queue = [];
let dupes = 0;

for (const pin of rawPins) {
  if (!pin.images || Object.keys(pin.images).length === 0) continue;

  const orig = pick(pin.images, ['orig', '736x', '474x', '236x']);
  const thumb = pick(pin.images, ['236x', '474x', '736x', 'orig']);
  if (!orig || !thumb) continue;

  const sig = pin.image_signature || pin.id;
  const key = `${pin.board}::${sig}`;
  if (usedKey.has(key)) {
    dupes++;
    continue;
  }
  usedKey.add(key);

  items.push({
    id: pin.id,
    board: pin.board || 'nooi-work',
    w: 0,
    h: 0,
    color: pin.dominant_color || '#e5e7eb',
    full: `images/full/${sig}.jpg`,
    thumb: `images/thumbs/${sig}.jpg`,
    pin: `https://www.pinterest.com/pin/${pin.id}/`,
  });

  queue.push({ url: thumb.url, dest: path.join(THUMB_DIR, `${sig}.jpg`), hd: false });
  queue.push({ url: orig.url, dest: path.join(FULL_DIR, `${sig}.jpg`), hd: true });
}

console.log(`Xử lý ${queue.length} file (${items.length} ảnh × 2 cỡ), concurrency ${CONCURRENCY}...`);

let done = 0;
let fetched = 0;
let replaced = 0;
let keptSmall = 0;
let shrunk = 0;
let converted = 0;
let loiAnh = [];

async function worker() {
  while (queue.length) {
    const job = queue.shift();
    try {
      const exists = fs.existsSync(job.dest) && fs.statSync(job.dest).size > 0;

      // Đã có ảnh và không cần nâng cấp nguồn -> bỏ qua
      if (exists && !(job.hd && needUpgrade)) {
        done++;
        continue;
      }

      if (job.hd) {
        // Ảnh lớn: LUÔN tải qua .tmp -> chuẩn hoá -> rename đè (atomic).
        // Phải chuẩn hoá ở CẢ đường tải-bù, không riêng đường nâng cấp: nếu chỉ
        // xử lý khi nâng cấp thì ảnh tải bù sẽ giữ nguyên cỡ gốc và vượt quá
        // TARGET_LONG_EDGE (đã từng xảy ra với 7 ảnh).
        const tmp = path.join(TMP_DIR, path.basename(job.dest));
        await download(job.url, tmp);

        // Nếu chuẩn hoá lỗi thì VẪN dùng file gốc — thà có ảnh hơi nặng còn hơn
        // mất ảnh. Trình duyệt tự nhận định dạng thật nên vẫn hiển thị được.
        let kq = 'loi';
        try {
          kq = normalize(tmp);
        } catch (e) {
          loiAnh.push(path.basename(job.dest) + ': ' + e.message.slice(0, 60));
        }

        if (kq === 'shrunk') shrunk++;
        else if (kq === 'kept') keptSmall++;
        else if (kq.startsWith('converted')) {
          converted++;
          if (kq.endsWith('shrunk')) shrunk++;
        }

        fs.renameSync(tmp, job.dest);
        if (needUpgrade) replaced++;
        else fetched++;
      } else {
        await download(job.url, job.dest);
        fetched++;
      }

      done++;
      if (done % 100 === 0 || done === queue.length) {
        console.log(`  ${done}/${queue.length} file  (tải mới ${fetched}, thay thế ${replaced})`);
      }
    } catch (e) {
      console.error(`  ✗ ${path.basename(job.dest)}: ${e.message}`);
      done++;
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (needUpgrade) fs.writeFileSync(tagFile, SOURCE_TAG);

/* ---------- Sửa ảnh lớn vượt cỡ / sai định dạng ----------
   Ảnh tải bù ở các lần chạy trước không đi qua bước chuẩn hoá nên có thể còn
   file > 1600px, hoặc là WebP đội lốt .jpg. Quét lại và xử lý TẠI CHỖ — không
   tải lại, không xoá. */
let repaired = 0;
for (const it of items) {
  const p = path.join(ROOT, it.full);
  if (!fs.existsSync(p)) continue;

  const d = dims(p);
  const overSized = Math.max(d.w, d.h) > TARGET_LONG_EDGE;
  const wrongFormat = !isJpeg(p);
  if (!overSized && !wrongFormat) continue;

  const tmp = path.join(TMP_DIR, path.basename(p));
  fs.copyFileSync(p, tmp);
  try {
    normalize(tmp);
    const d2 = dims(tmp);
    // Chỉ ghi đè khi thật sự tốt hơn, tránh làm hỏng ảnh
    if (isJpeg(tmp) && Math.max(d2.w, d2.h) <= Math.max(d.w, d.h)) {
      fs.renameSync(tmp, p);
      repaired++;
    } else {
      fs.rmSync(tmp, { force: true });
    }
  } catch {
    fs.rmSync(tmp, { force: true });
  }
}
if (repaired) console.log(`• Sửa ${repaired} ảnh (quá cỡ hoặc sai định dạng).`);

// Đọc kích thước thật của ảnh lớn để manifest khớp với file trên đĩa
for (const it of items) {
  const p = path.join(ROOT, it.full);
  if (fs.existsSync(p)) {
    const { w, h } = dims(p);
    it.w = w;
    it.h = h;
  }
}

const valid = items.filter(
  (it) =>
    fs.existsSync(path.join(ROOT, it.full)) && fs.existsSync(path.join(ROOT, it.thumb))
);

/* ---------- Board bị ẩn: vẫn tải ảnh về đĩa, nhưng không vào thư viện ----------
   `hidden: true` trong boards.json = tạm giấu board khỏi web. Ảnh vẫn nằm trên
   máy nên bỏ cờ là board hiện lại ngay, không phải scrape/tải lại. */
const hiddenSlugs = new Set(rawBoards.filter((b) => b.hidden).map((b) => b.slug));
const visible = valid.filter((it) => !hiddenSlugs.has(it.board));
if (hiddenSlugs.size) {
  const ten = rawBoards.filter((b) => b.hidden).map((b) => b.name || b.slug);
  console.log(`• Ẩn ${hiddenSlugs.size} board khỏi thư viện: ${ten.join(', ')}`);
}

// Chỉ giữ board thật sự có ảnh
const boards = rawBoards
  .map((b) => ({
    slug: b.slug,
    name: b.name || b.slug,
    url: b.url || '',
    id: b.id || null,
    error: b.error || null,
  }))
  .filter((b) => !b.error && visible.some((it) => it.board === b.slug));

// Board có ảnh nhưng không nằm trong danh sách (VD dữ liệu cũ) -> vẫn thêm vào
for (const slug of new Set(visible.map((it) => it.board))) {
  if (!boards.some((b) => b.slug === slug)) {
    boards.push({ slug, name: slug, url: '', id: null, error: null });
  }
}

const manifest = {
  boards: boards.map((b) => ({ ...b, count: visible.filter((it) => it.board === b.slug).length })),
  total: visible.length,
  scrapedAt: new Date().toISOString(),
  items: visible,
};

fs.writeFileSync(path.join(ROOT, 'data', 'gallery.json'), JSON.stringify(manifest, null, 2));

// Bản JS song song với JSON: khi mở index.html trực tiếp bằng file://,
// trình duyệt chặn fetch() đọc JSON, nhưng thẻ <script> thì vẫn nạp được.
fs.writeFileSync(
  path.join(ROOT, 'data', 'gallery.js'),
  `window.__NOOI_GALLERY__ = ${JSON.stringify(manifest)};\n`
);

// Cùng một ảnh ghim ở 2 board = 2 item nhưng CHỈ 1 file trên đĩa, nên phải khử
// trùng theo đường dẫn trước khi cộng dung lượng, nếu không sẽ báo thừa.
const uniqueFiles = [
  ...new Set(visible.flatMap((it) => [path.join(ROOT, it.full), path.join(ROOT, it.thumb)])),
];
const totalBytes = uniqueFiles.reduce((s, p) => s + fs.statSync(p).size, 0);

console.log(`\n✓ ${visible.length} ảnh sẵn sàng  •  tổng ${(totalBytes / 1e6).toFixed(1)} MB`);
console.log(`  (${uniqueFiles.length / 2} file trên đĩa — ảnh dùng chung giữa các board chỉ lưu một lần)`);
for (const b of manifest.boards) {
  console.log(`  • ${b.name}: ${b.count} ảnh`);
}
if (replaced) console.log(`• Đã thay thế ${replaced} ảnh lớn.`);
if (shrunk) console.log(`• Thu nhỏ ${shrunk} ảnh mới tải về về ${TARGET_LONG_EDGE}px.`);
if (keptSmall) console.log(`• Giữ nguyên ${keptSmall} ảnh gốc vốn đã nhỏ hơn ${TARGET_LONG_EDGE}px.`);
if (converted) console.log(`• Chuyển ${converted} ảnh không phải JPEG (WebP) sang JPEG.`);
if (dupes) console.log(`• Đã gộp ${dupes} pin trùng ảnh trong cùng board.`);
if (valid.length < items.length) {
  console.log(`⚠ ${items.length - valid.length} ảnh vẫn thiếu — chạy lại script để tải bù.`);
}
