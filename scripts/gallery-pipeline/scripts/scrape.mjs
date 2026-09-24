/**
 * Scrape nhiều board Pinterest theo danh sách trong boards.json.
 *
 * Cách làm: mở board bằng Chrome thật -> có cookie + CSRF + appVersion hợp lệ,
 * rồi gọi endpoint BoardFeedResource NGAY TRONG context của trang và lặp theo
 * bookmark cho tới khi hết.
 *
 * LƯU Ý QUAN TRỌNG: endpoint này trả 403 nếu thiếu header `X-APP-VERSION` đúng
 * với build hiện tại của Pinterest. appVersion đọc từ script#__PWS_DATA__ và có
 * thể đổi bất cứ lúc nào -> luôn đọc động, đừng hardcode.
 *
 * Dùng: node scripts/scrape.mjs
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'boards.json');
const OUT = path.join(ROOT, 'data', 'pins-raw.json');

const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const BOARDS = CONFIG.boards || [];

if (!BOARDS.length) {
  console.error('boards.json chưa có board nào.');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  viewport: { width: 1440, height: 1000 },
  locale: 'en-US',
});
const page = await ctx.newPage();

const outBoards = [];
const newPins = [];

for (const b of BOARDS) {
  const url = `https://www.pinterest.com${b.path}`;
  console.log(`\n→ Board "${b.slug}"  ${url}`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(4500);

  const res = await page.evaluate(
    async ({ boardPath }) => {
      const log = [];
      const finalUrl = location.pathname;

      // Board không tồn tại / riêng tư -> Pinterest đá về /ideas/
      if (!finalUrl.toLowerCase().includes(boardPath.split('/').filter(Boolean).pop().toLowerCase().slice(0, 6))) {
        if (finalUrl.startsWith('/ideas') || finalUrl === '/') {
          return { loi: `board không tồn tại hoặc là riêng tư (bị chuyển về ${finalUrl})`, log };
        }
      }

      const dataEl = document.querySelector('script#__PWS_DATA__');
      const propsEl = document.querySelector('script#__PWS_INITIAL_PROPS__');
      if (!dataEl || !propsEl) return { loi: 'không đọc được dữ liệu trang', log };

      const appVersion = JSON.parse(dataEl.textContent).appVersion;
      const csrf = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';

      // board_id + tên board lấy động từ props
      let boardId = null;
      let boardName = null;
      try {
        const props = JSON.parse(propsEl.textContent);
        const rs = props.initialReduxState || {};
        const s = JSON.stringify(props);
        boardId = (s.match(/board_id[\\"',:\s]*(\d{6,})/) || [])[1] || null;

        // Tên board: tra trong mọi danh sách board tìm được, khớp theo id.
        // (regex trên chuỗi JSON hay trượt vì dấu " bị escape)
        const cands = [];
        Object.values(rs.boards || {}).forEach((b) => b && cands.push(b));
        const bfr = rs.resources?.BoardsFeedResource || {};
        Object.values(bfr).forEach((v) => (v?.data || []).forEach((b) => b && cands.push(b)));
        const hit = cands.find((b) => String(b.id) === String(boardId));
        if (hit?.name) boardName = hit.name;

        // Dự phòng: tiêu đề trang có dạng "190 NOOI Work ideas in 2026"
        if (!boardName) {
          const m = document.title.match(/^[\d.,Kk]+\s+(.+?)\s+ideas\b/i);
          if (m) boardName = m[1];
        }
      } catch {}

      if (!boardId) return { loi: 'không tìm thấy board_id', log, appVersion };

      const headers = {
        Accept: 'application/json, text/javascript, */*, q=0.01',
        'X-CSRFToken': csrf,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Pinterest-AppState': 'active',
        'X-Pinterest-Source-Url': boardPath,
        'X-Pinterest-PWS-Handler': 'www/[username]/[slug].js',
        'X-APP-VERSION': appVersion,
      };

      const all = [];
      const seen = new Set();
      let bookmark = null;

      for (let pageNo = 1; pageNo <= 60; pageNo++) {
        const options = {
          board_id: boardId,
          field_set_key: 'react_grid_pin',
          page_size: 25,
          prepend: false,
          redux_normalize_feed: true,
        };
        if (bookmark) options.bookmarks = [bookmark];

        const u =
          '/resource/BoardFeedResource/get/?source_url=' +
          encodeURIComponent(boardPath) +
          '&data=' +
          encodeURIComponent(JSON.stringify({ options, context: {} }));

        let json;
        try {
          // Pinterest giới hạn tần suất -> 429. Thử lại với backoff tăng dần.
          let r;
          for (let attempt = 1; attempt <= 4; attempt++) {
            r = await fetch(u, { credentials: 'include', headers });
            if (r.status === 429 || r.status >= 500) {
              if (attempt < 4) {
                log.push(`trang ${pageNo}: HTTP ${r.status}, thử lại ${attempt}/3...`);
                await new Promise((x) => setTimeout(x, 2000 * attempt));
                continue;
              }
            }
            break;
          }
          if (!r.ok) {
            log.push(`trang ${pageNo}: HTTP ${r.status} — dừng (đã lấy ${all.length} pin)`);
            break;
          }
          json = await r.json();
        } catch (e) {
          log.push(`trang ${pageNo}: lỗi ${String(e).slice(0, 100)}`);
          break;
        }

        const rr = json?.resource_response;
        const batch = rr?.data;
        if (!Array.isArray(batch) || batch.length === 0) {
          log.push(`trang ${pageNo}: hết dữ liệu`);
          break;
        }

        let fresh = 0;
        for (const p of batch) {
          if (p && p.id && p.images && !seen.has(p.id)) {
            seen.add(p.id);
            all.push(p);
            fresh++;
          }
        }
        log.push(`trang ${pageNo}: +${fresh}  (tổng ${all.length})`);

        bookmark = rr?.bookmark || null;
        if (!bookmark) {
          log.push('đã hết bookmark');
          break;
        }
        await new Promise((x) => setTimeout(x, 900)); // nghỉ giữa các trang, tránh 429
      }

      return { boardId, boardName, pins: all, log, appVersion, finalUrl };
    },
    { boardPath: b.path }
  );

  if (res.loi) {
    console.log(`  ✗ BỎ QUA: ${res.loi}`);
    outBoards.push({ ...b, error: res.loi });
    continue;
  }

  for (const line of res.log) console.log('  ' + line);

  outBoards.push({
    slug: b.slug,
    path: b.path,
    id: res.boardId,
    name: res.boardName || b.slug,
    url: url,
    pinCount: res.pins.length,
    // `hidden` trong boards.json -> board vẫn được lấy dữ liệu (để bật lại là
    // hiện ngay) nhưng bị loại khỏi manifest nên không hiện trên web.
    hidden: b.hidden === true,
  });

  for (const p of res.pins) newPins.push({ ...p, board: b.slug });

  console.log(`  ✓ ${res.pins.length} pin  (board_id=${res.boardId})`);

  await new Promise((x) => setTimeout(x, 1500)); // nghỉ giữa các board
}

