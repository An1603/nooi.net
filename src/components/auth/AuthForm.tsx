"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Wand2, ArrowLeft, Key, Sparkles } from "lucide-react";
import Link from "next/link";

/* ─── Types ─── */

type AuthTab = "signin" | "signup";
type AuthMethod = "email" | "magiclink" | "google" | "github";

interface Props {
  defaultTab: AuthTab;
}

/* ─── Helpers ─── */

function translateAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("user already registered")) return "Email này đã được đăng ký. Vui lòng đăng nhập.";
  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) return "Sai email hoặc mật khẩu. Vui lòng thử lại.";
  if (msg.includes("email not confirmed")) return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư của bạn.";
  if (msg.includes("too many requests")) return "Quá nhiều yêu cầu. Vui lòng chờ một chút trước khi thử lại.";
  if (msg.includes("invalid email")) return "Email không hợp lệ.";
  return message;
}

function extractErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return translateAuthError(error);
  if (error instanceof Error) return translateAuthError(error.message);
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") {
      const t = translateAuthError(obj.message);
      if (t !== obj.message) return t;
    }
    if (typeof obj.error_description === "string") return translateAuthError(obj.error_description);
    if (typeof obj.error === "string") return translateAuthError(obj.error);
  }
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

/* ─── Method Card config ─── */

const METHODS: { id: AuthMethod; icon: React.ReactNode; label: string; desc: string }[] = [
  { id: "email",    icon: <Key className="size-5" />,       label: "Email & Mật khẩu", desc: "Đăng nhập bằng email và mật khẩu" },
  { id: "magiclink",icon: <Sparkles className="size-5" />,  label: "Magic Link",       desc: "Nhận link đăng nhập qua email" },
  { id: "google",   icon: (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  ), label: "Google", desc: "Đăng nhập bằng tài khoản Google" },
  { id: "github",   icon: (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
  ), label: "GitHub", desc: "Đăng nhập bằng tài khoản GitHub" },
];

/* ─── Component ─── */

