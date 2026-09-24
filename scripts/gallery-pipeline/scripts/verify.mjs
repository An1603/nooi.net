import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gallery.json'), 'utf8'));
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'boards.json'), 'utf8'));
const HIDDEN = CFG.boards.filter((b) => b.hidden).map((b) => b.slug);

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const errors = [];

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e)));
  return page;
}

const countText = (page) => page.evaluate(() => document.getElementById('filterCount').textContent);
const visibleTiles = (page) =>
  page.evaluate(
    () => [...document.querySelectorAll('.tile')].filter((t) => t.style.display !== 'none').length
  );

async function check(page, label, expect) {
  const n = await visibleTiles(page);
  const ok = n === expect;
  console.log(`  ${label} -> ${n} ${ok ? 'OK' : '*** MONG ĐỢI ' + expect}`);
  if (!ok) errors.push(`LỌC SAI: ${label} = ${n}, mong đợi ${expect}`);
  return n;
}

/* ================= 1. Qua server ================= */
console.log('=== QUA SERVER ===');
{
  const page = await newPage();
  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const total = MANIFEST.items.length;
  const nTiles = await page.evaluate(() => document.querySelectorAll('.tile').length);
  console.log('tiles:', nTiles, nTiles === total ? 'OK' : `*** MONG ĐỢI ${total}`);
  if (nTiles !== total) errors.push(`SỐ TILE SAI: ${nTiles} != ${total}`);
  console.log('count ban đầu:', await countText(page));
  console.log('brandMeta:', await page.evaluate(() => document.getElementById('brandMeta').textContent));

  /* ---- Nhóm lọc theo board ---- */
  console.log('\n--- Nhóm lọc theo board ---');
  const chips = await page.evaluate(() =>
    [...document.querySelectorAll('#boardGroup [data-board]')].map((b) => ({
      slug: b.dataset.board,
      text: b.textContent.trim(),
      active: b.classList.contains('is-active'),
    }))
  );
  console.log('  chip:', JSON.stringify(chips));
  if (chips.length !== MANIFEST.boards.length + 1) {
    errors.push(`SỐ CHIP BOARD SAI: ${chips.length} != ${MANIFEST.boards.length + 1}`);
  }
  if (!chips[0] || !chips[0].active) errors.push('CHIP "MỌI BOARD" KHÔNG Ở TRẠNG THÁI ACTIVE');

  const groupVisible = await page.evaluate(() => {
    const g = document.getElementById('boardGroup');
    const s = document.getElementById('boardSep');
    return { group: g.offsetParent !== null, sep: s.offsetParent !== null };
  });
  console.log('  nhóm board hiện:', groupVisible.group, '| dấu phân cách hiện:', groupVisible.sep);
  if (!groupVisible.group || !groupVisible.sep) {
    errors.push('NHÓM BOARD / DẤU PHÂN CÁCH BỊ ẨN SAI (đang có >= 2 board)');
  }

  // Số trên mỗi chip phải khớp manifest
  for (const b of MANIFEST.boards) {
    const want = MANIFEST.items.filter((it) => it.board === b.slug).length;
    const chip = chips.find((c) => c.slug === b.slug);
    const got = chip ? Number((chip.text.match(/([\d.,]+)\s*$/) || [])[1]?.replace(/\./g, '')) : NaN;
    console.log(`  chip "${b.name}" ghi ${got}, thực tế ${want}`, got === want ? 'OK' : '*** LỆCH');
    if (got !== want) errors.push(`SỐ TRÊN CHIP BOARD "${b.name}" SAI: ${got} != ${want}`);
  }

  // Dải board phải cuộn được khi có nhiều board — nếu không thì chip cuối bị
  // cắt cụt và người dùng không bấm tới được.
  const strip = await page.evaluate(() => {
    const el = document.getElementById('boardScroll');
    const max = el.scrollWidth - el.clientWidth;
    el.scrollLeft = 9999;
    const got = Math.round(el.scrollLeft);
    el.scrollLeft = 0;
    return { max, got, chip: document.querySelectorAll('#boardGroup [data-board]').length };
  });
  console.log(
    `  dải board: ${strip.chip} chip, tràn ${strip.max}px, cuộn được ${strip.got}px`
  );
  if (strip.max > 1 && strip.got === 0) errors.push('DẢI BOARD TRÀN NHƯNG KHÔNG CUỘN ĐƯỢC');

  // Bấm từng chip board
  for (const b of MANIFEST.boards) {
    await page.click(`#boardGroup [data-board="${b.slug}"]`);
    await page.waitForTimeout(350);
    const want = MANIFEST.items.filter((it) => it.board === b.slug).length;
    await check(page, `board="${b.slug}"`, want);

    // chip vừa bấm phải là chip duy nhất active
    const nActive = await page.evaluate(
      () => document.querySelectorAll('#boardGroup [data-board].is-active').length
    );
    if (nActive !== 1) errors.push(`CÓ ${nActive} CHIP BOARD ACTIVE CÙNG LÚC (phải là 1)`);
  }
  await page.click('#boardGroup [data-board="all"]');
  await page.waitForTimeout(350);
  await check(page, 'board="all"', total);

  /* ---- Lọc theo hướng ---- */
  console.log('\n--- Lọc theo hướng ---');
  const orientOf = (it) => (it.h > it.w ? 'doc' : it.h === it.w ? 'vuong' : 'ngang');
  for (const key of ['doc', 'ngang', 'vuong']) {
    await page.click(`#filters [data-orient="${key}"]`);
    await page.waitForTimeout(350);
    await check(page, `orient="${key}"`, MANIFEST.items.filter((it) => orientOf(it) === key).length);
  }
  await page.click('#filters [data-orient="all"]');
  await page.waitForTimeout(350);
  await check(page, 'orient="all"', total);

  /* ---- Lọc theo tông màu ---- */
  console.log('\n--- Lọc theo tông màu ---');
  // Lấy đúng số mà trang tự tính, thay vì chép lại công thức phân loại
  const toneCounts = await page.evaluate(() => {
    const out = {};
    for (const key of ['am', 'la', 'duong', 'trungtinh']) {
      document.querySelector(`#filters [data-color="${key}"]`).click();
      out[key] = [...document.querySelectorAll('.tile')].filter((t) => t.style.display !== 'none').length;
    }
    document.querySelector('#filters [data-color="all"]').click();
    return out;
  });
  let sum = 0;
  for (const [k, v] of Object.entries(toneCounts)) {
    console.log(`  color="${k}" -> ${v}`);
    sum += v;
  }
  if (sum !== total) errors.push(`TỔNG CÁC TÔNG MÀU KHÔNG KHỚP: ${sum} != ${total}`);
  else console.log(`  tổng 4 tông = ${sum} = tổng ảnh OK`);

  /* ---- Kết hợp board + hướng ---- */
  console.log('\n--- Kết hợp board + hướng ---');
  const small = MANIFEST.boards
    .map((b) => ({ b, n: MANIFEST.items.filter((it) => it.board === b.slug).length }))
    .sort((a, x) => a.n - x.n)[0];
  const smallDoc = MANIFEST.items.filter(
    (it) => it.board === small.b.slug && orientOf(it) === 'doc'
  ).length;
  await page.click(`#boardGroup [data-board="${small.b.slug}"]`);
  await page.click('#filters [data-orient="doc"]');
  await page.waitForTimeout(400);
  await check(page, `board="${small.b.slug}" + orient="doc"`, smallDoc);

  /* ---- Tổ hợp ra 0 kết quả -> phải hiện thông báo ----
     ĐỪNG hardcode một tổ hợp "chắc chắn rỗng": thư viện lớn dần là tổ hợp đó có
     ảnh trở lại và test báo lỗi sai. Thay vào đó tự DÒ một tổ hợp rỗng ngay trên
     trang (applyFilter chạy đồng bộ nên dò được trong một lần evaluate). */
  console.log('\n--- Tổ hợp 0 kết quả ---');
  const emptyCombo = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const boardKeys = [...document.querySelectorAll('#boardGroup [data-board]')].map(
      (b) => b.dataset.board
    );
    const orients = ['doc', 'ngang', 'vuong'];
    const colors = ['am', 'la', 'duong', 'trungtinh'];
    const vis = () =>
      [...document.querySelectorAll('.tile')].filter((t) => t.style.display !== 'none').length;

    const setBoard = (k) => q(`#boardGroup [data-board="${k}"]`).click();
    const setOrient = (k) => q(`#filters [data-orient="${k}"]`).click();
    const setColor = (k) => q(`#filters [data-color="${k}"]`).click();

    setOrient('all');
    setColor('all');
    for (const b of boardKeys) {
      setBoard(b);
      for (const o of orients) {
        setOrient(o);
        for (const c of colors) {
          setColor(c);
          if (vis() === 0) return { b, o, c };
        }
        setColor('all');
      }
      setOrient('all');
    }
    return null;
  });

  if (!emptyCombo) {
    errors.push('KHÔNG DÒ ĐƯỢC TỔ HỢP RỖNG — không kiểm tra được trạng thái "không có ảnh"');
  } else {
    await page.waitForTimeout(350);
    const empty = await page.evaluate(() => {
      const el = document.getElementById('empty');
      return {
        hidden: el.hidden,
        hien: el.offsetParent !== null,
        msg: document.getElementById('emptyMsg').textContent,
        tiles: [...document.querySelectorAll('.tile')].filter((t) => t.style.display !== 'none')
          .length,
      };
    });
    console.log(
      `  tổ hợp rỗng: board="${emptyCombo.b}" orient="${emptyCombo.o}" color="${emptyCombo.c}"`
    );
    console.log(`  hiện thông báo: ${empty.hien} ("${empty.msg}")`);
    if (!empty.hien || empty.hidden) errors.push('TỔ HỢP 0 KẾT QUẢ NHƯNG KHÔNG HIỆN THÔNG BÁO');
    if (!/khớp bộ lọc/i.test(empty.msg)) {
      errors.push(`THÔNG BÁO RỖNG SAI NỘI DUNG: "${empty.msg}"`);
    }
    await page.screenshot({ path: '/tmp/v-empty.png' });
  }

  await page.click('#boardGroup [data-board="all"]');
  await page.click('#filters [data-orient="all"]');
  await page.click('#filters [data-color="all"]');
  await page.waitForTimeout(450);
  const emptyHidden = await page.evaluate(() => document.getElementById('empty').hidden);
  if (!emptyHidden) errors.push('CHỌN LẠI BỘ LỌC NHƯNG THÔNG BÁO RỖNG VẪN HIỆN');
  console.log('  reset ->', await countText(page));
  await check(page, 'reset', total);

  /* ---- Lightbox ---- */
  console.log('\n--- Lightbox ---');
  await page.locator('.tile').first().click();
  await page.waitForTimeout(1800);
  const lb = await page.evaluate(() => ({
    open: !document.getElementById('lb').hidden,
    counter: document.getElementById('lbCounter').textContent,
    conPin: !!document.getElementById('lbPin'),
    conTaiAnh: !!document.getElementById('lbDl'),
    soNutTrongThanh: document.querySelectorAll('.lb__tools > *').length,
  }));
  console.log('lightbox:', JSON.stringify(lb));
  if (lb.conPin || lb.conTaiAnh) errors.push('VẪN CÒN NÚT PINTEREST / TẢI ẢNH TRONG LIGHTBOX');
  if (lb.soNutTrongThanh !== 1) errors.push(`THANH LIGHTBOX CÓ ${lb.soNutTrongThanh} NÚT (phải là 1)`);
  if (!lb.counter.includes('/')) errors.push('BỘ ĐẾM LIGHTBOX TRỐNG');
  await page.screenshot({ path: '/tmp/v-lb.png' });

  // Lọc khi đang mở lightbox -> phải tự đóng.
  // Lightbox là modal nên backdrop chặn click chuột; gọi click bằng JS để
  // kiểm tra lớp bảo vệ bên trong.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.locator('.tile').first().click();
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector('#filters [data-orient="ngang"]').click());
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => document.getElementById('lb').hidden);
  console.log('lọc khi đang mở lightbox -> tự đóng:', closed);
  if (!closed) errors.push('LỌC KHI ĐANG MỞ LIGHTBOX NHƯNG KHÔNG TỰ ĐÓNG');

  await page.click('#filters [data-orient="all"]');
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/v-top.png' });

  /* ---- Tiếp cận bằng bàn phím ---- */
  console.log('\n--- Tiếp cận bàn phím ---');
  const a11y = await page.evaluate(() => {
    const t = document.querySelector('.tile');
    t.focus();
    return {
      tag: t.tagName,
      focusable: document.activeElement === t,
      role: t.getAttribute('role'),
      tabindex: t.getAttribute('tabindex'),
      nhan: t.getAttribute('aria-label'),
    };
  });
  console.log(
    '  tile focus được:',
    a11y.focusable,
    `| tag=${a11y.tag} role=${a11y.role} tabindex=${a11y.tabindex}`
  );
  console.log('  nhãn:', a11y.nhan);
  if (!a11y.focusable) errors.push('TILE KHÔNG THỂ FOCUS BẰNG BÀN PHÍM');

  if (a11y.focusable) {
    await page.screenshot({ path: '/tmp/v-focus.png' });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1400);
    const moBang = await page.evaluate(() => !document.getElementById('lb').hidden);
    console.log('  Enter mở lightbox:', moBang);
    if (!moBang) errors.push('ENTER KHÔNG MỞ ĐƯỢC LIGHTBOX');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const traVe = await page.evaluate(() => document.activeElement?.classList.contains('tile'));
    console.log('  Esc trả focus về tile:', traVe);
    if (!traVe) errors.push('FOCUS KHÔNG TRẢ VỀ TILE SAU KHI ĐÓNG');
  }
}

