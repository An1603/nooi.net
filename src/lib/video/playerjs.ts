/**
 * Nạp player.js của Bunny để điều khiển trình phát Stream từ trang của mình.
 *
 * Hai điều bắt buộc theo tài liệu Bunny (docs/stream/player/nextjs):
 *   1. player.js đọc `window` lúc nạp -> chỉ chạy ở trình duyệt.
 *   2. player.js phải nạp XONG TRƯỚC khi iframe bắt đầu tải. Iframe tải xong trước thì
 *      thông điệp "ready" không còn được nhớ và Player không bao giờ kết nối.
 *      => Trang phải nạp thư viện trước, rồi mới gắn iframe (xem VideoFeedDoc).
 *
 * Dùng bản trên CDN của Bunny (assets.mediadelivery.net) đúng như tài liệu, không cần npm.
 */

export interface PlayerGiaoDien {
  on(event: string, cb: (du: unknown) => void): void;
  play(): void;
  pause(): void;
  mute(): void;
  unmute(): void;
  getPaused(cb: (dang: boolean) => void): void;
  getCurrentTime(cb: (giay: number) => void): void;
  getDuration(cb: (giay: number) => void): void;
  setCurrentTime(giay: number): void;
}

export interface TimeUpdate {
  seconds: number;
  duration: number;
}

interface Cua {
  playerjs?: { Player: new (iframe: HTMLIFrameElement) => PlayerGiaoDien };
}

let dangNap: Promise<void> | null = null;

const DUONG_DAN = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";

/** Nạp player.js một lần cho cả trang; gọi lại thì trả về đúng lời hứa cũ. */
export function napPlayerJs(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("player.js chỉ nạp được ở trình duyệt"));
  }
  if ((window as unknown as Cua).playerjs) return Promise.resolve();
  if (dangNap) return dangNap;

  dangNap = new Promise<void>((xong, loi) => {
    const s = document.createElement("script");
    s.src = DUONG_DAN;
    s.async = true;
    s.onload = () => xong();
    s.onerror = () => {
      dangNap = null;
      loi(new Error("Không nạp được player.js từ Bunny"));
    };
    document.head.appendChild(s);
  });

  return dangNap;
}

/** Tạo đối tượng điều khiển cho một iframe Bunny đã gắn vào DOM. */
export function taoPlayer(iframe: HTMLIFrameElement): PlayerGiaoDien | null {
  const cua = (window as unknown as Cua).playerjs;
  if (!cua) return null;
  try {
    return new cua.Player(iframe);
  } catch {
    return null;
  }
}

/** Lấy số giây từ dữ liệu sự kiện timeupdate (player.js trả về object). */
export function docTimeUpdate(du: unknown): TimeUpdate | null {
  if (!du || typeof du !== "object") return null;
  const o = du as Partial<TimeUpdate>;
  if (typeof o.seconds !== "number") return null;
  return { seconds: o.seconds, duration: typeof o.duration === "number" ? o.duration : 0 };
}
