/**
 * Soi một board Pinterest: có tồn tại không, tên gì, bao nhiêu pin, board_id nào.
 * Dùng để kiểm tra trước khi thêm board mới vào thư viện.
 *
 * Dùng:
 *   node scripts/board-info.mjs https://www.pinterest.com/NOOI_Net/c%C3%A1p-ray/
 *   node scripts/board-info.mjs --user NOOI_Net        (liệt kê mọi board của user)
 */
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const listUser = args[0] === '--user' ? args[1] : null;
const boardUrl = !listUser && args[0] ? args[0] : null;

if (!listUser && !boardUrl) {
  console.error('Dùng: node scripts/board-info.mjs <board-url>  |  --user <username>');
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

/* ---------- liệt kê board của user ---------- */
if (listUser) {
  await page.goto(`https://www.pinterest.com/${listUser}/`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await page.waitForTimeout(5000);

  const info = await page.evaluate(() => {
    const el = document.querySelector('script#__PWS_INITIAL_PROPS__');
    if (!el) return { error: 'không thấy __PWS_INITIAL_PROPS__' };
    const d = JSON.parse(el.textContent);
    const rs = d.initialReduxState || {};

    const boards = [];
    const seen = new Set();
    const push = (b) => {
      // BoardsFeedResource còn trả cả "story" (tính năng tin tạm thời của
      // Pinterest) — chúng có id nhưng không phải board, phải loại ra.
      if (!b || !b.id || b.type !== 'board') return;
      if (seen.has(b.id)) return;
      seen.add(b.id);
      boards.push({ id: b.id, name: b.name, url: b.url, pins: b.pin_count });
    };

    Object.values(rs.boards || {}).forEach(push);
    const bfr = rs.resources?.BoardsFeedResource || {};
    Object.values(bfr).forEach((v) => (v?.data || []).forEach(push));

    // bookmark -> biết còn board chưa tải hết hay không
    const bookmarks = Object.values(bfr)
      .map((v) => v?.bookmark)
      .filter(Boolean);

    return { boards, conThem: bookmarks.length > 0, title: document.title };
  });

  console.log(`User: ${listUser}`);
  console.log(`Tiêu đề: ${info.title}`);
  if (info.error) console.log('Lỗi:', info.error);
  console.log(`\nTìm thấy ${info.boards.length} board:`);
  for (const b of info.boards) {
    console.log(`  • ${String(b.name).padEnd(20)} ${String(b.pins ?? '?').padStart(4)} pin  ${b.url}`);
    console.log(`      board_id = ${b.id}`);
  }
  if (info.conThem) console.log('\n⚠ Còn board chưa tải hết (có bookmark) — cần phân trang.');
  await browser.close();
  process.exit(0);
}

/* ---------- soi một board ---------- */
await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForTimeout(6000);

const r = await page.evaluate(() => {
  const el = document.querySelector('script#__PWS_INITIAL_PROPS__');
  let board = null;
  let nguon = 'props';

  if (el) {
    try {
      const d = JSON.parse(el.textContent);
      const rs = d.initialReduxState || {};
      const all = Object.values(rs.boards || {}).filter((b) => b && b.type === 'board');
      const bfr = rs.resources?.BoardsFeedResource || {};
      Object.values(bfr).forEach((v) =>
        (v?.data || []).forEach((x) => x && x.type === 'board' && all.push(x))
      );
      board = all.find((b) => b && b.id && b.pin_count != null) || all[0] || null;
    } catch {}
  }

  // dự phòng: đọc từ DOM
  if (!board) {
    const h = document.querySelector('h1, [data-test-id="board-title"]');
    const m = document.body.innerText.match(/([\d.,Kk]+)\s*Pins?/i);
    if (h || m) {
      board = { name: h?.textContent?.trim() || null, pin_count: m ? m[1] : null, id: null };
      nguon = 'DOM';
    }
  }

  return {
    url: location.href,
    title: document.title,
    board,
    nguon,
    soAnh: document.querySelectorAll('img').length,
    thanTrang: document.body.innerText.replace(/\s+/g, ' ').slice(0, 220),
  };
});

console.log(`URL      : ${r.url}`);
console.log(`Tiêu đề  : ${r.title}`);
console.log(`Số ảnh   : ${r.soAnh}`);
console.log(`Nguồn    : ${r.nguon}`);
if (r.board) {
  console.log(`Board    : ${r.board.name}  |  ${r.board.pin_count ?? '?'} pin  |  id=${r.board.id ?? '?'}`);
} else {
  console.log('Board    : KHÔNG TÌM THẤY');
}
console.log(`Nội dung : ${r.thanTrang}`);

await browser.close();
