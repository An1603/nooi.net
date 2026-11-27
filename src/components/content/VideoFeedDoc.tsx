"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, ChevronDown, ChevronUp, Gauge, Info, Lock, Maximize2, Minimize2, Play, Settings, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { thuocBaiHoc } from "@/lib/video/danh-muc";
import { anhBia } from "@/lib/video/anh-bia";
import {
  KENH_PHAT_LABELS,
  KHUNG_HINH_LABELS,
  laKenhPhat,
  laKhungHinh,
  layBunnyMp4,
  nguonPhatDoc,
  type VideoDoc,
} from "@/lib/video/kenh-phat";
import { docTimeUpdate, taoPlayer, type PlayerGiaoDien } from "@/lib/video/playerjs";
import { taoDieuKhienYouTube, type DieuKhienYouTube, type TrangThaiYouTube } from "@/lib/video/youtube";
import { DauChimNooi } from "@/components/content/DauChimNooi";
import { HopDangNhap } from "@/components/video/HopDangNhap";
import { NutChiaSe } from "@/components/video/nut-chia-se";
import { xetQuyenXem, type NguoiXem, type VideoCongKhai } from "@/lib/video/quyen-xem";

interface Props {
  videos: VideoDoc[];
  /** Tên luồng / danh mục hiện ở góc trên (vd "Măng Đen") */
  tieuDe?: string;
  /** Nơi quay về khi bấm X */
  duongDanDong?: string;
  /** Đường dẫn ghi nhịp xem (đo lường) */
  duongDanDo?: string;
  /**
   * Gom thông tin lại thành 1 dòng, chạm mới mở ra — mặc định BẬT để ưu tiên màn hình cho video.
   * Đặt false khi cần mở sẵn (trang xem riêng).
   */
  thuGon?: boolean;
  /**
   * Tiền tố đường dẫn mở một bài (mặc định khu nội bộ `/app/videos`). Trang công khai truyền
   * `/video` để các lối "Mở bài" trỏ đúng chỗ.
   */
  tienToBai?: string;
  /**
   * Người đang xem — CHỈ truyền ở trang công khai. Có giá trị ⇒ luồng tự áp cổng gác quyền
   * (`xetQuyenXem`) cho từng video; không truyền (khu nội bộ) ⇒ không gác, giữ nguyên hành vi cũ.
   *
   * Truyền ĐỐI TƯỢNG DỮ LIỆU thường, không truyền hàm: hàm không qua được ranh giới
   * máy chủ/trình duyệt của Next.
   */
  nguoiCongKhai?: NguoiXem | null;
  /** Địa chỉ quay lại sau khi đăng nhập (hộp thoại đăng nhập ngay trong luồng). */
  quayLaiDangNhap?: string;
  /** Mở luồng ngay tại video này — dùng cho trang công khai `/video/<mã>`. */
  batDauId?: string;
}

