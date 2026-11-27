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
}

export interface DieuKhienYouTube {
  /** YouTube đã trả lời ít nhất một `infoDelivery` chưa (chưa thì đừng dựng nút của mình). */
  sanSang: () => boolean;
  phat: () => void;
  dung: () => void;
  /** Tua tương đối (giây âm = lùi). Không vượt quá đầu/cuối video. */
  tua: (giay: number) => void;
  /** Tua theo tỉ lệ 0–1 (bấm/kéo thanh tiến trình). */
  toi: (tiLe: number) => void;
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
  khiDoi: (t: TrangThaiYouTube) => void
): DieuKhienYouTube {
  // Mã phiên riêng: nhiều khung cùng trang thì mỗi khung một mã.
  const ma = `nooi-${Math.random().toString(36).slice(2, 9)}`;
  let giay = 0;
  let tong = 0;
  let dangPhat = false;
  let tatTieng = false;
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
    if (typeof i.currentTime === "number") giay = i.currentTime;
    if (typeof i.duration === "number" && i.duration > 0) tong = i.duration;
    // 1 = đang phát, 3 = đang đệm (vẫn coi là đang phát)
    if (typeof i.playerState === "number") dangPhat = i.playerState === 1 || i.playerState === 3;
    if (typeof i.muted === "boolean") tatTieng = i.muted;
    daNhan = true;
    khiDoi({ giay, tong, dangPhat, tatTieng });
  };

  window.addEventListener("message", nghe);

  // Chào ngay, rồi chào lại vài nhịp: iframe vừa vào DOM thì khung bên trong chưa sẵn sàng,
  // lệnh gửi quá sớm bị bỏ im lặng (không có lỗi để bắt).
  chao();
  let soLanChao = 0;
  const nhac = window.setInterval(() => {
    if (daHuy || daNhan || ++soLanChao > 8) {
      window.clearInterval(nhac);
      return;
    }
    chao();
  }, 600);

  const baoTrangThai = () => khiDoi({ giay, tong, dangPhat, tatTieng });

  return {
    sanSang: () => daNhan,
    phat: () => gui("playVideo"),
    dung: () => gui("pauseVideo"),
    tua: (d) => {
      if (tong <= 0) {
        gui("seekTo", [Math.max(0, giay + d), true]);
        return;
      }
      const moi = Math.max(0, Math.min(tong - 0.5, giay + d));
      gui("seekTo", [moi, true]);
      giay = moi; // cập nhật ngay: bấm phím liên tiếp không bị tính từ vị trí cũ
      baoTrangThai();
    },
    toi: (tiLe) => {
      if (tong <= 0) return;
      const moi = Math.max(0, Math.min(tong - 0.5, tiLe * tong));
      gui("seekTo", [moi, true]);
      giay = moi;
      baoTrangThai();
    },
    tieng: (tat) => {
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
