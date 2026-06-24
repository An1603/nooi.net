import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? "Không có";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Quản lý tài khoản và tuỳ chỉnh trải nghiệm NOOI của bạn.
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Hồ sơ cá nhân</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thông tin cơ bản về tài khoản của bạn.
          </p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email</label>
              <p className="text-sm font-medium">{email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tên hiển thị</label>
              <p className="text-sm font-medium">
                {user?.user_metadata?.full_name ?? email.split("@")[0]}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ID người dùng</label>
              <p className="text-xs font-mono text-muted-foreground truncate">{user?.id}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Ngày tạo</label>
              <p className="text-sm">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
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
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Đổi mật khẩu</p>
              <p className="text-xs text-muted-foreground">
                Cập nhật mật khẩu tài khoản của bạn
              </p>
            </div>
            <button className="text-sm text-primary hover:underline" disabled>
              Sắp có
            </button>
          </div>
          <div className="flex items-center justify-between">
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
