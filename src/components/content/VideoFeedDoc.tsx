"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Info, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KENH_PHAT_LABELS,
  KHUNG_HINH_LABELS,
  laKenhPhat,
  laKhungHinh,
  nguonPhatDoc,
  type VideoDoc,
} from "@/lib/video/kenh-phat";
import { docTimeUpdate, taoPlayer, type PlayerGiaoDien } from "@/lib/video/playerjs";

interface Props {
  videos: VideoDoc[];
  /** Email/mã người xem để in dấu chìm — rỗng thì không in */
  nguoiXem?: string | null;
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
 *   5. Tự phát luôn ở chế độ TẮT TIẾNG (mọi trình duyệt đều chặn tự phát có tiếng).
 *   6. Thời gian xem từng video gửi về /api/track để đo mức độ xem thật.
 */
export function VideoFeedDoc({
  videos,
  nguoiXem,
  tieuDe,
  duongDanDong = "/app/videos",
  duongDanDo = "/app/short",
  thuGon = true,
}: Props) {
  const nguon = useMemo(() => videos.map((v) => nguonPhatDoc(v)), [videos]);

  const khung = useRef<HTMLDivElement | null>(null);
  const mucRef = useRef<(HTMLElement | null)[]>([]);
  const videoRef = useRef<(HTMLVideoElement | null)[]>([]);
  const playerRef = useRef<(PlayerGiaoDien | null)[]>([]);
  const iRef = useRef(0);
  const tiengRef = useRef(true);

  const [iDangXem, setIDangXem] = useState(0);
  const [tatTieng, setTatTieng] = useState(true);
  const [dangPhat, setDangPhat] = useState(true);
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

  const batDau = useRef(Date.now());
  /** Số lần đã thử phát lại video đang xem (trình duyệt chặn tự phát thì phải chờ người dùng chạm) */
  const soLanThu = useRef(0);

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
      const v = videoRef.current[i];
      if (v) {
        v.muted = tiengRef.current;
        void v.play().catch(() => setDangPhat(false));
        return;
      }
      const p = playerRef.current[i];
      if (p) {
        if (tiengRef.current) p.mute();
        else p.unmute();
        p.play();
      }
    },
    [nguon]
  );

  const dung = useCallback((i: number) => {
    const v = videoRef.current[i];
    if (v) {
      v.pause();
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

  // 7. Cú chạm ĐẦU TIÊN của người dùng là "vé" cho phép phát: thử phát lại ngay
  useEffect(() => {
    const bat = () => {
      soLanThu.current = 0;
      phat(iRef.current);
    };
    window.addEventListener("pointerdown", bat, { once: true });
    window.addEventListener("keydown", bat, { once: true });
    return () => {
      window.removeEventListener("pointerdown", bat);
      window.removeEventListener("keydown", bat);
    };
  }, [phat]);

  /** Gắn iframe Bunny: tạo đối tượng điều khiển ngay khi iframe vào DOM. */
  const ganIframe = useCallback(
    (i: number) => (el: HTMLIFrameElement | null) => {
      if (!el) {
        playerRef.current[i] = null;
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

  /** Gắn thẻ <video> của mình (tệp trực tiếp). */
  const ganVideo = useCallback(
    (i: number) => (el: HTMLVideoElement | null) => {
      videoRef.current[i] = el;
      if (!el) return;
      el.muted = tiengRef.current;
      el.addEventListener("timeupdate", () => {
        if (i !== iRef.current || !el.duration) return;
        setTienTrinh(Math.min(100, (el.currentTime / el.duration) * 100));
      });
      el.addEventListener("pause", () => {
        if (i === iRef.current) setDangPhat(false);
      });
      el.addEventListener("play", () => {
        if (i === iRef.current) setDangPhat(true);
      });
      if (i === iRef.current) void el.play().catch(() => setDangPhat(false));
    },
    []
  );

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
      if (!nguon[i]?.dieuKhien) return;
      if (dangPhat) {
        dung(i);
        setDangPhat(false);
      } else {
        phat(i);
        setDangPhat(true);
      }
    },
    [nguon, dangPhat, dung, phat, cuon]
  );

  const doiTieng = useCallback(() => {
    const moi = !tatTieng;
    tiengRef.current = moi;
    setTatTieng(moi);
    doTieng(iRef.current, moi);
  }, [tatTieng, doTieng]);

  // Bàn phím: máy tính cũng vuốt được bằng mũi lên/xuống
  const phim = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        cuon(iRef.current + 1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        cuon(iRef.current - 1);
      }
      if (e.key === " ") {
        e.preventDefault();
        bamVao(iRef.current);
      }
      if (e.key === "m" || e.key === "M") doiTieng();
      if (e.key === "i" || e.key === "I") setMoThongTin((x) => !x);
    },
    [cuon, bamVao, doiTieng]
  );

  /** Khung hình tự khớp tỉ lệ với màn hình — xem giải thích ở đầu tệp. */
  const kieuKhung = (v: VideoDoc): React.CSSProperties =>
    v.khung_hinh === "doc"
      ? { aspectRatio: "9 / 16", height: "100%", width: "auto", maxWidth: "100%" }
      : { aspectRatio: "16 / 9", width: "min(100%, calc(100dvh * 16 / 9))", height: "auto" };

  return (
    <div className="fixed inset-0 z-[80] bg-black text-white" data-feed-doc>
      {/* Đầu luồng: tên luồng / danh mục + số lượng */}
      <div className="pointer-events-none absolute left-3 top-3 z-30 max-w-[70%]">
        {tieuDe && (
          <span className="pointer-events-auto rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            {tieuDe} · {videos.length} video
          </span>
        )}
      </div>

      {/* Đóng luồng, quay về kho video */}
      <Link
        href={duongDanDong}
        className="absolute right-3 top-3 z-30 flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"
        aria-label="Đóng luồng"
      >
        <X size={18} />
      </Link>

      <div
        ref={khung}
        tabIndex={0}
        onKeyDown={phim}
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-contain focus:outline-none"
        style={{ scrollbarWidth: "none" }}
      >
        {videos.map((v, i) => {
          const n = nguon[i];
          const gan = Math.abs(i - iDangXem) <= 1;
          const kenh: string = laKenhPhat(v.kenh_phat) ? KENH_PHAT_LABELS[v.kenh_phat] : "Chưa rõ kênh";
          const nhanKhung: string = laKhungHinh(v.khung_hinh)
            ? KHUNG_HINH_LABELS[v.khung_hinh]
            : "Khổ hình khác";
          return (
            <section
              key={v.id}
              data-i={i}
              ref={(el) => {
                mucRef.current[i] = el;
              }}
              className="relative flex h-full w-full snap-start snap-always items-center justify-center"
            >
              {/* Khung hình tự khớp: dọc theo chiều cao, ngang theo chiều rộng */}
              <div className="relative overflow-hidden bg-black" style={kieuKhung(v)}>
                {gan && n.kieu === "iframe" && (
                  <iframe
                    ref={ganIframe(i)}
                    src={n.src}
                    title={v.title}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
                {gan && n.kieu === "video" && (
                  <video
                    ref={ganVideo(i)}
                    {...(n.srcDuPhong && n.srcDuPhong.length > 1 ? {} : { src: n.src })}
                    className="absolute inset-0 h-full w-full object-contain"
                    poster={v.thumbnail_url || undefined}
                    playsInline
                    muted
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
                    {/* Thử lần lượt các mức chất lượng: mức cao không có thì tự hạ xuống */}
                    {n.srcDuPhong &&
                      n.srcDuPhong.length > 1 &&
                      n.srcDuPhong.map((u) => <source key={u} src={u} type="video/mp4" />)}
                  </video>
                )}
                {n.kieu === "khong" && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-white/70">
                    {n.lyDo}
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

                {/* Lớp phủ nhận thao tác chạm — CHỈ trên máy cảm ứng (cần để vuốt).
                    Trên máy tính không phủ, để cú bấm tới được nút điều khiển gốc của nền tảng. */}
                {coCham && (
                  <button
                    type="button"
                    onClick={() => bamVao(i)}
                    aria-label={dangPhat ? "Tạm dừng" : "Tiếp tục"}
                    className="absolute inset-0 z-10 cursor-default bg-transparent"
                  />
                )}

                {/* Dấu chìm chống rò rỉ */}
                {nguoiXem && (
                  <span className="dau-chim-troi pointer-events-none absolute z-20 rounded bg-black/25 px-2 py-1 text-[11px] font-medium tracking-wide text-white/70">
                    {nguoiXem}
                  </span>
                )}

                {/* Chưa phát thì hiện nút ▶ TO ở giữa — LUÔN bấm được (kể cả khi nền tảng không
                    cho điều khiển từ mã, hoặc trình phát chưa sẵn sàng). */}
                {i === iDangXem && !dangPhat && loiPhat !== i && (
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

                {/* Cột nút bên phải: tiếng + lên/xuống */}
                <div className="absolute right-2.5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2">
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
                </div>

                {/* Thanh dưới: THU GỌN 1 dòng, chạm để mở chi tiết */}
                <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-5 pt-10">
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
                          <span>{v.khung_hinh === "doc" ? "Dọc" : "Ngang"}</span>
                          <span>·</span>
                          <span>{kenh}</span>
                          <span>·</span>
                          <span>chạm để xem chi tiết</span>
                        </span>
                      </button>
                      {/* Lối mở thẳng bài giảng — luôn có, để một cú bấm không bao giờ "vô ích" */}
                      <Link
                        href={`/app/videos/${v.id}`}
                        className="shrink-0 rounded-lg border border-white/25 bg-black/50 px-3 py-2 text-[11px] font-medium backdrop-blur hover:bg-black/70"
                      >
                        Mở bài
                      </Link>
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
                        <Link
                          href={`/app/videos/${v.id}`}
                          className="text-[11px] text-white/80 underline"
                        >
                          Mở trang bài giảng
                        </Link>
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

                  <div className="mt-2 flex items-center gap-1.5">
                    {dangPhat && i === iDangXem ? (
                      <Pause size={11} className="text-white/60" />
                    ) : (
                      <Play size={11} className="text-white/60" />
                    )}
                    <span className="text-[10px] text-white/50">
                      {i === iDangXem && !dangPhat
                        ? "Bấm nút ▶ để phát · vuốt lên để xem tiếp"
                        : "Chạm để tạm dừng · vuốt lên để xem tiếp"}
                    </span>
                  </div>
                </div>

                {/* Thanh tiến trình ở sát đáy, che dải điều khiển gốc của trình phát */}
                <div className="absolute inset-x-0 bottom-0 z-40 h-[3px] bg-white/20">
                  <div
                    className="h-full bg-accent transition-[width] duration-200"
                    style={{ width: `${i === iDangXem ? tienTrinh : 0}%` }}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