/* ================= 2. Qua file:// ================= */
console.log('\n=== QUA FILE:// (không cần server) ===');
{
  const page = await newPage();
  const url = 'file://' + encodeURI(path.join(ROOT, 'index.html'));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const r = await page.evaluate(() => ({
    tiles: document.querySelectorAll('.tile').length,
    meta: document.getElementById('brandMeta').textContent,
    tieuDe: document.getElementById('brandTitle').textContent,
    count: document.getElementById('filterCount').textContent,
    coDuLieu: !!window.__NOOI_GALLERY__,
    gridH: document.getElementById('grid').style.height,
    chipBoard: document.querySelectorAll('#boardGroup [data-board]').length,
  }));
  console.log('kết quả:', JSON.stringify(r));
  if (!r.coDuLieu) errors.push('FILE:// KHÔNG ĐỌC ĐƯỢC MANIFEST NHÚNG');
  if (r.tiles !== MANIFEST.items.length) {
    errors.push(`FILE:// SỐ TILE SAI: ${r.tiles} != ${MANIFEST.items.length}`);
  }
  if (r.chipBoard !== MANIFEST.boards.length + 1) errors.push('FILE:// THIẾU CHIP BOARD');
  await page.screenshot({ path: '/tmp/v-file.png' });
}

/* ================= 3. Logo ================= */
console.log('\n=== LOGO ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR(logo): ' + String(e)));
  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const check = async (theme) => {
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
    }, theme);
    await page.waitForTimeout(350);
    return page.evaluate((th) => {
      const imgs = [...document.querySelectorAll('.brand__logo, .footer__logo')];
      return {
        tong: imgs.length,
        // ảnh phải nạp được (naturalWidth > 0) và không vỡ
        loi: imgs.filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute('src')),
        hien: imgs.filter((i) => i.offsetParent !== null).map((i) => i.getAttribute('src')),
        // ảnh đang hiện phải là bản đúng cho chế độ này
        saiCheDo: imgs
          .filter((i) => i.offsetParent !== null)
          .filter((i) => (th === 'dark') !== i.className.includes('ondark'))
          .map((i) => i.getAttribute('src')),
      };
    }, theme);
  };

  for (const theme of ['light', 'dark']) {
    const c = await check(theme);
    console.log(`  chế độ ${theme}: ${c.tong} ảnh logo, đang hiện ${c.hien.length}`);
    console.log(`    hiện: ${c.hien.join(', ')}`);
    if (c.loi.length) errors.push(`LOGO KHÔNG NẠP ĐƯỢC (${theme}): ${c.loi.join(', ')}`);
    if (c.hien.length !== 2) {
      errors.push(`CHẾ ĐỘ ${theme}: CÓ ${c.hien.length} ẢNH LOGO HIỆN (phải là 2 — dấu + chân trang)`);
    }
    if (c.saiCheDo.length) {
      errors.push(`CHẾ ĐỘ ${theme}: DÙNG SAI BẢN LOGO: ${c.saiCheDo.join(', ')}`);
    }
  }

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
  await page.screenshot({ path: '/tmp/v-logo.png' });
  await ctx.close();
}

