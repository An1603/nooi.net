"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KENH_PHAT_LABELS, laKenhPhat, nguonPhatDoc, type VideoDoc } from "@/lib/video/kenh-phat";
import { docTimeUpdate, napPlayerJs, taoPlayer, type PlayerGiaoDien } from "@/lib/video/playerjs";

interface Props {
  videos: VideoDoc[];
  /** Email/mã người xem để in dấu chìm — rỗng thì không in */
  nguoiXem?: string | null;
}

/**
 * Luồng xem dọc kiểu vuốt (TikTok) cho kho bài giảng NOOI.
 *
 * Nguyên tắc đã chốt:
 *   1. Mỗi video một khung cao đúng màn hình; cuộn dọc có "bám" (scroll-snap) nên vuốt là sang video.
 *   2. Chỉ gắn trình phát cho video đang xem và 2 video kề bên -> không tải cả luồng, tiết kiệm 4G.
 *   3. Phủ một lớp nhận thao tác chạm lên trên iframe: nếu để ngón tay chạm vào chính iframe thì
 *      trang cha KHÔNG nhận được thao tác vuốt. Lớp phủ lo việc vuốt, còn phát/dừng do mình điều khiển.
 *   4. Tự phát luôn ở chế độ TẮT TIẾNG (mọi trình duyệt đều chặn tự phát có tiếng).
 *   5. Thời gian xem từng video gửi về /api/track (đã có sẵn) để đo mức độ xem thật.
 */
export function VideoFeedDoc({ videos, nguoiXem }: Props) {
  const nguon = useMemo(() => videos.map((v) => nguonPhatDoc(v)), [videos]);

  const khung = useRef<HTMLDivElement | null>(null);
  const mucRef = useRef<(HTMLElement | null)[]>([]);
  const videoRef = useRef<(HTMLVideoElement | null)[]>([]);
  const playerRef = useRef<(PlayerGiaoDien | null)[]>([]);
  const iRef = useRef(0);
  const tiengRef = useRef(true);

  const [sanSang, setSanSang] = useState(false);
  const [loiPlayerJs, setLoiPlayerJs] = useState<string | null>(null);
  const [iDangXem, setIDangXem] = useState(0);
  const [tatTieng, setTatTieng] = useState(true);
  const [dangPhat, setDangPhat] = useState(true);
  const [tienTrinh, setTienTrinh] = useState(0);

  const batDau = useRef(Date.now());

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
          body: JSON.stringify({ t: "nhip", d: `/app/short?v=${video.id}`, g: Math.round(giay) }),
        }).catch(() => {});
      } catch {
        /* không chặn trải nghiệm vì lỗi đo lường */
      }
    },
    [videos]
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

  // 1. Nạp player.js TRƯỚC khi gắn iframe (điều kiện bắt buộc của Bunny)
  useEffect(() => {
    let huy = false;
    napPlayerJs()
      .catch((e: unknown) => {
        if (!huy) setLoiPlayerJs(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!huy) setSanSang(true);
      });
    return () => {
      huy = true;
    };
  }, []);

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
    },
    [cuon, bamVao, doiTieng]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black text-white" data-feed-doc>
      {/* Đóng luồng, quay về kho video */}
      <Link
        href="/app/videos"
        className="absolute right-3 top-3 z-30 flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70"
        aria-label="Đóng luồng"
      >
        <X size={18} />
      </Link>

      {loiPlayerJs && (
        <p className="absolute left-3 top-3 z-30 max-w-[70%] rounded-lg bg-amber-500/20 px-3 py-1.5 text-[11px] text-amber-200">
          {loiPlayerJs} — vẫn xem được, nhưng chạm để tạm dừng có thể không tác dụng.
        </p>
      )}

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
          return (
            <section
              key={v.id}
              data-i={i}
              ref={(el) => {
                mucRef.current[i] = el;
              }}
              className="relative flex h-full w-full snap-start snap-always items-center justify-center"
            >
              {/* Khung dọc 9:16: điện thoại thì tràn màn hình, máy tính thì cột giữa */}
              <div className="relative h-full w-full overflow-hidden bg-black sm:aspect-[9/16] sm:h-[100dvh] sm:w-auto sm:max-w-full">
                {gan && n.kieu === "iframe" && (
                  <iframe
                    ref={ganIframe(i)}
                    src={n.dieuKhien && !sanSang ? undefined : n.src}
                    title={v.title}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
                {gan && n.kieu === "video" && (
                  <video
                    ref={ganVideo(i)}
                    src={n.src}
                    className="absolute inset-0 h-full w-full object-cover"
                    playsInline
                    muted
                    loop
                    preload="metadata"
                  />
                )}
                {n.kieu === "khong" && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-white/70">
                    {n.lyDo}
                  </div>
                )}

                {/* Lớp phủ nhận thao tác chạm: để vuốt được và để mình tự vẽ điều khiển */}
                <button
                  type="button"
                  onClick={() => bamVao(i)}
                  aria-label={dangPhat ? "Tạm dừng" : "Tiếp tục"}
                  className="absolute inset-0 z-10 cursor-default bg-transparent"
                />

                {/* Dấu chìm chống rò rỉ */}
                {nguoiXem && (
                  <span className="dau-chim-troi pointer-events-none absolute z-20 rounded bg-black/25 px-2 py-1 text-[11px] font-medium tracking-wide text-white/70">
                    {nguoiXem}
                  </span>
                )}

                {/* Dấu tạm dừng giữa khung */}
                {i === iDangXem && !dangPhat && (
                  <span className="pointer-events-none absolute z-20 flex size-16 items-center justify-center rounded-full bg-black/45 backdrop-blur">
                    <Play size={26} className="translate-x-0.5" />
                  </span>
                )}

                {/* Thanh dưới: tiêu đề, nhãn, nút điều khiển */}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-6 pt-10">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                          {kenh}
                        </span>
                        <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                          Dọc 9:16
                        </span>
                        {v.duration ? (
                          <span className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                            {Math.floor(v.duration / 60)}:
                            {String(v.duration % 60).padStart(2, "0")}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="line-clamp-2 text-sm font-semibold">{v.title}</h2>
                      {v.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/70">{v.description}</p>
                      )}
                      {n.canhBao && (
                        <p className="mt-1 text-[10px] text-amber-200/90">{n.canhBao}</p>
                      )}
                      <Link
                        href={`/app/videos/${v.id}`}
                        className="mt-1.5 inline-block text-[11px] text-white/80 underline"
                      >
                        Mở trang bài giảng
                      </Link>
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-2 pb-1">
                      <button
                        type="button"
                        onClick={doiTieng}
                        aria-label={tatTieng ? "Bật tiếng" : "Tắt tiếng"}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full border border-white/20",
                          tatTieng ? "bg-white/10" : "bg-accent/30"
                        )}
                      >
                        {tatTieng ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => cuon(i - 1)}
                        aria-label="Video trước"
                        className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => cuon(i + 1)}
                        aria-label="Video tiếp"
                        className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    {dangPhat && i === iDangXem ? (
                      <Pause size={11} className="text-white/60" />
                    ) : (
                      <Play size={11} className="text-white/60" />
                    )}
                    <span className="text-[10px] text-white/50">
                      Chạm để tạm dừng · vuốt lên để xem tiếp
                    </span>
                  </div>
                </div>

                {/* Thanh tiến trình ở sát đáy, che dải điều khiển gốc của trình phát */}
                <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/20">
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
