"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check that the user is authenticated via the recovery link
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login?error=Vui lòng dùng link đặt lại mật khẩu từ email.");
      } else {
        setChecking(false);
      }
    });
  }, [supabase, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      toast.success("Mật khẩu đã được đặt lại! Bạn có thể đăng nhập với mật khẩu mới.");
    } catch (err) {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, supabase]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle className="size-12 text-emerald-400 mx-auto" />
          <h1 className="text-xl font-bold">Mật khẩu đã được đặt lại!</h1>
          <p className="text-sm text-muted-foreground">Đăng nhập với mật khẩu mới.</p>
          <Button onClick={() => router.push("/login")} className="bg-primary text-primary-foreground">
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold">Đặt lại mật khẩu</h1>
          <p className="text-sm text-muted-foreground mt-1">Nhập mật khẩu mới</p>
        </div>
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-pass">Mật khẩu mới</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="new-pass" type="password" placeholder="Ít nhất 6 ký tự"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-8" autoComplete="new-password" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pass">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="confirm-pass" type="password" placeholder="Nhập lại mật khẩu"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-8" autoComplete="new-password" required />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:brightness-110">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
            </p>
          </form>
        </div>
      </div>
    );
  }
}