/* ================= 4. Chỉ 1 board -> phải ẩn nhóm lọc board ================= */
console.log('\n=== CHỈ 1 BOARD -> ẨN NHÓM LỌC BOARD ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR(single): ' + String(e)));

  const only = MANIFEST.boards[0];
  const items = MANIFEST.items.filter((it) => it.board === only.slug).slice(0, 4);
  const single = { boards: [{ ...only, count: items.length }], total: items.length, items };

  await page.route('**/data/gallery.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.__NOOI_GALLERY__ = ${JSON.stringify(single)};`,
    })
  );

  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const r = await page.evaluate(() => ({
    tiles: document.querySelectorAll('.tile').length,
    groupAn: document.getElementById('boardGroup').offsetParent === null,
    sepAn: document.getElementById('boardSep').offsetParent === null,
    scrollAn: document.getElementById('boardScroll').offsetParent === null,
    chipBoard: document.querySelectorAll('#boardGroup [data-board]').length,
    meta: document.getElementById('brandMeta').textContent,
    tieuDe: document.getElementById('brandTitle').textContent,
  }));
  console.log('kết quả:', JSON.stringify(r));
  if (r.tiles !== items.length) errors.push(`1-BOARD: SỐ TILE SAI: ${r.tiles} != ${items.length}`);
  if (!r.groupAn) errors.push('1-BOARD: NHÓM LỌC BOARD VẪN HIỆN (phải ẩn)');
  if (!r.sepAn) errors.push('1-BOARD: DẤU PHÂN CÁCH BOARD VẪN HIỆN (phải ẩn)');
  if (!r.scrollAn) errors.push('1-BOARD: DẢI BOARD VẪN HIỆN (phải ẩn)');
  if (r.chipBoard !== 0) errors.push(`1-BOARD: VẪN CÓ ${r.chipBoard} CHIP BOARD`);
  if (r.tieuDe !== only.name) errors.push(`1-BOARD: TIÊU ĐỀ SAI: "${r.tieuDe}" != "${only.name}"`);
  await page.screenshot({ path: '/tmp/v-single.png' });
}