/** 95 → "1:35" — hiện trên thanh tiến trình. */
function phutGiay(giay?: number | null): string {
  if (giay === null || giay === undefined || !Number.isFinite(giay) || giay < 0) return "0:00";
  const m = Math.floor(giay / 60);
  const s = Math.floor(giay % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Luồng xem kiểu vuốt cho kho video NOOI — dùng cho cả luồng dọc lẫn danh mục trộn khổ hình.
 *
 * Nguyên tắc đã chốt:
 *   1. Mỗi video một khung cao đúng màn hình; cuộn dọc có "bám" (scroll-snap) nên vuốt là sang video.
 *   2. KHUNG HÌNH TỰ KHỚP TỈ LỆ: video dọc (9:16) dựng theo chiều cao màn hình, video ngang (16:9)
 *      dựng theo chiều rộng nhưng không vượt quá chiều cao màn hình. Nhờ vậy một danh mục trộn
 *      cả dọc lẫn ngang vẫn xem được trọn hình, không bị cắt, cũng không thừa dải đen vô ích.
 *   3. Chỉ gắn trình phát cho video đang xem và 2 video kề bên -> không tải cả luồng, tiết kiệm 4G.
 *   4. Phủ một lớp nhận thao tác chạm lên trên iframe: nếu để ngón tay chạm vào chính iframe thì
 *      trang cha KHÔNG nhận được thao tác vuốt. Lớp phủ lo việc vuốt, còn phát/dừng do mình điều khiển.
 *   5. Ưu tiên tự phát CÓ TIẾNG: thử trước, bị trình duyệt chặn thì tạm phát tắt tiếng rồi mở tiếng
 *      ngay ở cú tương tác đầu tiên (chạm / bấm phím / lăn chuột / cuộn).
 *   6. Dấu chìm NOOI (chữ trắng + ©) trôi chậm trên khung hình — xem `DauChimNooi`.
 *   7. Thời gian xem từng video gửi về /api/track để đo mức độ xem thật.
 */
export function VideoFeedDoc({
  videos,
  tieuDe,
  duongDanDong = "/app/videos",
  duongDanDo = "/app/short",
  thuGon = true,
  tienToBai = "/app/videos",
  nguoiCongKhai = null,
  quayLaiDangNhap = "/app",
  batDauId,
}: Props) {
  const nguon = useMemo(() => videos.map((v) => nguonPhatDoc(v)), [videos]);

  /** Cổng gác quyền từng video — chỉ tính khi trang công khai có truyền người đang xem */
  const kqQuyen = useMemo(
    () =>
      videos.map((v) =>
        nguoiCongKhai ? xetQuyenXem(v as unknown as VideoCongKhai, nguoiCongKhai) : null
      ),
    [videos, nguoiCongKhai]
  );

  /** Vị trí mở luồng — trang công khai mở đúng video người xem vừa bấm */
  const iBatDau = useMemo(() => {
    if (!batDauId) return 0;
    const i = videos.findIndex((v) => v.id === batDauId);
    return i > 0 ? i : 0;
  }, [batDauId, videos]);

  const khung = useRef<HTMLDivElement | null>(null);
  const mucRef = useRef<(HTMLElement | null)[]>([]);
  const videoRef = useRef<(HTMLVideoElement | null)[]>([]);
  const playerRef = useRef<(PlayerGiaoDien | null)[]>([]);
  /** Bộ điều khiển iframe YouTube (postMessage) — xem `src/lib/video/youtube.ts` */
  const ytRef = useRef<(DieuKhienYouTube | null)[]>([]);
  /**
   * Nguồn phát mới nhất, để hàm gắn iframe (được đệm theo khung) đọc được giá trị hiện tại
   * thay vì giá trị của lần dựng đầu tiên.
   */
  const nguonRef = useRef(nguon);
  nguonRef.current = nguon;
  /** Danh sách bài hiện tại — hàm gắn iframe đọc thời lượng dự phòng từ đây. */
  const videosRef = useRef(videos);
  videosRef.current = videos;
  const iRef = useRef(iBatDau);
  const tiengRef = useRef(true);

  const [iDangXem, setIDangXem] = useState(iBatDau);
  /** Video đang mời đăng nhập (chỉ ở trang công khai) */
  const [videoXinQuyen, setVideoXinQuyen] = useState<{ v: VideoDoc; moTa: string } | null>(null);

  /** Video thứ i có bị khoá theo cổng gác không */
  const biKhoa = useCallback(
    (i: number) => {
      const q = kqQuyen[i];
      return !!q && !q.mo;
    },
    [kqQuyen]
  );
  const [tatTieng, setTatTieng] = useState(true);
  const [dangPhat, setDangPhat] = useState(true);
  /**
   * Khung nào đã "nói chuyện" được với iframe YouTube (đã nhận `infoDelivery`).
   * Chỉ khi đó mới dựng thanh tua / nút loa của mình — chưa nói chuyện được thì để nguyên
   * nút của YouTube, KHÔNG dựng nút vô tác dụng (pitfall 53 của skill nooi-kho-video).
   */
  const [ytSong, setYtSong] = useState<Record<number, boolean>>({});
  const [tienTrinh, setTienTrinh] = useState(0);
  /** Thông tin đang mở hay thu gọn (mặc định thu gọn cho thoáng màn hình) */
  const [moThongTin, setMoThongTin] = useState(!thuGon);
  /**
   * Máy cảm ứng hay không. Trên MÁY TÍNH ta KHÔNG phủ lớp nhận chạm lên iframe, vì phủ là
   * cú bấm không bao giờ tới được nút điều khiển gốc của nền tảng — người dùng thành ra
   * không phát được video. Lớp phủ chỉ cần cho máy cảm ứng (để vuốt).
   */
  const [coCham, setCoCham] = useState(false);
  /** Video đang xem nhưng tải tệp thất bại (mạng chặn miền CDN) — để báo rõ và cho đường lui */
  const [loiPhat, setLoiPhat] = useState<number | null>(null);

  /** Mở bảng cài đặt (chất lượng · tốc độ) */
  const [moCaiDat, setMoCaiDat] = useState(false);
  /** Mức chất lượng người xem chọn cho TỪNG bài (chưa chọn = để trình duyệt tự lo) */
  const [mucChatLuong, setMucChatLuong] = useState<Record<number, string>>({});
  /** Danh sách mức chất lượng THẬT (hỏi máy chủ khi mở bảng cài đặt). null = đang hỏi */
  const [dsChatLuong, setDsChatLuong] = useState<string[] | null>(null);
  /** Danh sách trên thuộc về bài nào — đổi bài thì hỏi lại */
  const [dsCuaBai, setDsCuaBai] = useState<string | null>(null);
  /** Tốc độ phát — nhớ lại cho lần sau */
  const [tocDo, setTocDo] = useState(1);
  /** Giây đang phát / tổng giây, để hiện trên thanh tiến trình */
  const [thoiGian, setThoiGian] = useState({ giay: 0, tong: 0 });

  const batDau = useRef(Date.now());
  /** Số lần đã thử phát lại video đang xem (trình duyệt chặn tự phát thì phải chờ người dùng chạm) */
  const soLanThu = useRef(0);
  /** Vùng bắt cú bấm/kéo của thanh tiến trình */
  const thanhRef = useRef<HTMLDivElement | null>(null);
  /** Đang kéo thanh tiến trình? (lúc kéo thì không đổi vị trí theo sự kiện phát) */
  const keoRef = useRef(false);
  /** Tốc độ phát hiện hành — thẻ mới gắn vào đọc giá trị này */
  const tocDoRef = useRef(1);

  /* ── Giữ màn hình cho VIDEO ──
     Thanh trên, cột nút, thanh dưới tự mờ đi sau 3,2 giây khi video đang phát, hiện lại khi người
     xem động vào (rê chuột / chạm / bấm phím). Tạm dừng hay đang mở bảng thì GIỮ nguyên — lúc đó
     người xem đang cần nút. Thanh tiến trình thì luôn hiện vì nó chỉ cao 3 px. */
  const [hienChrome, setHienChrome] = useState(true);
  const henChrome = useRef<number | null>(null);
  /** Trình duyệt có cho mở toàn màn hình thật không (iPhone Safari không cho với thẻ <div>) */
  const [coToanManHinh, setCoToanManHinh] = useState(false);
  const [dangToanManHinh, setDangToanManHinh] = useState(false);

  /** Ghi nhịp xem về máy chủ: đã xem video này bao nhiêu giây. */
  const ghiNhip = useCallback(
    (i: number, giay: number) => {
      const video = videos[i];
      if (!video || giay < 2) return;
      try {
        fetch("/api/track", {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          // `d` mang cả mã video để đo được từng bài (api/track chỉ nhận t/path/referrer/giây)
          body: JSON.stringify({ t: "nhip", d: `${duongDanDo}?v=${video.id}`, g: Math.round(giay) }),
        }).catch(() => {});
      } catch {
        /* không chặn trải nghiệm vì lỗi đo lường */
      }
    },
    [videos, duongDanDo]
  );

  const doTieng = useCallback((i: number, tat: boolean) => {
    const v = videoRef.current[i];
    if (v) v.muted = tat;
    // Ở chế độ tắt tiếng: giữ tiếng tắt. Bật tiếng: chỉ bật cho video đang xem.
    playerRef.current.forEach((p, j) => {
      if (!p) return;
      if (tat || j !== i) p.mute();
      else p.unmute();
    });
  }, []);

  const phat = useCallback(
    (i: number) => {
      const n = nguon[i];
      if (!n || n.kieu === "khong") return;
      if (biKhoa(i)) return; // video còn khoá thì không có gì để phát
      const v = videoRef.current[i];
      if (v) {
        // KHÔNG đụng tới `muted` ở đây. Trước đây chỗ này gán `v.muted = tiengRef.current` và vì
        // chạy chen giữa lúc mở tiếng nên tắt lại video vừa mở tiếng (nút loa nói dối trạng thái).
        // Tiếng do `thuPhat` (lúc mở), `doiTieng` (người xem bấm) và `doTieng` quyết định.
        void v.play().catch(() => setDangPhat(false));
        return;
      }
      const yt = ytRef.current[i];
      if (yt) {
        yt.phat();
        return;
      }
      const p = playerRef.current[i];
      if (p) {
        if (tiengRef.current) p.mute();
        else p.unmute();
        p.play();
      }
    },
    [nguon, biKhoa]
  );

  const dung = useCallback((i: number) => {
    const v = videoRef.current[i];
    if (v) {
      v.pause();
      return;
    }
    const yt = ytRef.current[i];
    if (yt) {
      yt.dung();
      return;
    }
    playerRef.current[i]?.pause();
  }, []);

  // 1. KHÔNG nạp player.js của Bunny nữa: luồng xem phát tệp CDN bằng thẻ <video> của mình, còn
  //    nạp từ `assets.mediadelivery.net` chỉ tốn một yêu cầu tới miền mà nhiều mạng chặn hẳn.
  //    (Nếu về sau cần điều khiển iframe thì `taoPlayer` tự trả về null khi thiếu player.js —
  //    xem `ganIframe` — nên không có gì vỡ.)

  // 2. Biết video nào đang chiếm phần lớn màn hình
  useEffect(() => {
    const goc = khung.current;
    if (!goc) return;
    const io = new IntersectionObserver(
      (ds) => {
        ds.forEach((d) => {
          if (!d.isIntersecting || d.intersectionRatio < 0.6) return;
          const i = Number((d.target as HTMLElement).dataset.i);
          if (!Number.isNaN(i)) setIDangXem(i);
        });
      },
      { root: goc, threshold: [0.6] }
    );
    mucRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [videos.length]);

  // 2b. Mở luồng đúng video người xem vừa bấm (trang công khai `/video/<mã>`)
  useEffect(() => {
    if (iBatDau === 0) return;
    const goc = khung.current;
    const el = mucRef.current[iBatDau];
    if (!goc || !el) return;
    goc.scrollTop = el.offsetTop;
    iRef.current = iBatDau;
    setIDangXem(iBatDau);
  }, [iBatDau]);

  // 3. Đổi video: dừng video cũ, phát video mới, ghi lại thời gian đã xem của video cũ
  useEffect(() => {
    const truoc = iRef.current;
    const giay = (Date.now() - batDau.current) / 1000;
    if (truoc !== iDangXem) ghiNhip(truoc, giay);

    iRef.current = iDangXem;
    batDau.current = Date.now();
    setTienTrinh(0);
    setDangPhat(true);

    videos.forEach((_, i) => {
      if (i !== iDangXem) dung(i);
    });
    phat(iDangXem);
  }, [iDangXem, videos, dung, phat, ghiNhip]);

  // 4. Rời trang: ghi nốt thời gian xem của video cuối
  useEffect(() => {
    return () => {
      ghiNhip(iRef.current, (Date.now() - batDau.current) / 1000);
    };
  }, [ghiNhip]);

  // 5. Biết máy có cảm ứng hay không (quyết định có phủ lớp nhận chạm hay không)
  useEffect(() => {
    const doi = () => setCoCham(window.matchMedia("(pointer: coarse)").matches);
    doi();
    const mq = window.matchMedia("(pointer: coarse)");
    mq.addEventListener?.("change", doi);
    return () => mq.removeEventListener?.("change", doi);
  }, []);

  // 5b. Nhớ tốc độ phát người xem đã chọn lần trước (mặc định 1×)
  useEffect(() => {
    try {
      const t = Number(localStorage.getItem("nooi-toc-do"));
      if (Number.isFinite(t) && t >= 0.25 && t <= 4) {
        tocDoRef.current = t;
        setTocDo(t);
      }
    } catch {
      /* trình duyệt chặn bộ nhớ tạm — dùng mặc định */
    }
  }, []);

  // 5c. Áp tốc độ cho bài đang xem, và cho bài mới khi vuốt sang (đổi nguồn tệp cũng áp lại)
  useEffect(() => {
    const el = videoRef.current[iDangXem];
    if (el) el.playbackRate = tocDo;
  }, [tocDo, iDangXem, mucChatLuong]);

  /**
   * 6. Đồng bộ trạng thái nút với THỰC TẾ của trình phát.
   * Không có bước này, nút có thể nói "đang phát" trong khi video chưa hề chạy (người dùng bấm
   * lần đầu hoá ra là lệnh tạm dừng -> không thấy gì xảy ra). Đồng thời thử phát lại vài lần:
   * trình duyệt chặn tự phát thì chỉ phát được sau khi người dùng đã chạm vào trang.
   */
  useEffect(() => {
    soLanThu.current = 0;
    const kiem = () => {
      // Thẻ <video> của mình: trạng thái đọc thẳng từ phần tử
      const v = videoRef.current[iDangXem];
      if (v) {
        setDangPhat(!v.paused);
        if (v.paused && soLanThu.current < 5) {
          soLanThu.current += 1;
          void v.play().catch(() => {});
        }
        return;
      }
      const p = playerRef.current[iDangXem];
      if (!p) return;
      try {
        p.getPaused((dang) => {
          setDangPhat(!dang);
          if (dang && soLanThu.current < 5) {
            soLanThu.current += 1;
            p.play();
          }
        });
      } catch {
        /* trình phát cũ không hỗ trợ getPaused -> bỏ qua */
      }
    };
    kiem();
    const id = setInterval(kiem, 1200);
    return () => clearInterval(id);
  }, [iDangXem]);

  // 7. Cú tương tác ĐẦU TIÊN của người xem vừa là "vé" cho phép phát, vừa là dịp MỞ TIẾNG nếu lúc
  //    mở video trình duyệt đã chặn tự phát có tiếng. Nghe cả lăn chuột và cuộn (máy tính) vì người
  //    xem thường vuốt/lăn chuột mà không bấm.
  useEffect(() => {
    const su: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    const bat = () => {
      su.forEach((k) => window.removeEventListener(k, bat, true));
      soLanThu.current = 0;
      if (choMoTieng.current) {
        choMoTieng.current = false;
        tiengRef.current = false;
        doTieng(iRef.current, false);
        setTatTieng(false);
      }
      phat(iRef.current);
    };
    su.forEach((k) => window.addEventListener(k, bat, { passive: true, capture: true }));
    return () => su.forEach((k) => window.removeEventListener(k, bat, true));
  }, [phat, doTieng]);

  /** Gắn iframe: YouTube → bộ điều khiển postMessage; Bunny → đối tượng điều khiển của player.js. */
  const ganIframe = useCallback(
    (i: number) => (el: HTMLIFrameElement | null) => {
      // Gỡ khung (hoặc gắn lại): huỷ bộ điều khiển cũ trước, tránh nghe trùng sự kiện
      ytRef.current[i]?.huy();
      ytRef.current[i] = null;
      if (!el) {
        playerRef.current[i] = null;
        setYtSong((x) => {
          if (!x[i]) return x;
          const y = { ...x };
          delete y[i];
          return y;
        });
        return;
      }

      // ── YouTube: điều khiển bằng postMessage (phát/dừng, tua, tiếng) ──
      const ytId = nguonRef.current[i]?.youtubeId;
      if (ytId) {
        ytRef.current[i] = taoDieuKhienYouTube(el, (t: TrangThaiYouTube) => {
          if (i !== iRef.current) return;
          // Chỉ bật nút loa của mình khi YouTube đã trả lời — chưa trả lời thì để nút của YouTube
          setYtSong((x) => (x[i] ? x : { ...x, [i]: true }));
          setThoiGian({ giay: t.giay, tong: t.tong });
          setTienTrinh(t.tong > 0 ? Math.min(100, (t.giay / t.tong) * 100) : 0);
          setDangPhat(t.dangPhat);
          setTatTieng(t.tatTieng);
          tiengRef.current = t.tatTieng;
        // Thời lượng dự phòng: bấm/kéo thanh trước khi YouTube kịp trả lời vẫn quy đổi được ra giây
        }, videosRef.current[i]?.duration ?? 0);
        return;
      }

      const p = taoPlayer(el);
      if (!p) return;
      playerRef.current[i] = p;
      p.on("ready", () => {
        if (tiengRef.current) p.mute();
        if (i === iRef.current) p.play();
      });
      p.on("timeupdate", (du: unknown) => {
        const t = docTimeUpdate(du);
        if (!t || i !== iRef.current) return;
        setTienTrinh(t.duration > 0 ? Math.min(100, (t.seconds / t.duration) * 100) : 0);
      });
      p.on("pause", () => {
        if (i === iRef.current) setDangPhat(false);
      });
      p.on("play", () => {
        if (i === iRef.current) setDangPhat(true);
      });
      // Chưa kết nối được ngay sau khi gắn -> thử lại một nhịp
      setTimeout(() => {
        if (i === iRef.current) p.play();
      }, 600);
    },
    []
  );

  /** Khung đã tự phát lần đầu — chốt chống tự phát đè lên thao tác của người xem. */
  const daTuPhat = useRef<Set<number>>(new Set());

  /** Còn "nợ" tiếng: trình duyệt chặn tự phát có tiếng nên tạm phát tắt tiếng, chờ cú tương tác đầu. */
  const choMoTieng = useRef(false);

  /**
   * Phát video, **ƯU TIÊN CÓ TIẾNG**.
   *
   * Vì sao phải thử rồi mới biết: trình duyệt chỉ cho tự phát CÓ TIẾNG khi người xem đã "thân" với
   * trang này; chưa đủ thì nó chặn (NotAllowedError). Nên: thử có tiếng trước — được thì mở tiếng
   * luôn; bị chặn thì phát tắt tiếng ngay để người xem thấy hình, đồng thời ghi nhớ "còn nợ tiếng"
   * để cú tương tác đầu tiên (chạm, bấm phím, lăn chuột, cuộn) mở tiếng. Không hẹn giờ mở tiếng:
   * mở tiếng mà không có tương tác thì trình duyệt cũng chặn, thậm chí dừng luôn video.
   */
  const thuPhat = useCallback(async (el: HTMLVideoElement) => {
    el.volume = 1;
    el.muted = false;
    // Ghi trạng thái tiếng NGAY (trước khi chờ play) — nếu để sau `await`, mã khác chạy xen vào sẽ
    // đọc phải giá trị CŨ (đang tắt tiếng) rồi tắt lại video vừa mở tiếng. Đây chính là lỗi làm
    // “nút loa ghi có tiếng mà không nghe thấy gì”.
    tiengRef.current = false;
    try {
      await el.play();
      // Trình duyệt có thể nhận lệnh nhưng VẪN giữ tắt tiếng -> phải đọc lại mới biết
      if (!el.muted) {
        choMoTieng.current = false;
        setTatTieng(false);
        return;
      }
    } catch {
      /* bị chặn -> phát tắt tiếng */
    }
    el.muted = true;
    tiengRef.current = true;
    choMoTieng.current = true;
    setTatTieng(true);
    await el.play().catch(() => setDangPhat(false));
  }, []);

  /** Gắn thẻ <video> của mình (tệp trực tiếp). */
  const ganVideo = useCallback(
    (i: number) => (el: HTMLVideoElement | null) => {
      videoRef.current[i] = el;
      if (!el) return;
      el.muted = tiengRef.current;
      // Tốc độ phát người xem đã chọn (nhớ từ lần trước) áp luôn cho thẻ mới
      el.playbackRate = tocDoRef.current;
      el.addEventListener("loadedmetadata", () => {
        if (i !== iRef.current) return;
        setThoiGian({ giay: el.currentTime || 0, tong: el.duration || 0 });
      });
      el.addEventListener("timeupdate", () => {
        if (i !== iRef.current || !el.duration) return;
        if (keoRef.current) return; // đang kéo thanh tiến trình thì để người xem quyết định
        setTienTrinh(Math.min(100, (el.currentTime / el.duration) * 100));
        setThoiGian({ giay: el.currentTime, tong: el.duration });
      });
      el.addEventListener("pause", () => {
        if (i === iRef.current) setDangPhat(false);
      });
      el.addEventListener("play", () => {
        if (i === iRef.current) setDangPhat(true);
      });
      /**
       * Nút loa phải nói ĐÚNG thực tế của thẻ. Trình duyệt có thể tự đổi tiếng sau lưng mình
       * (chặn tự phát có tiếng, hoặc nhận lệnh nhưng vẫn giữ tắt tiếng) — nghe sự kiện này thì
       * nút không bao giờ lệch trạng thái nữa.
       */
      el.addEventListener("volumechange", () => {
        if (i !== iRef.current) return;
        const tat = el.muted || el.volume === 0;
        tiengRef.current = tat;
        setTatTieng(tat);
      });
      // Tự phát ĐÚNG MỘT LẦN cho mỗi khung. Không có chốt này thì mỗi lần React gỡ–gắn lại thẻ,
      // video tự phát lại và đè lên thao tác tạm dừng của người xem.
      if (i === iRef.current && !daTuPhat.current.has(i)) {
        daTuPhat.current.add(i);
        void thuPhat(el);
        return;
      }
      // Khung khác: theo cài đặt tiếng chung, KHÔNG tự phát (chỉ phát khi thành khung đang xem)
      el.muted = tiengRef.current;
    },
    [thuPhat]
  );

  /**
   * Hàm gắn thẻ ỔN ĐỊNH cho từng khung.
   *
   * Vì sao cần: `ref={ganVideo(i)}` tạo ra HÀM MỚI ở mỗi lần dựng lại, React thấy hàm đổi nên
   * **gỡ rồi gắn lại** thẻ — kéo theo `el.play()` chạy lại và các trình nghe bị gắn trùng. Hậu quả
   * nhìn thấy được: bấm chuột để tạm dừng thì video tự phát lại ngay, phím cách cũng "không ăn".
   * Giữ một hàm cố định cho mỗi khung là hết.
   */
  const nhoIframe = useRef(new Map<number, (el: HTMLIFrameElement | null) => void>());
  const nhoVideo = useRef(new Map<number, (el: HTMLVideoElement | null) => void>());
  const refIframe = (i: number) => {
    let f = nhoIframe.current.get(i);
    if (!f) {
      f = ganIframe(i);
      nhoIframe.current.set(i, f);
    }
    return f;
  };
  const refVideo = (i: number) => {
    let f = nhoVideo.current.get(i);
    if (!f) {
      f = ganVideo(i);
      nhoVideo.current.set(i, f);
    }
    return f;
  };

  const cuon = useCallback((i: number) => {
    const el = mucRef.current[i];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Chạm vào khung: tạm dừng / tiếp tục (chỉ với nguồn điều khiển được). */
  const bamVao = useCallback(
    (i: number) => {
      if (i !== iRef.current) {
        cuon(i);
        return;
      }
      if (biKhoa(i)) {
        const q = kqQuyen[i];
        const v = videos[i];
        if (v) setVideoXinQuyen({ v, moTa: q?.moTa ?? "Video này dành cho thành viên NOOI." });
        return;
      }
      if (!nguon[i]?.dieuKhien && !ytRef.current[i]) return;
      // Người dùng đã chủ động bấm: khoá luôn vòng thử tự phát, đừng để nó bật lại video
      soLanThu.current = 5;
      if (dangPhat) {
        dung(i);
        setDangPhat(false);
      } else {
        phat(i);
        setDangPhat(true);
      }
    },
    [nguon, dangPhat, dung, phat, cuon, biKhoa, kqQuyen, videos]
  );

  /* ───────── Thanh tiến trình: bấm và kéo để tua ───────── */

  /** Vị trí thật trên thanh tiến trình (0–1) theo toạ độ ngang của cú chạm/kéo */
  const tiLeTheoX = useCallback((clientX: number) => {
    const r = thanhRef.current?.getBoundingClientRect();
    if (!r || r.width <= 0) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  }, []);

  /** Vị trí cuối cùng người xem kéo tới (chưa gửi lệnh) — gửi khi thả tay. */
  const tiLeKeoRef = useRef(0);

  /**
   * Đặt vị trí phát theo tỉ lệ 0–1.
   *
   * `guiNgay = false` dùng khi ĐANG KÉO: chỉ cập nhật giao diện, để lệnh seekTo đi đúng một lần
   * lúc thả tay. Với iframe YouTube, gửi lệnh theo từng điểm di chuột thì lệnh sau đè lệnh trước
   * và thanh nhảy loạn (Ngài An báo 27/11/2026: “kéo thanh chưa tua được”).
   */
  const datViTri = useCallback((tiLe: number, guiNgay = true) => {
    tiLeKeoRef.current = tiLe;
    const el = videoRef.current[iRef.current];
    if (el && el.duration && Number.isFinite(el.duration)) {
      const giay = tiLe * el.duration;
      try {
        el.currentTime = giay;
      } catch {
        /* tệp chưa tải đủ phần đó — trình duyệt tự bỏ qua */
      }
      setTienTrinh(tiLe * 100);
      setThoiGian((x) => ({ ...x, giay }));
      return;
    }
    const yt = ytRef.current[iRef.current];
    if (!yt) return;
    if (guiNgay) yt.toi(tiLe);
    else yt.xemTruoc(tiLe);
  }, []);

  const batDauKeo = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      keoRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      datViTri(tiLeTheoX(e.clientX));
    },
    [datViTri, tiLeTheoX]
  );

  const dangKeo = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!keoRef.current) return;
      e.stopPropagation();
      // Kéo: chỉ chạy thanh theo tay. Lệnh seek được gửi đúng một lần khi thả (xem `thoiKeo`).
      datViTri(tiLeTheoX(e.clientX), false);
    },
    [datViTri, tiLeTheoX]
  );

  const thoiKeo = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    keoRef.current = false;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* con trỏ đã được nhả */
    }
    // Thả tay: gửi lệnh tua cuối cùng cho iframe YouTube (tệp video đã seek ngay lúc kéo)
    const yt = ytRef.current[iRef.current];
    if (yt && !videoRef.current[iRef.current]) yt.toi(tiLeKeoRef.current);
  }, []);

  /** Tua tới/lui một số giây (phím ← →). Không vượt quá đầu/cuối video. */
  const tua = useCallback((giay: number) => {
    const el = videoRef.current[iRef.current];
    if (el && el.duration && Number.isFinite(el.duration)) {
      const moi = Math.min(el.duration - 0.3, Math.max(0, el.currentTime + giay));
      el.currentTime = moi;
      setTienTrinh((moi / el.duration) * 100);
      setThoiGian((x) => ({ ...x, giay: moi }));
      return;
    }
    // iframe YouTube: tua qua postMessage — không đọc được `currentTime` của iframe từ mã,
    // nên bộ điều khiển tự nhớ vị trí nó nhận được từ `infoDelivery` (xem `youtube.ts`).
    ytRef.current[iRef.current]?.tua(giay);
  }, []);

  /* ───────── Cài đặt: chất lượng & tốc độ ───────── */

  /** Hỏi máy chủ danh sách mức chất lượng có THẬT của bài đang xem (mỗi bài một thang khác nhau). */
  const layDsChatLuong = useCallback(
    async (i: number) => {
      const v = videos[i];
      if (!v) return;
      if (dsCuaBai === v.id && dsChatLuong) return; // đã có sẵn cho đúng bài này
      setDsChatLuong(null);
      try {
        const r = await fetch(`/api/video/chat-luong?v=${encodeURIComponent(v.id)}`);
        const d = (await r.json()) as { muc?: string[] };
        setDsChatLuong(Array.isArray(d.muc) ? d.muc : []);
      } catch {
        setDsChatLuong([]);
      } finally {
        setDsCuaBai(v.id);
      }
    },
    [videos, dsCuaBai, dsChatLuong]
  );

  /**
   * Đổi mức chất lượng: đổi nguồn tệp rồi TRẢ LẠI đúng vị trí đang xem — không để người xem
   * bị đẩy về đầu video.
   */
  const chonChatLuong = useCallback((muc: string) => {
    const i = iRef.current;
    const el = videoRef.current[i];
    setMoCaiDat(false);
    if (!el) return;
    const viTri = el.currentTime;
    const dangChay = !el.paused;
    const khoiPhuc = () => {
      el.removeEventListener("loadedmetadata", khoiPhuc);
      try {
        el.currentTime = viTri;
      } catch {
        /* bỏ qua */
      }
      if (dangChay) void el.play().catch(() => {});
    };
    el.addEventListener("loadedmetadata", khoiPhuc);
    setMucChatLuong((x) => ({ ...x, [i]: muc }));
  }, []);

  /** Đổi tốc độ phát — nhớ cho lần xem sau. */
  const doiTocDo = useCallback((t: number) => {
    setTocDo(t);
    tocDoRef.current = t;
    try {
      localStorage.setItem("nooi-toc-do", String(t));
    } catch {
      /* trình duyệt chặn bộ nhớ tạm — không sao */
    }
    const el = videoRef.current[iRef.current];
    if (el) el.playbackRate = t;
  }, []);

  const doiTieng = useCallback(() => {
    const i = iRef.current;
    // iframe YouTube: tiếng do iframe quyết định, ta gửi mute/unMute qua postMessage.
    // Trạng thái thật lấy từ `infoDelivery` (đổ vào `tatTieng`), không đoán.
    const yt = ytRef.current[i];
    if (!videoRef.current[i] && yt) {
      const moi = !tatTieng;
      tiengRef.current = moi;
      setTatTieng(moi);
      yt.tieng(moi);
      return;
    }
    // Lấy trạng thái từ CHÍNH thẻ video (sự thật), không suy từ biến trạng thái — tránh trường hợp
    // nút và thẻ lệch nhau rồi bấm một lần hoá ra lệnh ngược.
    const el = videoRef.current[i];
    const moi = el ? !(el.muted || el.volume === 0) : !tatTieng;
    tiengRef.current = moi;
    choMoTieng.current = false; // người xem đã tự quyết định tiếng -> đừng mở tiếng hộ nữa
    setTatTieng(moi);
    doTieng(i, moi);
  }, [tatTieng, doTieng]);

  // Bàn phím dùng được ở MỌI NƠI trên trang, không phải bấm vào khung trước.
  // Vì sao đổi từ `onKeyDown` của khung sang nghe ở cửa sổ: người xem mở trang rồi bấm phím cách
  // luôn, chứ không ai nghĩ phải bấm vào khung trước — trước đây phím cách vì thế mà "không ăn".
  useEffect(() => {
    const nghe = (e: KeyboardEvent) => {
      const dich = e.target as HTMLElement | null;
      // Đang gõ trong ô nhập (hộp đăng nhập, ô tìm kiếm…) thì đừng cướp phím
      if (
        dich &&
        (dich.tagName === "INPUT" ||
          dich.tagName === "TEXTAREA" ||
          dich.tagName === "SELECT" ||
          dich.isContentEditable)
      ) {
        return;
      }
      if (videoXinQuyen) return; // hộp đăng nhập đang mở
      // Bảng cài đặt đang mở: chỉ nhận Escape, đừng cướp phím tua/chuyển bài
      if (moCaiDat) {
        if (e.key === "Escape") setMoCaiDat(false);
        return;
      }

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          cuon(iRef.current + 1);
          break;
        case "ArrowRight":
          // Tua tới 5 giây — thanh tiến trình cũng bấm/kéo được, nhưng phím thì nhanh hơn
          e.preventDefault();
          tua(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          tua(-5);
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          cuon(iRef.current - 1);
          break;
        case " ":
        case "Spacebar":
          e.preventDefault();
          bamVao(iRef.current);
          break;
        case "m":
        case "M":
          doiTieng();
          break;
        case "i":
        case "I":
          setMoThongTin((x) => !x);
          break;
      }
    };
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  }, [cuon, bamVao, doiTieng, videoXinQuyen, tua, moCaiDat]);

  /** Khung hình tự khớp tỉ lệ với màn hình — xem giải thích ở đầu tệp. */
  const kieuKhung = (v: VideoDoc): React.CSSProperties =>
    v.khung_hinh === "doc"
      ? // Video dọc: cao hết màn hình, bề ngang suy ra từ tỉ lệ
        { aspectRatio: "9 / 16", height: "100dvh", width: "auto", maxWidth: "100vw" }
      : // Video ngang: rộng hết màn hình, chiều cao suy ra — màn hình thấp thì tự thu lại
        { aspectRatio: "16 / 9", width: "100vw", height: "auto", maxHeight: "100dvh" };

  /** Hẹn giờ tự ẩn thanh điều khiển; gọi lại mỗi khi người xem động vào màn hình. */
  const henAnChrome = useCallback(() => {
    if (henChrome.current) window.clearTimeout(henChrome.current);
    setHienChrome(true);
    // Đang tạm dừng, đang mở thông tin / bảng cài đặt / hộp đăng nhập → GIỮ thanh điều khiển
    if (moThongTin || moCaiDat || videoXinQuyen || !dangPhat) return;
    henChrome.current = window.setTimeout(() => setHienChrome(false), 3200);
  }, [moThongTin, moCaiDat, videoXinQuyen, dangPhat]);

  useEffect(() => {
    henAnChrome();
    const thuc = () => henAnChrome();
    window.addEventListener("mousemove", thuc);
    window.addEventListener("touchstart", thuc, { passive: true });
    window.addEventListener("keydown", thuc);
    return () => {
      window.removeEventListener("mousemove", thuc);
      window.removeEventListener("touchstart", thuc);
      window.removeEventListener("keydown", thuc);
      if (henChrome.current) window.clearTimeout(henChrome.current);
    };
  }, [henAnChrome]);

  /** Nút toàn màn hình chỉ hiện khi trình duyệt THẬT SỰ làm được — không dựng nút vô tác dụng. */
  useEffect(() => {
    setCoToanManHinh(typeof document.documentElement.requestFullscreen === "function");
    const doi = () => setDangToanManHinh(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", doi);
    return () => document.removeEventListener("fullscreenchange", doi);
  }, []);

  const batTatToanManHinh = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await (khung.current ?? document.documentElement).requestFullscreen({ navigationUI: "hide" });
    } catch {
      // Trình duyệt từ chối (thường là chính sách của máy) — im lặng, đừng làm phiền người xem
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[80] bg-black text-white" data-feed-doc>
      {/* Đầu luồng: nút QUAY VỀ (góc trái-trên) + tên luồng / số lượng.
          Tự mờ đi khi video đang phát để màn hình dành trọn cho video. */}
      <div
        className={cn(
          "pointer-events-none absolute left-3 top-3 z-30 flex max-w-[70%] items-center gap-2 transition-opacity duration-300",
          hienChrome ? "opacity-100" : "opacity-0"
        )}
      >
        <Link
          href={duongDanDong}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70",
            hienChrome ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-label="Quay về kho video"
          title="Quay về kho video"
        >
          <ArrowLeft size={18} />
        </Link>
        {tieuDe && (
          <span className="pointer-events-auto truncate rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            {tieuDe} · {videos.length} video
          </span>
        )}
      </div>

      {/* Đóng luồng, quay về kho video */}
      <Link
        href={duongDanDong}
        className={cn(
          "absolute right-3 top-3 z-30 flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-opacity duration-300 hover:bg-black/70",
          hienChrome ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-label="Đóng luồng"
      >
        <X size={18} />
      </Link>

      <div
        ref={khung}
        tabIndex={0}
        className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll overscroll-contain focus:outline-none"
        style={{ scrollbarWidth: "none" }}
      >
        {videos.map((v, i) => {
          const n = nguon[i];
          const gan = Math.abs(i - iDangXem) <= 1;
          const q = kqQuyen[i];
          const khoa = !!q && !q.mo;
          const kenh: string = laKenhPhat(v.kenh_phat) ? KENH_PHAT_LABELS[v.kenh_phat] : "Chưa rõ kênh";
          const nhanKhung: string = laKhungHinh(v.khung_hinh)
            ? KHUNG_HINH_LABELS[v.khung_hinh]
            : "Khổ hình khác";
          // Mức chất lượng người xem đã chọn cho bài này (nếu có) — dựng thẳng địa chỉ tệp
          const mucChon = mucChatLuong[i] ?? "";
          const nguonChon =
            mucChon && mucChon !== "tu-dong" && n.bunnyId ? layBunnyMp4(n.bunnyId, mucChon) : null;
          return (
            <section
              key={v.id}
              data-i={i}
              ref={(el) => {
                mucRef.current[i] = el;
              }}
              className="relative flex h-[100dvh] w-full snap-start snap-always items-center justify-center"
            >
              {/* Khung hình tự khớp: dọc theo chiều cao, ngang theo chiều rộng */}
              <div className="relative overflow-hidden bg-black" style={kieuKhung(v)}>
                {!khoa && gan && n.kieu === "iframe" && (
                  <iframe
                    ref={refIframe(i)}
                    src={n.src}
                    title={v.title}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
                {!khoa && gan && n.kieu === "video" && (
                  <video
                    ref={refVideo(i)}
                    {...(nguonChon
                      ? { src: nguonChon }
                      : n.srcDuPhong && n.srcDuPhong.length > 1
                        ? {}
                        : { src: n.src })}
                    className="absolute inset-0 h-full w-full object-contain"
                    poster={anhBia(v.thumbnail_url, { rong: 720 }) || undefined}
                    playsInline
                    loop
                    preload="metadata"
                    onPlay={() => {
                      setLoiPhat(null);
                      if (i === iRef.current) setDangPhat(true);
                    }}
                    onPause={() => {
                      if (i === iRef.current) setDangPhat(false);
                    }}
                    onTimeUpdate={(e) => {
                      if (i !== iRef.current) return;
                      const el = e.currentTarget;
                      if (el.duration > 0) setTienTrinh((el.currentTime / el.duration) * 100);
                    }}
                    onError={() => {
                      if (i === iRef.current) setLoiPhat(i);
                    }}
                  >
                    {/* Thử lần lượt các mức chất lượng: mức cao không có thì tự hạ xuống.
                        Đã chọn mức cụ thể thì thôi, chỉ phát đúng tệp đã chọn. */}
                    {!nguonChon &&
                      n.srcDuPhong &&
                      n.srcDuPhong.length > 1 &&
                      n.srcDuPhong.map((u) => <source key={u} src={u} type="video/mp4" />)}
                  </video>
                )}
                {!khoa && n.kieu === "khong" && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-white/70">
                    {n.lyDo}
                  </div>
                )}
                {/* Video cần quyền: vẫn cho thấy ảnh bìa + ổ khoá, kèm lối đăng nhập ngay tại chỗ */}
                {khoa && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center">
                    {v.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={anhBia(v.thumbnail_url, { rong: 480 }) ?? ""}
                        alt={v.title}
                        className="absolute inset-0 h-full w-full object-contain opacity-35"
                      />
                    )}
                    <span className="relative flex size-14 items-center justify-center rounded-full bg-black/70">
                      <Lock size={22} />
                    </span>
                    <span className="relative rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      {q?.nhan || "Cần quyền xem"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVideoXinQuyen({ v, moTa: q?.moTa ?? "Video này dành cho thành viên NOOI." })}
                      className="relative rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium hover:bg-white/20"
                    >
                      Đăng nhập để xem
                    </button>
                  </div>
                )}

                {/* Tải tệp không được (mạng chặn miền CDN...) -> nói rõ và cho đường lui */}
                {i === loiPhat && n.kieu === "video" && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
                    <p className="max-w-sm text-xs text-white/85">
                      Không tải được tệp video trực tiếp — mạng đang chặn miền CDN.
                    </p>
                    {v.url && (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium hover:bg-white/20"
                      >
                        Mở bằng trình phát Bunny
                      </a>
                    )}
                  </div>
                )}

                {/* Lớp nhận cú bấm để tạm dừng / tiếp tục.
                    - Trên máy CẢM ỨNG: luôn phủ, vì cần cho thao tác vuốt.
                    - Trên MÁY TÍNH: phủ khi là TỆP VIDEO CỦA MÌNH (không có nút điều khiển gốc nên
                      không phủ thì bấm chuột chẳng có gì xảy ra); KHÔNG phủ với iframe YouTube —
                      phủ là nuốt mất cú bấm vào nút của nền tảng.
                    - iframe YouTube CHƯA kết nối được (chưa có `infoDelivery`): cũng không phủ, để
                      người xem bấm được nút phát của YouTube thay vì một lớp phủ không làm gì. */}
                {(n.kieu === "video" || (coCham && (n.kieu !== "iframe" || !!ytSong[i]))) && !khoa && (
                  <button
                    type="button"
                    onClick={() => bamVao(i)}
                    aria-label={dangPhat ? "Tạm dừng" : "Tiếp tục"}
                    className={cn("absolute inset-0 z-10 bg-transparent", coCham ? "cursor-default" : "cursor-pointer")}
                  />
                )}

                {/* Dấu chìm NOOI (trước đây in email người xem — đổi theo yêu cầu 26/11/2026).
                    Không vẽ lên màn khoá: ở đó đã có ảnh bìa mờ + ổ khoá, thêm chữ chỉ rối. */}
                {!khoa && <DauChimNooi />}

                {/* Nút “Mở bài” — CHỈ hiện khi video thuộc một bài học, và đặt ở góc phải-trên
                    (cạnh nút đóng). Video tư liệu không có nút này cho đỡ rối mắt. */}
                {!khoa && thuocBaiHoc(v.danh_muc) && (
                  <Link
                    href={`${tienToBai}/${v.id}`}
                    className="absolute right-14 top-3 z-30 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-[11px] font-medium backdrop-blur hover:bg-black/70"
                  >
                    <BookOpen size={13} />
                    Mở bài
                  </Link>
                )}

                {/* Chưa phát thì hiện nút ▶ TO ở giữa — LUÔN bấm được (kể cả khi nền tảng không
                    cho điều khiển từ mã, hoặc trình phát chưa sẵn sàng). */}
                {i === iDangXem && !dangPhat && loiPhat !== i && !khoa && (n.kieu === "video" || !!ytSong[i]) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soLanThu.current = 0;
                      phat(i);
                      setDangPhat(true);
                    }}
                    aria-label="Phát video"
                    className="absolute left-1/2 top-1/2 z-30 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"
                  >
                    <Play size={26} className="translate-x-0.5" />
                  </button>
                )}

                {/* Cột nút bên phải: cài đặt + tiếng + lên/xuống */}
                <div
                  className={cn(
                    "absolute right-2.5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 transition-opacity duration-300",
                    hienChrome ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                >
                  {!khoa && n.kieu === "video" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMoCaiDat(true);
                        void layDsChatLuong(iRef.current);
                      }}
                      aria-label="Cài đặt chất lượng và tốc độ"
                      title="Chất lượng · Tốc độ"
                      className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur hover:bg-black/60"
                    >
                      <Settings size={16} />
                    </button>
                  )}
                  {/* Chia sẻ — luôn có, kể cả bài đang khoá: chia sẻ liên kết là việc hợp lệ, và
                      người nhận mở ra sẽ gặp đúng cổng gác như người gửi. */}
                  <NutChiaSe
                    tieuDe={v.title}
                    duong={`/video/${v.id}`}
                    nhan={`Chia sẻ: ${v.title}`}
                    co={16}
                    className="size-9 rounded-full border border-white/20 bg-black/40 backdrop-blur hover:bg-black/60"
                  />
                  {!khoa && (n.kieu === "video" || !!ytSong[i]) && (
                    <button
                      type="button"
                      onClick={doiTieng}
                      aria-label={tatTieng ? "Bật tiếng" : "Tắt tiếng"}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border border-white/20 backdrop-blur",
                        tatTieng ? "bg-black/40" : "bg-accent/40"
                      )}
                    >
                      {tatTieng ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => cuon(i - 1)}
                    aria-label="Video trước"
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => cuon(i + 1)}
                    aria-label="Video tiếp"
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur"
                  >
                    <ChevronDown size={16} />
                  </button>

                  {/* Toàn màn hình THẬT — chỉ hiện khi trình duyệt làm được (iPhone Safari không
                      cho mở toàn màn hình với thẻ <div>, nên ở đó không dựng nút vô tác dụng). */}
                  {coToanManHinh && (
                    <button
                      type="button"
                      onClick={() => void batTatToanManHinh()}
                      aria-label={dangToanManHinh ? "Thoát toàn màn hình" : "Toàn màn hình"}
                      title={dangToanManHinh ? "Thoát toàn màn hình" : "Toàn màn hình"}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border border-white/20 backdrop-blur",
                        dangToanManHinh ? "bg-accent/40" : "bg-black/40 hover:bg-black/60"
                      )}
                    >
                      {dangToanManHinh ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  )}
                </div>

                {/* Thanh dưới: THU GỌN 1 dòng, chạm để mở chi tiết */}
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-5 pt-10 transition-opacity duration-300",
                    hienChrome ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                >
                  {!moThongTin ? (
                    <div className="flex items-end gap-2 pr-12">
                      <button
                        type="button"
                        onClick={() => setMoThongTin(true)}
                        className="min-w-0 flex-1 text-left"
                        aria-label="Mở thông tin video"
                      >
                        <span className="line-clamp-1 text-xs font-semibold text-white/95">
                          {v.title}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-white/60">
                          <Info size={11} className="shrink-0" />
                          <span>
                            {i + 1}/{videos.length}
                          </span>
                          <span>·</span>
                          <span>{kenh}</span>
                          <span>·</span>
                          <span>chạm để xem chi tiết</span>
                        </span>
                      </button>
                      {/* Video khoá: lối mời đăng nhập — luôn có. Nút “Mở bài” đã chuyển lên
                          góc phải-trên và chỉ hiện khi video thuộc một bài học (xem dưới). */}
                      {khoa && (
                        <button
                          type="button"
                          onClick={() => setVideoXinQuyen({ v, moTa: q?.moTa ?? "Video này dành cho thành viên NOOI." })}
                          className="shrink-0 rounded-lg border border-white/25 bg-primary px-3 py-2 text-[11px] font-medium text-primary-foreground backdrop-blur hover:opacity-90"
                        >
                          Đăng nhập
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="pr-12">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                          {kenh}
                        </span>
                        <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                          {nhanKhung}
                        </span>
                        {v.duration ? (
                          <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                            {Math.floor(v.duration / 60)}:
                            {String(v.duration % 60).padStart(2, "0")}
                          </span>
                        ) : null}
                        <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                          {i + 1}/{videos.length}
                        </span>
                      </div>
                      <h2 className="text-sm font-semibold">{v.title}</h2>
                      {v.description && (
                        <p className="mt-0.5 line-clamp-3 text-xs text-white/70">{v.description}</p>
                      )}
                      {n.canhBao && <p className="mt-1 text-[10px] text-amber-200/90">{n.canhBao}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        {khoa ? (
                          <button
                            type="button"
                            onClick={() => setVideoXinQuyen({ v, moTa: q?.moTa ?? "Video này dành cho thành viên NOOI." })}
                            className="text-[11px] text-white/80 underline"
                          >
                            Đăng nhập để xem
                          </button>
                        ) : (
                          <Link href={`${tienToBai}/${v.id}`} className="text-[11px] text-white/80 underline">
                            Mở trang video
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setMoThongTin(false)}
                          className="inline-flex items-center gap-1 text-[11px] text-white/70"
                        >
                          <ChevronDown size={12} /> Thu gọn
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Thanh tiến trình: BẤM hoặc KÉO để tua đúng chỗ.
                    Có với tệp video của mình VÀ với mọi video YouTube (điều khiển qua postMessage).
                    Với YouTube, thời lượng dự phòng lấy từ bản ghi nên bấm được ngay cả trước khi
                    khung YouTube kịp trả lời; thanh chỉ đọc (không bấm) khi bài bị khoá. */}
                {(n.kieu === "video" || !!n.youtubeId) && !khoa ? (
                  <div
                    ref={i === iDangXem ? thanhRef : undefined}
                    onPointerDown={i === iDangXem ? batDauKeo : undefined}
                    onPointerMove={i === iDangXem ? dangKeo : undefined}
                    onPointerUp={i === iDangXem ? thoiKeo : undefined}
                    onPointerCancel={i === iDangXem ? thoiKeo : undefined}
                    role="slider"
                    tabIndex={-1}
                    aria-label="Thanh tiến trình video — bấm hoặc kéo để tua"
                    title="Bấm hoặc kéo để tua"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(i === iDangXem ? tienTrinh : 0)}
                    className={cn(
                      // Vùng nhận thao tác cao 40px (ngón tay vẫn trúng), nhưng chỉ vẽ vạch 4px
                      "group absolute inset-x-0 bottom-0 z-40 h-10 touch-none select-none",
                      i === iDangXem ? "cursor-pointer" : "pointer-events-none"
                    )}
                  >
                    <div className="absolute inset-x-0 bottom-0 h-[4px] bg-white/25 transition-[height] duration-150 group-hover:h-2">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${i === iDangXem ? tienTrinh : 0}%` }}
                      />
                    </div>
                    <span
                      className="absolute bottom-[4px] size-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent opacity-0 shadow transition-opacity group-hover:opacity-100"
                      style={{ left: `${i === iDangXem ? tienTrinh : 0}%` }}
                    />
                    {i === iDangXem && thoiGian.tong > 0 && (
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-[10px] font-medium tabular-nums opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                        {phutGiay(thoiGian.giay)} · {phutGiay(thoiGian.tong)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-0 z-40 h-[3px] bg-white/20">
                    <div
                      className="h-full bg-accent transition-[width] duration-200"
                      style={{ width: `${i === iDangXem ? tienTrinh : 0}%` }}
                    />
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Bảng cài đặt: CHẤT LƯỢNG · TỐC ĐỘ PHÁT.
          Chỉ mở với tệp video của mình (iframe nền tảng không điều khiển được nên không làm ra
          nút bấm vô tác dụng). Danh sách chất lượng hỏi máy chủ để chỉ hiện mức CÓ THẬT. */}
      {moCaiDat && nguon[iDangXem]?.kieu === "video" && (
        <div
          className="absolute inset-0 z-[90] flex items-end justify-end bg-black/40 p-3 sm:p-4"
          onClick={() => setMoCaiDat(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cài đặt chất lượng và tốc độ"
        >
          <div
            className="w-[min(20rem,100%)] rounded-2xl border border-white/15 bg-black/90 p-3 text-white shadow-xl backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Settings size={14} /> Cài đặt
              </span>
              <button
                type="button"
                onClick={() => setMoCaiDat(false)}
                aria-label="Đóng cài đặt"
                className="rounded-full p-1 hover:bg-white/10"
              >
                <X size={15} />
              </button>
            </div>

            <p className="mb-1.5 text-xs text-white/60">Chất lượng</p>
            <div className="flex flex-wrap gap-1.5">
              {dsChatLuong === null ? (
                <span className="text-xs text-white/50">Đang hỏi máy chủ…</span>
              ) : (
                [{ ma: "tu-dong", ten: "Tự động" }, ...dsChatLuong.map((m) => ({ ma: m, ten: m }))].map((o) => {
                  const chon = (mucChatLuong[iDangXem] ?? "tu-dong") === o.ma;
                  return (
                    <button
                      key={o.ma}
                      type="button"
                      onClick={() => chonChatLuong(o.ma)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                        chon
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white/25 bg-white/10 hover:bg-white/20"
                      )}
                    >
                      {chon && <Check size={11} />}
                      {o.ten}
                    </button>
                  );
                })
              )}
            </div>
            {dsChatLuong !== null && dsChatLuong.length === 0 && (
              <p className="mt-1 text-[10px] text-white/45">
                Bài này chưa lấy được danh sách mức chất lượng — đang phát mức mặc định.
              </p>
            )}

            <p className="mb-1.5 mt-3 text-xs text-white/60">Tốc độ phát</p>
            <div className="flex flex-wrap gap-1.5">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((t) => {
                const chon = Math.abs(tocDo - t) < 0.001;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => doiTocDo(t)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
                      chon
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/25 bg-white/10 hover:bg-white/20"
                    )}
                  >
                    {chon && <Check size={11} />}
                    {t === 1 ? "1×" : `${String(t).replace(".", ",")}×`}
                  </button>
                );
              })}
            </div>

            <p className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-white/45">
              <Gauge size={11} /> Phím ← → tua 5 giây · phím cách tạm dừng · M đổi tiếng
            </p>
          </div>
        </div>
      )}

      {/* Hộp đăng nhập ngay trong luồng — chỉ hiện ở trang công khai (khi có truyền người xem) */}
      {nguoiCongKhai && (
        <HopDangNhap
          mo={!!videoXinQuyen}
          tieuDeVideo={videoXinQuyen?.v.title}
          moTa={videoXinQuyen?.moTa ?? ""}
          quayLai={quayLaiDangNhap}
          onDong={() => setVideoXinQuyen(null)}
        />
      )}
    </div>
  );
}