await browser.close();

/* ---------- Gộp với dữ liệu cũ để không mất pin khi bị rate-limit ---------- */
let oldBoards = [];
let oldPins = [];
if (fs.existsSync(OUT)) {
  try {
    const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    if (Array.isArray(prev)) {
      // định dạng cũ (một board) -> chuyển đổi
      oldPins = prev.map((p) => ({ ...p, board: 'nooi-work' }));
    } else {
      oldBoards = prev.boards || [];
      oldPins = prev.pins || [];
    }
  } catch {}
}

const merged = new Map();
for (const p of oldPins) merged.set(`${p.board}::${p.id}`, p);
const before = merged.size;
for (const p of newPins) merged.set(`${p.board}::${p.id}`, p);

// board gộp: ưu tiên thông tin mới, giữ board cũ không chạy lần này
const boardMap = new Map();
for (const b of oldBoards) if (b && b.slug) boardMap.set(b.slug, b);
for (const b of outBoards) {
  const prev = boardMap.get(b.slug) || {};
  boardMap.set(b.slug, { ...prev, ...b });
}

const pins = [...merged.values()].sort(
  (a, b) => String(a.board).localeCompare(String(b.board)) || Number(b.id) - Number(a.id)
);

// Số pin THỰC TẾ sau khi gộp (lần chạy này có thể lấy ít hơn do Pinterest
// phân trang không ổn định — phần thiếu được giữ lại từ dữ liệu cũ).
const countByBoard = {};
for (const p of pins) countByBoard[p.board] = (countByBoard[p.board] || 0) + 1;

// Ghi lại số lấy được trong lần chạy này để so sánh, rồi mới thay bằng số thực tế
const freshByBoard = {};
for (const b of boardMap.values()) {
  if (b.error) continue;
  freshByBoard[b.slug] = b.pinCount ?? 0;
  b.pinCount = countByBoard[b.slug] || 0;
}

const out = { boards: [...boardMap.values()], pins };

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

console.log(`\n✓ ${pins.length} pin từ ${boardMap.size} board -> ${path.relative(ROOT, OUT)}`);
if (before) console.log(`  (mới thêm ${pins.length - before})`);
for (const b of boardMap.values()) {
  if (b.error) {
    console.log(`  ⚠ ${b.name || b.slug}: ${b.error}`);
    continue;
  }
  const n = countByBoard[b.slug] || 0;
  const fresh = freshByBoard[b.slug] ?? n;
  console.log(
    `  • ${b.name}: ${n} pin` +
      (fresh !== n ? `  (lần này chỉ lấy ${fresh}, phần còn lại giữ từ dữ liệu cũ)` : '')
  );
}
