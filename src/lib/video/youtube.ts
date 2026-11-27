/**
 * Điều khiển iframe YouTube từ mã của mình — phát/dừng, TUA, mở tiếng.
 *
 * Vì sao phải làm: nhúng YouTube bằng iframe thì mọi thứ nằm trong khung của Google, trang cha
 * không đọc được `currentTime` cũng không gọi được `play()`. Trước 27/11/2026 luồng xem đành bỏ
 * phím ← → với video YouTube ("Dùng phím tiến - lui chưa tua được" — Ngài An báo).
 *
 * Cách làm: **postMessage**, KHÔNG nạp `iframe_api` từ miền ngoài.
 *   - Iframe cần `enablejsapi=1` (đã đặt trong `DUONG_DAN_NHUNG`).
 *   - Chào một lần  → YouTube trả `initialDelivery` (thời lượng) rồi `infoDelivery` liên tục
 *     (currentTime, playerState, muted).
 *   - Gửi `{event:"command", func:"seekTo"|"playVideo"|"pauseVideo"|"mute"|"unMute"}`.
 *
 * Vì sao không nạp thư viện: nạp `www.youtube.com/iframe_api` là thêm một phụ thuộc mạng; mạng
 * chặn thì mọi thứ treo mà không báo lỗi (bài học pitfall 26 của skill nooi-kho-video). Ở đây
 * không có lời hứa nào để treo: gửi lệnh bằng postMessage, không trả lời thì `sanSang()` = false
 * và giao diện KHÔNG dựng nút vô tác dụng.
 *
 * Đã kiểm chứng thật trên production 27/11/2026: `seekTo` nhảy đúng giây, `playVideo` cho
 * `playerState = 1` và `currentTime` tiến lên, `unMute` trả `muted: false`.
 */

export interface TrangThaiYouTube {
  giay: number;
  tong: number;
  dangPhat: boolean;
  tatTieng: boolean;
  /** Vừa phát HẾT bài (playerState = 0) — luồng xem dùng để chuyển bài kế hoặc lặp lại. */
  ketThuc?: boolean;
}

export interface DieuKhienYouTube {
  /** YouTube đã trả lời ít nhất một `infoDelivery` chưa (chưa thì đừng dựng nút loa của mình). */
  sanSang: () => boolean;
  phat: () => void;
  dung: () => void;
  /** Tua tương đối (giây âm = lùi). Không vượt quá đầu/cuối video. */
  tua: (giay: number) => void;
  /** Tua theo tỉ lệ 0–1 và GỬI lệnh ngay (bấm thanh tiến trình). */
  toi: (tiLe: number) => void;
  /** Tua theo tỉ lệ nhưng CHỈ cập nhật giao diện — dùng khi đang kéo thanh (xem `toi`). */
  xemTruoc: (tiLe: number) => void;
  /**
   * Đổi tốc độ phát (0,5–2). Gửi `setPlaybackRate` qua postMessage — **có tác dụng thật** (đo
   * 27/11/2026: 1 → 1,5 và `infoDelivery.playbackRate` báo 1,5).
   *
   * Khác hẳn chất lượng: Google đã bỏ khả năng chọn chất lượng từ 24/10/2019 — `setPlaybackQuality`
   * là lệnh rỗng (no-op), `getAvailableQualityLevels` không còn. Vì thế menu của NOOI chỉ có tốc
   * độ; chọn chất lượng phải mở chính player YouTube.
   */
  tocDo: (heSo: number) => void;
  /** tat = true → tắt tiếng. */
  tieng: (tat: boolean) => void;
  huy: () => void;
}

interface GoiTin {
  event?: string;
  info?: {
    currentTime?: number;
    duration?: number;
    playerState?: number;
    muted?: boolean;
  };
}

const MIEN_YOUTUBE = /^https:\/\/www\.youtube(-nocookie)?\.com$/;

