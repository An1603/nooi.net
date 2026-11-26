/* ============================================================
   NOOI Work — masonry gallery + lightbox + lọc
   ============================================================ */
(() => {
  'use strict';

  const GRID       = document.getElementById('grid');
  const EMPTY      = document.getElementById('empty');
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

  // Thanh công cụ (đồng bộ dáng với kho video nooi.net/video)
  const Q          = document.getElementById('q');
  const SORT       = document.getElementById('sort');
  const F_TOGGLE   = document.getElementById('filterToggle');
  const F_PANEL    = document.getElementById('filterPanel');
  const F_N        = document.getElementById('filterN');
  const CLEAR      = document.getElementById('clearFilters');
  const SHARE      = document.getElementById('shareBtn');

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

  const filter = { q: '', board: 'all', orient: 'all', color: 'all' };
  let sort = 'mac-dinh';  // thứ tự đang sắp
  let seed = 0;           // hạt giống cho kiểu "Ngẫu nhiên" (nằm trong link chia sẻ)

  /* ---------- Menu đầu trang (chỉ dùng trên điện thoại) ---------- */

  const MENU_TOGGLE = document.getElementById('menuToggle');
  const MENU_MOBILE = document.getElementById('menuMobile');
  const MENU_LON = window.matchMedia('(min-width: 769px)');

  function dongMenu() {
    MENU_MOBILE.hidden = true;
    MENU_TOGGLE.setAttribute('aria-expanded', 'false');
    MENU_TOGGLE.setAttribute('aria-label', 'Mở menu');
  }

  MENU_TOGGLE.addEventListener('click', () => {
    const mo = MENU_MOBILE.hidden;
    MENU_MOBILE.hidden = !mo;
    MENU_TOGGLE.setAttribute('aria-expanded', String(mo));
    MENU_TOGGLE.setAttribute('aria-label', mo ? 'Đóng menu' : 'Mở menu');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !MENU_MOBILE.hidden) dongMenu();
  });
  // Xoay ngang / phóng to lên màn hình lớn thì menu ngang đã hiện -> đóng menu xổ.
  MENU_LON.addEventListener('change', (e) => { if (e.matches) dongMenu(); });

  /* ---------- Chừa chỗ cho đầu trang ---------- */

  /* Đầu trang để `position: fixed` cho giống nooi.net, nên <body> phải chừa chỗ.
     Đo chiều cao THẬT của hàng đầu trang rồi ghi vào biến CSS — không đoán, vì
     điện thoại thấp hơn máy tính. Chỉ đo hàng trong (không tính menu xổ ra),
     để lúc mở menu thì menu nằm đè lên nội dung như trang chủ. */
  const ghiCaoDauTrang = () => {
    const hang = TOPBAR.querySelector('.topbar__inner') || TOPBAR;
    document.documentElement.style.setProperty(
      '--cao-dau-trang', Math.ceil(hang.getBoundingClientRect().height) + 'px'
    );
  };
  ghiCaoDauTrang();
  window.addEventListener('resize', ghiCaoDauTrang);
  window.addEventListener('orientationchange', ghiCaoDauTrang);

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

  /* ---------- Tìm · lọc · sắp xếp ---------- */

  /** Bỏ dấu tiếng Việt: gõ "be boi" cũng ra board "Be Boi". */
  const boDau = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .toLowerCase()
      .trim();

  /**
   * Sinh số ngẫu nhiên CÓ HẠT GIỐNG. Cùng hạt giống -> cùng thứ tự, nên link
   * chia sẻ kiểu "Ngẫu nhiên" mở ra đúng danh sách người gửi đang thấy.
   */
  function rndTheoHat(hat) {
    let t = hat >>> 0;
    return () => {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Sắp thứ tự danh sách đang hiện.
   *
   * Sắp trên mảng `active` chứ KHÔNG đổi thứ tự thẻ trong DOM: `layout()` xếp
   * ảnh theo đúng thứ tự mảng này và lightbox cũng chạy theo nó — nên "ảnh tiếp
   * theo" luôn đúng chiều đang sắp, mà không phải dựng lại lưới.
   */
  function sapXep(ds) {
    if (sort === 'ngau-nhien') {
      const rnd = rndTheoHat(seed);
      for (let i = ds.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [ds[i], ds[j]] = [ds[j], ds[i]];
      }
      return ds;
    }
    if (sort === 'ten-a-z') {
      return ds.sort(
        (a, b) =>
          (boardNames[items[a].board] || '').localeCompare(boardNames[items[b].board] || '', 'vi') ||
          a - b
      );
    }
    if (sort === 'ngang-truoc' || sort === 'doc-truoc') {
      const uu = sort === 'ngang-truoc'
        ? { ngang: 0, vuong: 1, doc: 2 }
        : { doc: 0, vuong: 1, ngang: 2 };
      return ds.sort((a, b) => uu[orientOf(items[a])] - uu[orientOf(items[b])] || a - b);
    }
    return ds; // mặc định: thứ tự dữ liệu (theo board)
  }

  /** Đếm điều kiện đang bật -> hiện lên nút Lọc; quyết định có hiện "Xoá lọc". */
  function capNhatNutLoc() {
    const n =
      (filter.q ? 1 : 0) +
      (filter.board !== 'all' ? 1 : 0) +
      (filter.orient !== 'all' ? 1 : 0) +
      (filter.color !== 'all' ? 1 : 0);

    F_N.textContent = n;
    F_N.hidden = n === 0;
    F_TOGGLE.classList.toggle('is-on', n > 0);
    CLEAR.hidden = n === 0 && sort === 'mac-dinh';
  }

  /**
   * Ghi trạng thái đang xem vào địa chỉ -> copy/chia sẻ là mở ra đúng danh sách.
   * Mở bằng file:// thì replaceState bị chặn nên phải bọc try, đừng để chết trang.
   */
  function dongBoUrl() {
    try {
      const p = new URLSearchParams();
      if (filter.q) p.set('q', filter.q);
      if (filter.board !== 'all') p.set('board', filter.board);
      if (filter.orient !== 'all') p.set('orient', filter.orient);
      if (filter.color !== 'all') p.set('color', filter.color);
      if (sort !== 'mac-dinh') p.set('sort', sort);
      if (sort === 'ngau-nhien') p.set('seed', String(seed));

      const qs = p.toString();
      history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
    } catch (e) { /* file:// hoặc trình duyệt chặn -> bỏ qua */ }
  }

  /** Đọc trạng thái từ địa chỉ lúc mở trang (link chia sẻ). */
  function docUrl() {
    let p;
    try { p = new URLSearchParams(location.search); } catch (e) { return; }

    filter.q = p.get('q') || '';

    const b = p.get('board');  if (b && b !== 'all') filter.board = b;
    const o = p.get('orient'); if (o && o !== 'all') filter.orient = o;
    const c = p.get('color');  if (c && c !== 'all') filter.color = c;

    const s = p.get('sort');
    if (['ngau-nhien', 'ten-a-z', 'ngang-truoc', 'doc-truoc'].includes(s)) sort = s;

    if (sort === 'ngau-nhien') {
      const sd = parseInt(p.get('seed'), 10);
      seed = Number.isFinite(sd) && sd > 0 ? sd : Math.floor(Math.random() * 2147483647);
    }

    Q.value = filter.q;
    SORT.value = sort;
  }

  function applyFilter() {
    active = [];
    const tuKhoa = boDau(filter.q);

    items.forEach((it, i) => {
      const okBoard = filter.board === 'all' || it.board === filter.board;
      const okOrient = filter.orient === 'all' || orientOf(it) === filter.orient;
      const okColor = filter.color === 'all' || toneOf(it.color) === filter.color;
      // Ảnh không có tiêu đề riêng nên ô tìm so với TÊN BOARD: gõ "camp" ra board
      // "CAMP, Glamping". Muốn tìm theo nội dung ảnh thì phải nạp thêm tiêu đề
      // từ Pinterest (xem ghi chú trong tài liệu).
      const okQ = !tuKhoa || boDau(boardNames[it.board] || it.board).includes(tuKhoa);
      const show = okBoard && okOrient && okColor && okQ;

      tiles[i].style.display = show ? '' : 'none';
      if (show) active.push(i);
    });

    sapXep(active);

    COUNT.textContent = `Đang hiện ${fmt(active.length)}/${fmt(items.length)} ảnh`;

    // Không ảnh nào khớp bộ lọc -> báo rõ, đừng để lưới trống trơn
    if (!active.length && items.length) {
      EMPTY_MSG.textContent = 'Không có ảnh nào khớp.';
      EMPTY_HINT.textContent = 'Thử bỏ chữ đang tìm, hoặc chọn lại board, khổ ảnh, tông màu.';
      EMPTY.hidden = false;
    } else {
      EMPTY.hidden = true;
    }

    capNhatNutLoc();
    dongBoUrl();
    layout();
  }

  /** Tô đậm chip đang chọn. Tách riêng vì lúc mở trang cũng phải gọi — trạng thái
   *  khi đó đến từ địa chỉ chia sẻ, không phải từ một cú bấm. */
  function dongBoChip(chiMot) {
    const groups = chiMot
      ? [chiMot]
      : [
          { sel: '#boardGroup [data-board]', key: 'board' },
          { sel: '#filters [data-orient]', key: 'orient' },
          { sel: '#filters [data-color]', key: 'color' },
        ];
    for (const g of groups) {
      FILTERS.querySelectorAll(g.sel).forEach((b) =>
        b.classList.toggle('is-active', b.dataset[g.key] === filter[g.key])
      );
    }
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
          dongBoChip(g);

          // đang mở lightbox mà ảnh đó bị lọc mất -> đóng lại
          if (!LB.hidden) close();
          applyFilter();
        });
      });
    }
  }

  /** Nối các nút trên thanh công cụ: tìm, sắp xếp, nút Lọc, xoá lọc, chia sẻ. */
  function wireBar() {
    dongBoChip();

    // Gõ tới đâu lọc tới đó, nhưng chờ 160ms — nếu không, mỗi phím gõ vào là
    // duyệt lại cả nghìn ảnh một lần.
    let henQ = null;
    Q.addEventListener('input', () => {
      clearTimeout(henQ);
      henQ = setTimeout(() => {
        filter.q = Q.value;
        if (!LB.hidden) close();
        applyFilter();
      }, 160);
    });
    // Esc để xoá nhanh chữ đang tìm (giữ luôn con trỏ trong ô).
    Q.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Q.value = '';
    });

    SORT.addEventListener('change', () => {
      sort = SORT.value;
      // Chọn "Ngẫu nhiên" thì bốc hạt giống mới; hạt giống đi kèm link chia sẻ nên
      // người nhận mở ra vẫn đúng thứ tự này.
      if (sort === 'ngau-nhien') seed = Math.floor(Math.random() * 2147483647);
      if (!LB.hidden) close();
      applyFilter();
    });

    F_TOGGLE.addEventListener('click', () => {
      const mo = F_PANEL.hidden;
      F_PANEL.hidden = !mo;
      F_TOGGLE.setAttribute('aria-expanded', String(mo));
      if (mo) updateBoardScrollHint();
    });

    CLEAR.addEventListener('click', () => {
      filter.q = '';
      filter.board = 'all';
      filter.orient = 'all';
      filter.color = 'all';
      sort = 'mac-dinh';
      Q.value = '';
      SORT.value = sort;
      dongBoChip();
      if (!LB.hidden) close();
      applyFilter();
    });

    SHARE.addEventListener('click', chiaSe);
  }

  /* ---------- Chia sẻ ---------- */

  let toastEl = null;
  let henToast = null;

  function bao(chu) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = chu;
    toastEl.classList.add('is-hien');
    clearTimeout(henToast);
    henToast = setTimeout(() => toastEl.classList.remove('is-hien'), 2400);
  }

  /** Máy cảm ứng thì mở bảng chia sẻ của hệ điều hành, máy tính thì copy liên kết
   *  (giống nút chia sẻ bên kho video). */
  function chiaSe() {
    const url = location.href;
    const camUng = window.matchMedia('(pointer: coarse)').matches;

    if (camUng && navigator.share) {
      navigator.share({ title: 'Thư viện ảnh NOOI', url }).catch(() => {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => bao('Đã copy liên kết danh sách đang xem'),
        () => bao('Không copy tự động được — bạn copy địa chỉ trên thanh trình duyệt nhé')
      );
      return;
    }
    bao('Không copy tự động được — bạn copy địa chỉ trên thanh trình duyệt nhé');
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

    frag.appendChild(mk('all', 'Mọi board', items.length, filter.board === 'all'));
    for (const b of boards) {
      const n = items.reduce((acc, it) => acc + (it.board === b.slug ? 1 : 0), 0);
      frag.appendChild(mk(b.slug, b.name || b.slug, n, filter.board === b.slug));
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
    // Bảng lọc đang đóng thì dải chip chưa có bề rộng thật -> tính ra số sai, bỏ qua.
    if (!BOARD_SCRL || BOARD_SCRL.hidden || F_PANEL.hidden) return;
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
    // Không còn khối "1.738 ảnh · 16 board" trên đầu trang: số ảnh đang hiện nằm ở
    // dòng dưới thanh công cụ, còn tổng số + lần cập nhật nằm ở chân trang.
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
    wireBar();
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

  /* ---------- Vuốt trên mobile ---------- */

  /* Trong màn hình xem ảnh chi tiết (lightbox), vuốt NGANG hoặc DỌC đều chuyển
     sang ảnh khác:
       - vuốt trái  / vuốt lên  -> ảnh sau
       - vuốt phải / vuốt xuống -> ảnh trước
     Chọn trục có biên độ lớn hơn để một cú vuốt chéo không kích hoạt 2 lần.
     Ngưỡng dọc cao hơn ngang chút vì ngón tay thường lệch dọc khi vuốt ngang. */
  const SWIPE_MIN_X = 55;
  const SWIPE_MIN_Y = 60;

  let touchStart = null;

  LB.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  LB.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dx) >= Math.abs(dy)) {
      if (Math.abs(dx) > SWIPE_MIN_X) show(dx < 0 ? current + 1 : current - 1);
    } else if (Math.abs(dy) > SWIPE_MIN_Y) {
      show(dy < 0 ? current + 1 : current - 1);
    }
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

  // Đọc trạng thái tìm/lọc/sắp xếp từ địa chỉ TRƯỚC khi dựng lưới, để link chia
  // sẻ mở ra đúng danh sách đã thấy (chip, ô tìm, thứ tự đều khớp).
  docUrl();

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
      EMPTY_MSG.textContent = 'Không đọc được dữ liệu thư viện.';
      EMPTY.hidden = false;
    });
})();
