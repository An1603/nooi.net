import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";
import { AccountLinkingSection } from "@/components/auth/AccountLinking";
import { ChangePasswordSection } from "@/components/auth/ChangePasswordSection";
import { SetPasswordSection } from "@/components/auth/SetPasswordSection";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const email = user?.email ?? "Không có";

  // Check if user has email/password identity
  const identities: { provider: string }[] = (user?.identities ?? []) as { provider: string }[];
  const hasEmailIdentity = identities.some((i) => i.provider === "email");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Quản lý tài khoản và tuỳ chỉnh trải nghiệm NOOI của bạn.
        </p>
      </div>

      {/* Profile Section */}
      <SettingsForm
        user={{
          email,
          id: user.id,
          createdAt: user.created_at,
        }}
        profile={profile ? {
          full_name: profile.full_name,
          date_of_birth: profile.date_of_birth,
          gio_sinh: profile.gio_sinh,
          gioi_tinh: profile.gioi_tinh,
          noi_sinh: profile.noi_sinh,
          vi_do: profile.vi_do,
          kinh_do: profile.kinh_do,
          numerology_report: profile.numerology_report !== null,
          tuvi_report: profile.tuvi_report !== null,
          chiem_tinh_report: profile.chiem_tinh_report !== null,
        } : null}
      />

      {/* Account Linking Section */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Liên kết tài khoản</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gộp các phương thức đăng nhập vào cùng một tài khoản NOOI.
          </p>
        </div>
        <div className="px-5 py-4">
          <AccountLinkingSection />
        </div>
      </div>

      {/* Appearance Section */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Giao diện</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tuỳ chỉnh giao diện hiển thị.
          </p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Chế độ tối</p>
              <p className="text-xs text-muted-foreground">NOOI được thiết kế cho chế độ tối</p>
            </div>
            <div className="w-9 h-5 rounded-full bg-accent relative">
              <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ngôn ngữ</p>
              <p className="text-xs text-muted-foreground">Ngôn ngữ hiển thị trong ứng dụng</p>
            </div>
            <p className="text-sm font-medium text-primary">Tiếng Việt</p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Bảo mật</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý mật khẩu và bảo mật tài khoản.
          </p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Đổi mật khẩu — chỉ hiện cho email/password users */}
          {hasEmailIdentity ? (
            <ChangePasswordSection userEmail={email} />
          ) : (
            /* Đặt mật khẩu — cho OAuth-only users (Google/GitHub) */
            <SetPasswordSection />
          )}

          {/* Separator */}
          <div className="border-t border-border/50" />

          <div className="flex items-center justify-between opacity-60">
            <div>
              <p className="text-sm font-medium">Xác thực 2 lớp</p>
              <p className="text-xs text-muted-foreground">
                Thêm lớp bảo vệ cho tài khoản
              </p>
            </div>
            <button className="text-sm text-primary hover:underline" disabled>
              Sắp có
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-card">
        <div className="px-5 py-4 border-b border-destructive/20">
          <h2 className="text-base font-semibold text-destructive">Vùng nguy hiểm</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Các hành động không thể hoàn tác.
          </p>
        </div>
        <div className="px-5 py-4">
          <button
            disabled
            className="px-4 py-2 rounded-lg border border-destructive/50 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xoá tài khoản
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Tính năng này sẽ có trong bản cập nhật tới.
          </p>
        </div>
      </div>
    </div>
  );
}
