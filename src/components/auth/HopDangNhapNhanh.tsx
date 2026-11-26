"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { X, Lock, Loader2, Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import {
  dangKyHopDangNhap,
  dongHopDangNhap,
  hopDangNhapDangMo,
  type YeuCauDangNhap,
} from "@/lib/dang-nhap-nhanh";

/**
 * HỘP ĐĂNG NHẬP NHANH — một hộp duy nhất cho toàn bộ trang công khai.
 *
 * Ba việc nó làm:
 * 1. Khách vào site một lúc (mặc định 20 giây) mà chưa đăng nhập → tự hiện thẻ nhỏ ở góc
 *    trên phải, mời đăng nhập nhanh. Đóng đi thì im 7 ngày (localStorage).
 * 2. Bất kỳ nội dung nào cần đăng nhập (video khoá, bài viết kho tri thức, đường dẫn riêng tư)
 *    gọi `moHopDangNhap()` → chính hộp này hiện ra, KHÔNG chuyển trang. Đăng nhập xong quay
 *    lại đúng nội dung đang xem.
 * 3. Đường dẫn riêng tư bị middleware chặn được đưa về `/` kèm `?dang-nhap=1&next=…` → hộp
 *    mở ngay thay vì một trang đăng nhập riêng.
 *
 * Vì sao gom một chỗ: trước đây mỗi nơi một kiểu (chỗ thì chuyển sang /login, chỗ thì hộp
 * riêng của video) → khách thấy hai giao diện đăng nhập khác nhau và mất ngữ cảnh.
 */

/** Số giây khách được xem trước khi hộp nhắc nhẹ tự hiện */
const SAU_GIAY = 20;
/** Khoá localStorage: thời điểm khách chủ động đóng hộp nhắc */
const KHOA_TAT = "nooi_hop_dang_nhap_tat";
/** Đóng rồi thì im bao lâu (7 ngày) */
const HAN_TAT_MS = 7 * 24 * 60 * 60 * 1000;
/** Những nơi khách đang chủ động đăng nhập / đổi mật khẩu → không nhắc */
const BO_QUA = ["/login", "/signup", "/auth", "/admin-login"];

/** Nhớ đích quay lại vào cookie trước khi rời trang (OAuth/link email quay về /auth/callback,
 *  nơi `?redirect=` trên địa chỉ không còn nữa). Hạn 15 phút, chỉ nhận đường dẫn nội bộ. */
function luuDichQuayLai(dich?: string) {
  if (typeof window === "undefined") return;
  if (!dich || !dich.startsWith("/") || dich.startsWith("//")) return;
  if (dich === "/app" || dich === "/") return;
  const bao = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `nooi_sau_dn=${encodeURIComponent(dich)}; path=/; max-age=900; samesite=lax${bao}`;
}

