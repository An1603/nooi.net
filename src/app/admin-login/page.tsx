"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Shield, Eye, EyeOff, Mail } from "lucide-react";

function translateAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("invalid login credentials")) return "Sai email hoặc mật khẩu.";
  if (msg.includes("too many requests")) return "Quá nhiều yêu cầu. Vui lòng chờ.";
  return message;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Vui lòng nhập email."); return; }
    if (!password) { toast.error("Vui lòng nhập mật khẩu."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const { data: au } = await supabase.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
      if (!au) { await supabase.auth.signOut(); toast.error("Không có quyền quản trị."); return; }
      toast.success("Đăng nhập thành công!");
      router.push("/admin");
    } catch (err: unknown) {
      toast.error(translateAuthError(err instanceof Error ? err.message : "Đăng nhập thất bại"));
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 mb-4">
            <Shield className="size-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">NOOI <span className="text-primary">Admin</span></h1>
          <p className="text-sm text-muted-foreground mt-1.5">Đăng nhập vào trang quản trị</p>
        </div>
        <div className="bg-[#0d0d0d] border border-border/40 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="al-email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="al-email" type="email" placeholder="admin@nooi.net" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-9 h-10 text-sm" disabled={loading} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="al-pw" className="text-xs">Mật khẩu</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="al-pw" type={showPw ? "text" : "password"} placeholder="Mật khẩu" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9 h-10 text-sm" disabled={loading} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-10 bg-primary text-primary-foreground hover:brightness-110 text-sm font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="size-4 animate-spin mr-1.5" />Đang đăng nhập...</> : "Đăng nhập"}
            </Button>
          </form>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-4">
          <a href="https://nooi.net" className="hover:text-foreground transition-colors">← Về NOOI.net</a>
        </p>
      </div>
    </div>
  );
}