/* ================= 5. Board bị ẩn không được lộ ra ================= */
console.log('\n=== BOARD BỊ ẨN ===');
{
  const visible = CFG.boards.filter((b) => !b.hidden);
  console.log(`  boards.json: ${CFG.boards.length} board, ẩn ${HIDDEN.length} (${HIDDEN.join(', ') || '—'})`);

  if (MANIFEST.boards.length !== visible.length) {
    errors.push(
      `MANIFEST CÓ ${MANIFEST.boards.length} BOARD, PHẢI LÀ ${visible.length} (đã trừ board ẩn)`
    );
  }
  for (const slug of HIDDEN) {
    if (MANIFEST.boards.some((b) => b.slug === slug)) {
      errors.push(`BOARD ẨN "${slug}" VẪN NẰM TRONG MANIFEST`);
    }
    if (MANIFEST.items.some((it) => it.board === slug)) {
      errors.push(`CÒN ẢNH CỦA BOARD ẨN "${slug}" TRONG MANIFEST`);
    }
  }

  // Kiểm tra trên trang thật: không chip, không ảnh, không tính vào tổng
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR(hidden): ' + String(e)));
  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const r = await page.evaluate((hiddenSlugs) => {
    const chips = [...document.querySelectorAll('#boardGroup [data-board]')].map(
      (b) => b.dataset.board
    );
    const tiles = document.querySelectorAll('.tile').length;
    return {
      chips,
      leakChip: hiddenSlugs.filter((s) => chips.includes(s)),
      tiles,
      meta: document.getElementById('brandMeta').textContent,
    };
  }, HIDDEN);

  console.log(`  chip trên trang: ${r.chips.length} (kể cả "Mọi board")`);
  console.log(`  tổng ảnh hiện: ${r.tiles}  |  meta: "${r.meta}"`);
  if (r.leakChip.length) errors.push(`CHIP CỦA BOARD ẨN VẪN HIỆN: ${r.leakChip.join(', ')}`);
  if (r.tiles !== MANIFEST.items.length) {
    errors.push(`SỐ TILE SAI: ${r.tiles} != ${MANIFEST.items.length}`);
  }
  if (r.chips.length !== visible.length + 1) {
    errors.push(`SỐ CHIP SAI: ${r.chips.length} != ${visible.length + 1}`);
  }
  // Số board trong meta phải là số board đang hiện, không phải số trong boards.json
  const soBoard = Number((r.meta.match(/(\d+)\s*board/) || [])[1]);
  if (soBoard !== visible.length) {
    errors.push(`META GHI ${soBoard} BOARD, PHẢI LÀ ${visible.length}`);
  }
  await ctx.close();
}

console.log('\n' + '='.repeat(52));
if (errors.length) {
  console.log(`❌ ${errors.length} LỖI:`);
  errors.forEach((e) => console.log('   - ' + e));
} else {
  console.log('✅ TẤT CẢ ĐỀU ĐẠT');
}
await browser.close();
process.exit(errors.length ? 1 : 0);