function emailHopLe(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function HopDangNhapNhanh({ initialSession = false }: { initialSession?: boolean }) {
  const [daDangNhap, setDaDangNhap] = useState(initialSession);
  const [yeuCau, setYeuCau] = useState<YeuCauDangNhap | null>(null);
  const [email, setEmail] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [daGuiLink, setDaGuiLink] = useState(false);

  // Nghe yêu cầu từ mọi nơi trên site (video khoá, bài viết, nút bấm…)
  useEffect(() => {
    const huy = dangKyHopDangNhap((yc) => {
      setYeuCau(yc);
      if (!yc) {
        setDaGuiLink(false);
        setDangGui(false);
      }
    });
    // Nếu đã có yêu cầu phát ra trước khi hộp kịp gắn (thứ tự effect của con trước cha),
    // đọc lại trạng thái hiện tại để không bỏ sót.
    const dangCho = hopDangNhapDangMo();
    if (dangCho) setYeuCau(dangCho);
    return huy;
  }, []);

  // Theo dõi phiên: đăng nhập xong thì ĐIỀU HƯỚNG vào đúng nơi, không đứng yên tại chỗ.
  const yeuCauRef = useRef<YeuCauDangNhap | null>(null);
  useEffect(() => {
    yeuCauRef.current = yeuCau;
  }, [yeuCau]);
  const daChuyen = useRef(false);

  /**
   * Đăng nhập xong đi đâu: về đúng nội dung khách vừa xin (`quayLai`), không có thì vào khu
   * vực thành viên `/app`. Dùng điều hướng CỨNG (nạp lại trang) vì cổng gác nội dung nằm ở
   * máy chủ — chỉ khi máy chủ đọc lại cookie phiên thì bài/video khoá mới thật sự mở.
   */
  const chuyenSauDangNhap = useCallback((quayLai?: string) => {
    if (daChuyen.current) return;
    daChuyen.current = true;
    const dich =
      quayLai && quayLai.startsWith("/") && !quayLai.startsWith("//") ? quayLai : "/app";
    window.location.assign(dich);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setDaDangNhap(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((suKien, session) => {
      setDaDangNhap(!!session);
      if (!session || suKien !== "SIGNED_IN") return;
      // Chỉ chuyển trang khi hộp đang mở vì khách vừa bấm một nội dung cần đăng nhập.
      // (Đăng nhập bằng biểu mẫu ở /login đã tự điều hướng, không được giật khỏi tay khách.)
      const dangCho = yeuCauRef.current;
      setYeuCau(null);
      if (dangCho) chuyenSauDangNhap(dangCho.quayLai);
    });
    return () => subscription.unsubscribe();
  }, [chuyenSauDangNhap]);

  // Đã có phiên mà vẫn bị đưa về trang chủ kèm ?dang-nhap=1 (phiên vừa hết hạn rồi được làm
  // mới) → đi thẳng tới nội dung đã xin thay vì để khách tự bấm lại.
  useEffect(() => {
    if (!daDangNhap) return;
    const ts = new URLSearchParams(window.location.search);
    if (ts.get("dang-nhap") === "1") {
      chuyenSauDangNhap(ts.get("next") ?? undefined);
    }
  }, [daDangNhap, chuyenSauDangNhap]);

  // Khách mở link đăng nhập trong TAB KHÁC (thư điện tử hay mở tab mới): tab này không nhận
  // sự kiện đăng nhập. Khi khách quay lại tab, tự kiểm tra phiên và đi tiếp — nếu không, khách
  // đứng lại ở trang cũ với trạng thái "đã đăng nhập" mà không được đưa vào đúng nơi.
  useEffect(() => {
    const kiemTraKhiQuayLai = async () => {
      if (!yeuCauRef.current) return;
      if (document.visibilityState !== "visible") return;
      try {
        const { data } = await createClient().auth.getSession();
        if (!data.session) return;
        const dich = yeuCauRef.current?.quayLai;
        setYeuCau(null);
        chuyenSauDangNhap(dich);
      } catch {
        /* bỏ qua — lần sau quay lại tab sẽ thử lại */
      }
    };
    document.addEventListener("visibilitychange", kiemTraKhiQuayLai);
    window.addEventListener("focus", kiemTraKhiQuayLai);
    return () => {
      document.removeEventListener("visibilitychange", kiemTraKhiQuayLai);
      window.removeEventListener("focus", kiemTraKhiQuayLai);
    };
  }, [chuyenSauDangNhap]);

  // Hẹn giờ nhắc nhẹ + mở ngay khi middleware đưa về kèm ?dang-nhap=1
  const daNhac = useRef(false);
  useEffect(() => {
    if (daDangNhap) return;
    const duongDan = window.location.pathname;
    if (BO_QUA.some((p) => duongDan === p || duongDan.startsWith(p + "/"))) return;

    const thamSo = new URLSearchParams(window.location.search);
    const next = thamSo.get("next");
    const quayLai = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

    if (thamSo.get("dang-nhap") === "1") {
      const t = window.setTimeout(() => {
        daNhac.current = true;
        setYeuCau({
          lyDo: "Đăng nhập để mở đúng nội dung bạn vừa chọn — xong là vào luôn, không phải tìm lại.",
          quayLai,
        });
      }, 350);
      return () => window.clearTimeout(t);
    }

    try {
      const tatLuc = Number(localStorage.getItem(KHOA_TAT) || 0);
      if (Number.isFinite(tatLuc) && Date.now() - tatLuc < HAN_TAT_MS) return;
    } catch {
      /* trình duyệt chặn localStorage → cứ nhắc bình thường */
    }

    const t = window.setTimeout(function kiemTra() {
      if (daNhac.current) return;
      // Đang có hộp mở vì khách bấm một nội dung khoá → KHÔNG thay bằng lời nhắc tự động:
      // thay là mất `quayLai`, đăng nhập xong khách bị đưa về /app thay vì đúng bài đang đọc.
      if (yeuCauRef.current) {
        daNhac.current = true;
        return;
      }
      // Khách đang ở tab khác thì chưa hiện — hẹn lại, để lúc quay lại tab mới thấy lời mời.
      if (document.visibilityState === "hidden") {
        window.setTimeout(kiemTra, 15_000);
        return;
      }
      daNhac.current = true;
      setYeuCau({
        lyDo: "Đăng nhập để lưu bài đang đọc, xem trọn bộ bài giảng và nhận lộ trình riêng.",
        nhanNhac: true,
      });
    }, SAU_GIAY * 1000);
    return () => window.clearTimeout(t);
  }, [daDangNhap]);

  const dong = useCallback(() => {
    // Chỉ ghi "đã đóng" khi khách đóng LỜI NHẮC tự động — đóng hộp mở từ nội dung khoá thì
    // không tính là từ chối, lần sau vào vẫn được nhắc.
    if (yeuCau?.nhanNhac) {
      try {
        localStorage.setItem(KHOA_TAT, String(Date.now()));
      } catch {
        /* bỏ qua */
      }
    }
    setYeuCau(null);
    setDaGuiLink(false);
    setDangGui(false);
    dongHopDangNhap();
  }, [yeuCau]);

  // Esc để đóng
  useEffect(() => {
    if (!yeuCau) return;
    const nghe = (e: KeyboardEvent) => {
      if (e.key === "Escape") dong();
    };
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  }, [yeuCau, dong]);

  const mo = !!yeuCau && !daDangNhap;

  const dangNhapGoogle = useCallback(async () => {
    setDangGui(true);
    try {
      luuDichQuayLai(yeuCau?.quayLai);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      toast.error("Chưa mở được Google. Ngài thử lại hoặc dùng email bên dưới.");
      setDangGui(false);
    }
  }, [yeuCau?.quayLai]);

  const guiLink = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!emailHopLe(email)) {
        toast.error("Email chưa đúng. Ngài kiểm tra lại giúp em.");
        return;
      }
      setDangGui(true);
      try {
        luuDichQuayLai(yeuCau?.quayLai);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setDaGuiLink(true);
        toast.success("Đã gửi link đăng nhập — mở hộp thư (cả mục Spam).");
      } catch {
        toast.error("Gửi email chưa được. Ngài thử lại giúp em.");
      } finally {
        setDangGui(false);
      }
    },
    [email, yeuCau?.quayLai]
  );

  if (!mo) return null;

  const tieuDe = yeuCau?.tieuDe
    ? "Nội dung này cần đăng nhập"
    : "Đăng nhập nhanh vào NOOI";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Đăng nhập nhanh NOOI"
      className="fixed right-3 top-[74px] z-[95] w-[min(340px,calc(100vw-1.5rem))] animate-in fade-in slide-in-from-top-3 duration-300 sm:right-5"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/95 p-4 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        {/* Vệt màu thương hiệu mảnh ở mép trên */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary to-primary/0"
        />

        <button
          type="button"
          onClick={dong}
          aria-label="Đóng"
          className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={15} />
        </button>

        <div className="flex items-start gap-2.5 pr-7">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
            {yeuCau?.tieuDe ? <Lock size={15} /> : <Sparkles size={15} />}
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold leading-snug">{tieuDe}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
              {yeuCau?.lyDo ||
                "Đăng nhập để lưu bài, xem trọn bộ bài giảng và nhận lộ trình riêng."}
            </p>
            {yeuCau?.tieuDe && (
              <p className="mt-1 line-clamp-2 text-[11px] italic text-muted-foreground/80">
                “{yeuCau.tieuDe}”
              </p>
            )}
          </div>
        </div>

        {daGuiLink ? (
          <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/[0.07] p-3">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-[11.5px] leading-relaxed">
              Đã gửi link tới <span className="font-semibold">{email.trim()}</span>. Mở hộp thư
              (cả mục Spam) và bấm link để vào NOOI.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={dangNhapGoogle}
              disabled={dangGui}
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[13px] font-semibold text-[#1f1f1f] shadow-sm transition-colors hover:bg-white/90 disabled:opacity-60"
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Tiếp tục với Google
            </button>

            <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              <span className="h-px flex-1 bg-border" />
              hoặc
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={guiLink} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Mail
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@cua-ban.com"
                  aria-label="Email nhận link đăng nhập"
                  className="w-full rounded-lg border border-border bg-background/60 py-2 pl-8 pr-2 text-[12.5px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60"
                />
              </div>
              <button
                type="submit"
                disabled={dangGui}
                aria-label="Gửi link đăng nhập qua email"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {dangGui ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={15} />}
              </button>
            </form>
            <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground/80">
              Nhận link đăng nhập qua email — không cần mật khẩu.
            </p>
          </>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-[11px]">
          <a
            href={yeuCau?.quayLai ? `/login?redirect=${encodeURIComponent(yeuCau.quayLai)}` : "/login"}
            className="font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Dùng mật khẩu
          </a>
          <button
            type="button"
            onClick={dong}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