export function taoDieuKhienYouTube(
  iframe: HTMLIFrameElement,
  khiDoi: (t: TrangThaiYouTube) => void,
  /**
   * Thời lượng dự phòng (lấy từ bản ghi `videos.duration`).
   * Vì sao cần: người xem có thể bấm/kéo thanh tiến trình TRƯỚC khi YouTube kịp trả `infoDelivery`;
   * không có tổng thì không quy đổi được tỉ lệ ra giây và cú bấm rơi vào khoảng không.
   */
  tongDuPhong = 0,
  /** Tốc độ phát người xem đã chọn trước đó (nhớ qua localStorage) — áp lại cho khung mới. */
  tocDoBanDau = 1
): DieuKhienYouTube {
  // Mã phiên riêng: nhiều khung cùng trang thì mỗi khung một mã.
  const ma = `nooi-${Math.random().toString(36).slice(2, 9)}`;
  let giay = 0;
  let tong = tongDuPhong > 0 ? tongDuPhong : 0;
  let dangPhat = false;
  let tatTieng = false;
  /** Đã phát hết bài chưa — chỉ bật khi playerState = 0 */
  let ketThuc = false;
  /** Lúc gửi `seekTo` gần nhất — dùng để bỏ qua các `infoDelivery` còn báo vị trí CŨ. */
  let lucGuiSeek = 0;
  let daNhan = false;
  let daHuy = false;

  const gui = (func: string, args: unknown[] = []) => {
    if (daHuy) return;
    try {
      iframe.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
    } catch {
      /* iframe đã bị gỡ */
    }
  };

  /**
   * Người xem đã bấm phát trước khi YouTube sẵn sàng? Lệnh gửi lúc đó bị bỏ im lặng, nên nhớ lại
   * và gửi đúng một lần ngay khi nhận được tín hiệu đầu tiên. Bắt buộc phải có vì khung ngang dùng
   * `controls=0` — không còn nút phát nào của YouTube để bấm lại.
   */
  let choPhat = false;
  /**
   * Lệnh TẠM DỪNG gửi lúc trình phát chưa sẵn sàng (khung bên cạnh vừa dựng, người xem đã vuốt
   * sang bài khác) — gửi lại ngay khi nhận tín hiệu đầu tiên, nếu không khung đó sẽ phát tiếp.
   */
  let choDung = false;
  /**
   * Trạng thái tiếng người cha MUỐN (true = tắt tiếng). Nhớ lại để áp đúng lúc trình phát sẵn
   * sàng — lệnh mute/unMute gửi quá sớm bị bỏ im lặng, và khung bên cạnh sẽ phát ra tiếng.
   */
  let tiengMong: boolean | null = null;
  /** Tốc độ người xem đã chọn; gửi lại sau khi trình phát sẵn sàng (lệnh sớm bị bỏ). */
  let tocDoMong = tocDoBanDau;

  const chao = () => {
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: ma, channel: "widget" }),
        "*"
      );
    } catch {
      /* iframe đã bị gỡ */
    }
  };

  const nghe = (e: MessageEvent) => {
    if (daHuy) return;
    // Chỉ nhận của CHÍNH iframe này (nhiều khung YouTube cùng lúc trên một trang).
    if (e.source !== iframe.contentWindow) return;
    if (!MIEN_YOUTUBE.test(e.origin)) return;
    let d: GoiTin | null = null;
    try {
      d = typeof e.data === "string" ? (JSON.parse(e.data) as GoiTin) : (e.data as GoiTin);
    } catch {
      return;
    }
    if (!d || d.event !== "infoDelivery" || !d.info) return;

    const i = d.info;
    if (typeof i.currentTime === "number") {
      // Vừa gửi seekTo mà YouTube còn báo vị trí CŨ (lệch nhiều) → bỏ qua, không để thanh nhảy lùi
      const dangChoSeek = Date.now() - lucGuiSeek < 1200;
      if (!dangChoSeek || Math.abs(i.currentTime - giay) < 1.5) giay = i.currentTime;
    }
    if (typeof i.duration === "number" && i.duration > 0) tong = i.duration;
    // 1 = đang phát, 3 = đang đệm (vẫn coi là đang phát)
    if (typeof i.playerState === "number") {
      dangPhat = i.playerState === 1 || i.playerState === 3;
      ketThuc = i.playerState === 0;
    }
    if (typeof i.muted === "boolean") tatTieng = i.muted;
    const lanDau = !daNhan;
    daNhan = true;
    // Người xem đã bấm phát trong lúc YouTube chưa sẵn sàng → gửi lại đúng lúc này.
    // Đang muốn TẠM DỪNG (khung bên cạnh) thì dừng — ưu tiên dừng, không để khung lạ phát ra tiếng.
    if (lanDau && tiengMong !== null) gui(tiengMong ? "mute" : "unMute");
    if (lanDau && choDung) gui("pauseVideo");
    else if (lanDau && choPhat) gui("playVideo");
    if (lanDau && Math.abs(tocDoMong - 1) > 0.001) gui("setPlaybackRate", [tocDoMong]);
    khiDoi({ giay, tong, dangPhat, tatTieng, ketThuc });
  };

  window.addEventListener("message", nghe);

  // Chào ngay, rồi chào lại vài nhịp: iframe vừa vào DOM thì khung bên trong chưa sẵn sàng,
  // lệnh gửi quá sớm bị bỏ im lặng (không có lỗi để bắt). Chào đủ lâu cho mạng chậm (60 giây),
  // sau đó vẫn chào nhắc lại để giữ kết nối nếu trình phát tự khởi động lại.
  chao();
  let soLanChao = 0;
  const nhac = window.setInterval(() => {
    if (daHuy) {
      window.clearInterval(nhac);
      return;
    }
    if (!daNhan && ++soLanChao > 60) {
      window.clearInterval(nhac);
      return;
    }
    chao();
  }, 1000);

  const baoTrangThai = () => khiDoi({ giay, tong, dangPhat, tatTieng, ketThuc });

  return {
    sanSang: () => daNhan,
    phat: () => {
      choPhat = true;
      choDung = false;
      ketThuc = false;
      gui("playVideo");
    },
    dung: () => {
      choPhat = false;
      choDung = true;
      gui("pauseVideo");
    },
    tua: (d) => {
      if (tong <= 0) {
        gui("seekTo", [Math.max(0, giay + d), true]);
        lucGuiSeek = Date.now();
        return;
      }
      ketThuc = false;
      const moi = Math.max(0, Math.min(tong - 0.5, giay + d));
      gui("seekTo", [moi, true]);
      lucGuiSeek = Date.now();
      giay = moi; // cập nhật ngay: bấm phím liên tiếp không bị tính từ vị trí cũ
      baoTrangThai();
    },
    toi: (tiLe) => {
      if (tong <= 0) return;
      ketThuc = false;
      const moi = Math.max(0, Math.min(tong - 0.5, tiLe * tong));
      gui("seekTo", [moi, true]);
      lucGuiSeek = Date.now();
      giay = moi;
      baoTrangThai();
    },
    /**
     * Chỉ cập nhật giao diện khi ĐANG KÉO thanh. Lý do: kéo trên máy tính phát ra hàng chục sự kiện
     * mỗi giây; gửi `seekTo` cho từng sự kiện thì YouTube xử lý không kịp, lệnh sau đè lệnh trước và
     * người xem thấy thanh nhảy loạn. Kéo xong (thả tay) mới gửi đúng một lệnh — xem `thoiKeo` trong
     * `VideoFeedDoc`.
     */
    xemTruoc: (tiLe) => {
      if (tong <= 0) return;
      giay = Math.max(0, Math.min(tong - 0.5, tiLe * tong));
      baoTrangThai();
    },
    tocDo: (heSo) => {
      tocDoMong = heSo;
      gui("setPlaybackRate", [heSo]);
    },
    tieng: (tat) => {
      tiengMong = tat;
      gui(tat ? "mute" : "unMute");
      tatTieng = tat;
      baoTrangThai();
    },
    huy: () => {
      daHuy = true;
      window.removeEventListener("message", nghe);
      window.clearInterval(nhac);
    },
  };
}
