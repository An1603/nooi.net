/* ============================================================
   NOOI Work — masonry gallery + lightbox + lọc
   ============================================================ */
(() => {
  'use strict';

  const GRID       = document.getElementById('grid');
  const EMPTY      = document.getElementById('empty');
  const BRAND_META = document.getElementById('brandMeta');
  const BRAND_TTL  = document.getElementById('brandTitle');
  const FOOTER     = document.getElementById('footerMeta');
  const TOPBAR     = document.getElementById('topbar');
  const FILTERS    = document.getElementById('filters');
  const COUNT      = document.getElementById('filterCount');
  const BOARD_GRP  = document.getElementById('boardGroup');
  const BOARD_SEP  = document.getElementById('boardSep');
  const BOARD_SCRL = document.getElementById('boardScroll');
  const EMPTY_MSG  = document.getElementById('emptyMsg');
  const EMPTY_HINT = document.getElementById('emptyHint');

  const LB        = document.getElementById('lb');
  const LB_IMG    = document.getElementById('lbImg');
  const LB_COUNT  = document.getElementById('lbCounter');
  const LB_PREV   = document.getElementById('lbPrev');
  const LB_NEXT   = document.getElementById('lbNext');
  const LB_CLOSE  = document.getElementById('lbClose');

  const GAP = 16;

  let items = [];   // toàn bộ ảnh
  let tiles = [];   // phần tử DOM, chỉ số khớp với items
  let active = [];  // chỉ số các ảnh đang hiển thị (sau khi lọc)
  let current = -1; // vị trí trong `active` khi mở lightbox
  let cols = 0;
  let boardNames = {}; // slug -> tên hiển thị của board

  const filter = { board: 'all', orient: 'all', color: 'all' };

  /* ---------- Theme ---------- */

  const THEME_KEY = 'nooi-theme';
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');

  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });

  /* ---------- Helpers ---------- */

  const colCountFor = (w) => {
    if (w < 460) return 2;
    if (w < 720) return 3;
    if (w < 1040) return 4;
    if (w < 1420) return 5;
    return 6;
  };

  const fmt = (n) => n.toLocaleString('vi-VN');

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const orientOf = (it) => (it.h > it.w ? 'doc' : it.h === it.w ? 'vuong' : 'ngang');

  /**
   * Phân loại tông màu từ mã hex dominant_color của Pinterest.
   * Ưu tiên độ bão hoà/độ sáng trước, rồi mới tới hue — vì ảnh kiến trúc
   * thường là tông trung tính, gán bừa theo hue sẽ sai.
   */
  function toneOf(hex) {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return 'trungtinh';
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const sat = max === 0 ? 0 : d / max;

    if (sat < 0.12 || max < 0.2) return 'trungtinh';

    let hue;
    if (d === 0) hue = 0;
    else if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
    if (hue < 0) hue += 360;

    if (hue < 70) return 'am';
    if (hue < 165) return 'la';
    if (hue < 260) return 'duong';
    return 'am'; // tím/hồng rất hiếm -> gộp vào tông ấm
  }

  /* ---------- Layout ---------- */

  function layout() {
    const width = GRID.clientWidth;
    if (!width) return;

    const nextCols = colCountFor(width);
    const colWidth = (width - GAP * (nextCols - 1)) / nextCols;
    const heights = new Array(nextCols).fill(0);

    for (const idx of active) {
      const tile = tiles[idx];

      // chọn cột đang ngắn nhất -> cân bằng chiều cao
      let c = 0;
      for (let k = 1; k < nextCols; k++) if (heights[k] < heights[c]) c = k;

      const h = Math.round(colWidth * (items[idx].h / items[idx].w));

      // Định vị bằng left/top (KHÔNG dùng transform) để nhường transform
      // cho hiệu ứng fade-in của .tile
      tile.style.width = colWidth + 'px';
      tile.style.height = h + 'px';
      tile.style.left = Math.round(c * (colWidth + GAP)) + 'px';
      tile.style.top = heights[c] + 'px';

      heights[c] += h + GAP;
    }

    cols = nextCols;
    GRID.style.height = Math.max(0, Math.max(...heights) - GAP) + 'px';
  }

  /* ---------- Lazy load ---------- */

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const tile = e.target;
        io.unobserve(tile);

        const img = tile.querySelector('img');
        const src = img.dataset.src;
        if (!src) continue;

        img.addEventListener('load', () => {
          img.classList.add('is-loaded');
          tile.classList.add('is-in');
        }, { once: true });
        img.addEventListener('error', () => tile.classList.add('is-in'), { once: true });
        img.src = src;
      }
    },
    { rootMargin: '700px 0px', threshold: 0.01 }
  );

  /* ---------- Lọc ---------- */

  function applyFilter() {
    active = [];
    items.forEach((it, i) => {
      const okBoard = filter.board === 'all' || it.board === filter.board;
      const okOrient = filter.orient === 'all' || orientOf(it) === filter.orient;
      const okColor = filter.color === 'all' || toneOf(it.color) === filter.color;
      const show = okBoard && okOrient && okColor;

      tiles[i].style.display = show ? '' : 'none';
      if (show) active.push(i);
    });

    COUNT.textContent =
      active.length === items.length
        ? `${fmt(items.length)} ảnh`
        : `${fmt(active.length)} / ${fmt(items.length)} ảnh`;

    // Không ảnh nào khớp bộ lọc -> báo rõ, đừng để lưới trống trơn
    if (!active.length && items.length) {
      EMPTY_MSG.textContent = 'Không có ảnh nào khớp bộ lọc.';
      EMPTY_HINT.textContent = 'Thử chọn lại board, hướng ảnh hoặc tông màu.';
      EMPTY.hidden = false;
    } else {
      EMPTY.hidden = true;
    }

    layout();
  }

  function wireFilters() {
    const groups = [
      { sel: '#boardGroup [data-board]', key: 'board' },
      { sel: '#filters [data-orient]', key: 'orient' },
      { sel: '#filters [data-color]', key: 'color' },
    ];
    for (const g of groups) {
      FILTERS.querySelectorAll(g.sel).forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = btn.dataset[g.key];
          if (filter[g.key] === val) return;
          filter[g.key] = val;

          FILTERS.querySelectorAll(g.sel).forEach((b) => b.classList.toggle('is-active', b === btn));

          // đang mở lightbox mà ảnh đó bị lọc mất -> đóng lại
          if (!LB.hidden) close();
          applyFilter();
        });
      });
    }
  }

  /* ---------- Build ---------- */

  /**
   * Dựng nhóm chip lọc theo board từ manifest.
   * Chỉ hiện khi có từ 2 board trở lên — với một board thì lọc theo board
   * là vô nghĩa, chỉ làm thanh lọc rối thêm.
   */
  function buildBoardChips(boards) {
    if (boards.length < 2) {
      BOARD_SCRL.hidden = true;
      BOARD_GRP.hidden = true;
      BOARD_SEP.hidden = true;
      return;
    }

    const frag = document.createDocumentFragment();

    const mk = (slug, label, count, isActive) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (isActive ? ' is-active' : '');
      btn.dataset.board = slug;
      btn.textContent = label;

      if (count != null) {
        const n = document.createElement('span');
        n.className = 'chip__n';
        n.textContent = fmt(count);
        btn.appendChild(n);
      }
      return btn;
    };

    frag.appendChild(mk('all', 'Mọi board', items.length, true));
    for (const b of boards) {
      const n = items.reduce((acc, it) => acc + (it.board === b.slug ? 1 : 0), 0);
      frag.appendChild(mk(b.slug, b.name || b.slug, n, false));
    }

    BOARD_GRP.replaceChildren(frag);
    BOARD_SCRL.hidden = false;
    BOARD_GRP.hidden = false;
    BOARD_SEP.hidden = false;

    // Dải board có thể dài hơn chỗ chứa -> cuộn ngang. Hiện fade ở mép nào còn
    // chip khuất, để người dùng biết là cuộn được.
    BOARD_SCRL.addEventListener('scroll', updateBoardScrollHint, { passive: true });
    updateBoardScrollHint();
  }

  function updateBoardScrollHint() {
    if (!BOARD_SCRL || BOARD_SCRL.hidden) return;
    const max = BOARD_SCRL.scrollWidth - BOARD_SCRL.clientWidth;
    const x = BOARD_SCRL.scrollLeft;
    BOARD_SCRL.classList.toggle('is-more-left', x > 4);
    BOARD_SCRL.classList.toggle('is-more-right', max - x > 4);
  }

  function build(data) {
    items = data.items || [];

    // Bỏ board lỗi (không tồn tại / riêng tư) để không hiện chip rỗng
    const boards = (data.boards || []).filter((b) => b && !b.error);

    BRAND_TTL.textContent = boards.length === 1 ? boards[0].name || 'NOOI' : 'NOOI';
    BRAND_META.textContent =
      boards.length > 1
        ? `${fmt(items.length)} ảnh  ·  ${fmt(boards.length)} board`
        : `${fmt(items.length)} ảnh  ·  NOOI`;
    // Chân trang đã có logo ghi "NOOI" nên ở đây chỉ cần số ảnh + lần cập nhật
    FOOTER.textContent = `${fmt(items.length)} ảnh${
      data.scrapedAt ? '  ·  cập nhật ' + fmtDate(data.scrapedAt) : ''
    }`;
    document.title =
      boards.length === 1 ? `${boards[0].name} — Thư viện ảnh` : 'Thư viện ảnh NOOI';

    boardNames = Object.fromEntries(boards.map((b) => [b.slug, b.name || b.slug]));

    if (!items.length) {
      EMPTY.hidden = false;
      return;
    }

    buildBoardChips(boards);

    const frag = document.createDocumentFragment();
    tiles = items.map((it, i) => {
      const tile = document.createElement('figure');
      tile.className = 'tile';
      tile.dataset.index = i;
      tile.style.background = it.color || '';
      // <figure> mặc định không focus được -> phải tự thêm để dùng được
      // bằng bàn phím (Tab tới, Enter/Space để mở).
      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.setAttribute(
        'aria-label',
        `Mở ảnh ${i + 1} / ${items.length}${
          boardNames[it.board] ? ` — ${boardNames[it.board]}` : ''
        }`
      );

      const img = document.createElement('img');
      img.dataset.src = it.thumb;
      img.alt = `${boardNames[it.board] || 'NOOI'} — ảnh ${i + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = it.w;
      img.height = it.h;

      const veil = document.createElement('div');
      veil.className = 'tile__veil';
      veil.innerHTML =
        '<span class="tile__zoom"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M11 8v6M8 11h6"/></svg></span>';

      tile.append(img, veil);
      frag.appendChild(tile);
      io.observe(tile);
      return tile;
    });

    GRID.appendChild(frag);
    wireFilters();
    applyFilter();
    requestAnimationFrame(layout);
  }

  /* ---------- Lightbox ---------- */

  function preload(pos) {
    if (pos < 0 || pos >= active.length) return;
    const img = new Image();
    img.src = items[active[pos]].full;
  }

  function show(pos) {
    if (!active.length) return;
    if (pos < 0) pos = active.length - 1;
    if (pos >= active.length) pos = 0;
    current = pos;

    const it = items[active[pos]];
    LB_IMG.src = it.full;
    LB_IMG.alt = `${boardNames[it.board] || 'NOOI'} — ảnh ${pos + 1}`;
    LB_IMG.style.background = it.color || '';

    // Kèm tên board vì thư viện giờ gộp nhiều board
    const bname = boardNames[it.board];
    LB_COUNT.textContent = bname
      ? `${bname}  ·  ${pos + 1} / ${active.length}`
      : `${pos + 1} / ${active.length}`;

    preload(pos + 1);
    preload(pos - 1);
  }

  let lastFocus = null; // ảnh đã mở lightbox, để trả focus về khi đóng

  function open(index) {
    const pos = active.indexOf(index);
    if (pos === -1) return;
    lastFocus = document.activeElement;
    show(pos);
    LB.hidden = false;
    document.body.classList.add('is-locked');
    LB_CLOSE.focus({ preventScroll: true });
  }

  function close() {
    LB.hidden = true;
    LB_IMG.removeAttribute('src');
    document.body.classList.remove('is-locked');
    // Trả focus về ảnh vừa xem. Bỏ qua nếu ảnh đó đã bị bộ lọc ẩn đi,
    // vì focus vào phần tử display:none sẽ thất bại và mất dấu.
    if (lastFocus && lastFocus.isConnected && lastFocus.offsetParent !== null) {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;
  }

  GRID.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (tile) open(Number(tile.dataset.index));
  });

  // Enter / Space để mở ảnh khi điều hướng bằng bàn phím
  GRID.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    e.preventDefault();
    open(Number(tile.dataset.index));
  });

  LB_PREV.addEventListener('click', () => show(current - 1));
  LB_NEXT.addEventListener('click', () => show(current + 1));
  LB_CLOSE.addEventListener('click', close);
  LB.querySelector('[data-close]').addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (LB.hidden) return;
    if (e.key === 'Escape')          { close(); }
    else if (e.key === 'ArrowLeft')  { show(current - 1); }
    else if (e.key === 'ArrowRight') { show(current + 1); }
  });

  // vuốt trên mobile
  let touchX = null;
  LB.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  LB.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) show(dx < 0 ? current + 1 : current - 1);
    touchX = null;
  }, { passive: true });

  /* ---------- Resize / scroll ---------- */

  let raf = null;
  window.addEventListener('resize', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (colCountFor(GRID.clientWidth) !== cols) layout();
      updateBoardScrollHint();
    });
  });

  window.addEventListener('scroll', () => {
    TOPBAR.classList.toggle('is-stuck', window.scrollY > 8);
  }, { passive: true });

  /* ---------- Boot ---------- */

  // data/gallery.js nhúng sẵn manifest -> mở bằng file:// vẫn chạy.
  // Nếu không có (VD chỉ có gallery.json), lùi về fetch() khi chạy qua server.
  function loadManifest() {
    if (window.__NOOI_GALLERY__) return Promise.resolve(window.__NOOI_GALLERY__);
    return fetch('data/gallery.json').then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  }

  loadManifest()
    .then(build)
    .catch((err) => {
      console.error(err);
      BRAND_META.textContent = 'Không đọc được dữ liệu thư viện';
      EMPTY.hidden = false;
    });
})();