export function AuthForm({ defaultTab }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<AuthTab>(defaultTab);
  const [method, setMethod] = useState<AuthMethod | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  /* ── Tab switch → URL change ── */
  const switchTab = useCallback((newTab: AuthTab) => {
    setTab(newTab);
    setMethod(null);
    setMagicLinkSent(false);
    router.push(newTab === "signin" ? "/login" : "/signup");
  }, [router]);

  /* ── Social Login ── */
  const handleSocialLogin = useCallback(async (provider: "google" | "github") => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        const msg = error.message || "";
        if (msg.includes("provider is not enabled")) throw new Error(`🔒 ${provider === "google" ? "Google" : "GitHub"} chưa được bật.`);
        throw error;
      }
      toast.success(`Đang chuyển hướng đến ${provider === "google" ? "Google" : "GitHub"}...`);
    } catch (err) { toast.error(extractErrorMessage(err)); setLoading(false); }
  }, [supabase]);

  /* ── Select method ── */
  const selectMethod = useCallback((m: AuthMethod) => {
    setMethod(m);
    setMagicLinkSent(false);
    if (m === "google") handleSocialLogin("google");
    if (m === "github") handleSocialLogin("github");
  }, [handleSocialLogin]);
  const backToMethods = useCallback(() => {
    setMethod(null);
    setMagicLinkSent(false);
  }, []);

  /* ── Validate ── */
  const validateForm = (): boolean => {
    if (!email.trim()) { toast.error("Vui lòng nhập email."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Email không hợp lệ."); return false; }
    if (method === "email" && tab === "signup" && password.length < 6) { toast.error("Mật khẩu phải có ít nhất 6 ký tự."); return false; }
    if (method === "email" && tab === "signin" && !password) { toast.error("Vui lòng nhập mật khẩu."); return false; }
    return true;
  };

  /* ── Email Auth ── */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const emailTrimmed = email.trim();
      if (tab === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: emailTrimmed, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (signUpError) throw signUpError;
        if (data?.user && !data.session) {
          toast.success("📧 Kiểm tra email để xác nhận tài khoản (cả thư mục Spam) trước khi đăng nhập.");
          return;
        }
        toast.success("Tài khoản đã được tạo thành công!");
        router.push("/app");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailTrimmed, password,
        });
        if (signInError) throw signInError;
        toast.success("Đăng nhập thành công!");
        router.push("/app");
      }
    } catch (err) { toast.error(extractErrorMessage(err)); }
    finally { setLoading(false); }
  };

  /* ── Magic Link ── */
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Vui lòng nhập email hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast.success("Link đã được gửi! Kiểm tra email (cả thư mục spam).");
    } catch { toast.error("Gửi email thất bại."); }
    finally { setLoading(false); }
  };

  /* ── Render ── */

  const isSocialRedirecting = (method === "google" || method === "github") && loading;

  return (
    <div className="w-full space-y-5">
      {/* ── Tab switcher ── */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => switchTab("signin")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
            tab === "signin"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => switchTab("signup")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
            tab === "signup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Đăng ký
        </button>
      </div>

      {/* ── Social redirecting state ── */}
      {isSocialRedirecting && (
        <div className="flex flex-col items-center gap-3 py-6 animate-in fade-in">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Đang chuyển hướng đến {method === "google" ? "Google" : "GitHub"}...
          </p>
        </div>
      )}

      {/* ── Magic Link success ── */}
      {method === "magiclink" && magicLinkSent && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-400 animate-in fade-in">
          <p className="font-medium mb-1">📧 Link đã được gửi!</p>
          <p className="text-xs text-emerald-400/70">Kiểm tra email (cả thư mục spam) và nhấp vào link để đăng nhập.</p>
        </div>
      )}

      {/* ── Method Selector ── */}
      {!method && !isSocialRedirecting && !(method === "magiclink" && magicLinkSent) && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
            Chọn phương thức
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMethod(m.id)}
                disabled={loading}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card/60 p-4 text-center transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">
                  {m.icon}
                </span>
                <span className="text-sm font-medium leading-tight">{m.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                  {m.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Email Form ── */}
      {method === "email" && !isSocialRedirecting && (
        <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Back button */}
          <button
            type="button"
            onClick={backToMethods}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-1"
          >
            <ArrowLeft className="size-3" />
            Chọn phương thức khác
          </button>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm" autoComplete="email" required disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-password" className="text-xs">Mật khẩu</Label>
                {tab === "signin" && (
                  <Link href="/auth/reset" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                    Quên mật khẩu?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-password" type="password"
                  placeholder={tab === "signup" ? "Ít nhất 6 ký tự" : "Mật khẩu của bạn"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm" autoComplete={tab === "signup" ? "new-password" : "current-password"} required disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 bg-primary text-primary-foreground hover:brightness-110 text-sm font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="size-4 animate-spin mr-1.5" />{tab === "signin" ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}</>
                : tab === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
            </Button>
          </form>
        </div>
      )}

      {/* ── Magic Link Form ── */}
      {method === "magiclink" && !magicLinkSent && !isSocialRedirecting && (
        <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <button
            type="button"
            onClick={backToMethods}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-1"
          >
            <ArrowLeft className="size-3" />
            Chọn phương thức khác
          </button>

          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="magic-email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="magic-email" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-sm" autoComplete="email" required disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 gap-1.5 text-sm font-semibold" variant="outline" disabled={loading}>
              {loading ? <><Loader2 className="size-4 animate-spin" />Đang gửi...</>
                : <><Wand2 className="size-4" />Gửi link đăng nhập</>}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              Bạn sẽ nhận được một email chứa link đăng nhập. Không cần mật khẩu.
            </p>
          </form>
        </div>
      )}

      {/* ── Footer link ── */}
      {!isSocialRedirecting && (
        <p className="text-center text-xs text-muted-foreground pt-1">
          {tab === "signin" ? (
            <>Chưa có tài khoản?{" "}<button type="button" onClick={() => switchTab("signup")} className="text-primary hover:underline font-medium">Đăng ký ngay</button></>
          ) : (
            <>Đã có tài khoản?{" "}<button type="button" onClick={() => switchTab("signin")} className="text-primary hover:underline font-medium">Đăng nhập</button></>
          )}
        </p>
      )}
    </div>
  );
}
