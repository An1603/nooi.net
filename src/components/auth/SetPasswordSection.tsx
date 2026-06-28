"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function SetPasswordSection() {
  const supabase = createClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("✅ Mật khẩu đã được đặt thành công! Bạn có thể dùng email + mật khẩu để đăng nhập.");
      setNewPassword("");
      setConfirmPassword("");
      setExpanded(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Đặt mật khẩu</p>
          <p className="text-xs text-muted-foreground">
            Bạn đăng nhập bằng Google/GitHub. Đặt mật khẩu để có thể đăng nhập bằng email.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setExpanded(true)}
          className="text-xs"
        >
          <Key className="size-3 mr-1.5" />
          Đặt mật khẩu
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Đặt mật khẩu mới</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Huỷ
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Đặt mật khẩu để có thể đăng nhập bằng email. Sau khi đặt, bạn vẫn có thể dùng Google/GitHub như trước.
      </p>

      <form onSubmit={handleSetPassword} className="space-y-3">
        {/* New password */}
        <div className="space-y-1">
          <Label htmlFor="set-new-pw" className="text-xs">Mật khẩu mới</Label>
          <div className="relative">
            <Key className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="set-new-pw"
              type={showNew ? "text" : "password"}
              placeholder="Ít nhất 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-8 pr-9 text-sm h-9"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Confirm new password */}
        <div className="space-y-1">
          <Label htmlFor="set-confirm-pw" className="text-xs">Xác nhận mật khẩu</Label>
          <div className="relative">
            <Key className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="set-confirm-pw"
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-8 pr-9 text-sm h-9"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full text-sm h-9 bg-primary text-primary-foreground hover:brightness-110"
        >
          {loading ? (
            <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Đang đặt mật khẩu...</>
          ) : (
            <><CheckCircle className="size-3.5 mr-1.5" /> Đặt mật khẩu</>
          )}
        </Button>
      </form>
    </div>
  );
}
