"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Wand2 } from "lucide-react";

type AuthTab = "signin" | "signup";
type AuthError = { message: string } | null;

function extractErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error_description === "string") return obj.error_description;
    if (typeof obj.error === "string") return obj.error;
    try {
      const parsed = JSON.parse(JSON.stringify(obj));
      if (typeof parsed?.message === "string") return parsed.message;
      if (typeof parsed?.error === "string") return parsed.error;
    } catch {
      // ignore
    }
  }
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export function AuthForm() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const handleTabSwitch = useCallback((newTab: AuthTab) => {
    setTab(newTab);
    setError(null);
    setMagicLinkSent(false);
  }, []);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError({ message: "Vui lòng nhập email." });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError({ message: "Email không hợp lệ." });
      return false;
    }
    if (tab === "signup" && password.length < 6) {
      setError({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
      return false;
    }
    if (tab === "signin" && !password) {
      setError({ message: "Vui lòng nhập mật khẩu." });
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const emailTrimmed = email.trim();

      if (tab === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: emailTrimmed,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) throw signUpError;

        if (data?.user?.identities?.length === 0) {
          setError({
            message: "Email này đã được đăng ký. Vui lòng đăng nhập.",
          });
          return;
        }

        if (data?.user && !data.session) {
          setError({
            message: "Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.",
          });
          return;
        }

        router.push("/app");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
        });

        if (signInError) throw signInError;
        router.push("/app");
      }
    } catch (err) {
      setError({ message: extractErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    clearError();
    setLoading(true);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oAuthError) throw oAuthError;
    } catch (err) {
      setError({ message: extractErrorMessage(err) });
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    clearError();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError({ message: "Vui lòng nhập email hợp lệ trước." });
      return;
    }

    setLoading(true);
    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (magicLinkError) throw magicLinkError;
      setMagicLinkSent(true);
    } catch (err) {
      setError({ message: extractErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {tab === "signin"
            ? "Đăng nhập để tiếp tục"
            : "Tạo tài khoản mới"}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => handleTabSwitch("signin")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "signin"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => handleTabSwitch("signup")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "signup"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Đăng ký
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error.message}
        </div>
      )}

      {/* Magic link success */}
      {magicLinkSent && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-400"
        >
          Link ma thuật đã được gửi! Kiểm tra email (cả thư mục spam).
        </div>
      )}

      {/* Email / Password form */}
      <form onSubmit={handleEmailAuth} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              className="pl-8"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="auth-password">Mật khẩu</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="auth-password"
              type="password"
              placeholder={
                tab === "signup"
                  ? "Ít nhất 6 ký tự"
                  : "Mật khẩu của bạn"
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              className="pl-8"
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              required
              disabled={loading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:brightness-110"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {tab === "signin" ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}
            </>
          ) : tab === "signin" ? (
            "Đăng nhập"
          ) : (
            "Tạo tài khoản"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("github")}
          disabled={loading}
          className="w-full"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          GitHub
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSocialLogin("google")}
          disabled={loading}
          className="w-full"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.83 0 3.53.63 4.87 1.68l-2.04 3.53C14.14 10.09 13.11 9.82 12 9.82c-1.83 0-3.53.63-4.87 1.68L5.09 7.97C6.43 6.63 8.17 5 12 5zM6.5 12c0-.83.13-1.63.37-2.39L9.9 13.1c-.57.51-.93 1.26-.93 2.1 0 .73.28 1.39.74 1.87l-3.53 2.04C5.13 17.53 4.5 15.83 4.5 12zm5.5 7c-1.83 0-3.53-.63-4.87-1.68l2.04-3.53c.49.27 1.04.42 1.63.42 1.66 0 3-1.34 3-3 0-.59-.15-1.14-.42-1.63l3.53-2.04C18.87 8.47 19.5 10.17 19.5 12c0 3.87-3.13 7-7 7z"/></svg>
          Google
        </Button>
      </div>

      {/* Magic Link */}
      <div className="text-center">
        <Button
          variant="link"
          size="sm"
          onClick={handleMagicLink}
          disabled={loading}
          className="text-xs text-muted-foreground"
        >
          <Wand2 className="size-3" />
          Gửi link ma thuật
        </Button>
      </div>
    </div>
  );
}
