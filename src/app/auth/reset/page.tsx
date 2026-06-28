"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Email không hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/update-password` }
      );
      if (sendError) throw sendError;
      setSent(true);
      toast.success("Đã gửi email đặt lại mật khẩu! Kiểm tra hộp thư (cả thư mục spam).");
    } catch (err) {
      toast.error("Gửi email thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [email, supabase]);

  if (sent) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle className="size-12 text-emerald-400 mx-auto" />
          <h1 className="text-xl font-bold">Đã gửi email!</h1>
          <p className="text-sm text-muted-foreground">
            Kiểm tra email <strong>{email}</strong> để đặt lại mật khẩu (cả thư mục Spam).
          </p>
          <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="size-3" /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold">Quên mật khẩu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nhập email để nhận link đặt lại mật khẩu
          </p>
        </div>
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="reset-email" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:brightness-110">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang gửi...
                </>
              ) : (
                "Gửi link đặt lại mật khẩu"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Quay lại đăng nhập</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}