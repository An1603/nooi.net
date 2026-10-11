import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Lấy hồ sơ bé của tài khoản đang đăng nhập (đọc qua RLS child_user_id).
async function currentKid() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ekid_kids")
    .select("name, avatar_emoji")
    .eq("child_user_id", user.id)
    .maybeSingle();

  return data;
}

// Layout tối giản cho phân hệ con — KHÔNG Sidebar/Topbar người lớn.
export default async function EkidLayout({ children }: { children: ReactNode }) {
  const kid = await currentKid();

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={{ backgroundColor: "#1a0a2e" }}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-2 py-2">
        <Link
          href="/ekid"
          className="flex items-center gap-1.5 text-xl font-extrabold text-primary"
        >
          <span aria-hidden>🎓</span>
          <span>eKid</span>
        </Link>

        {kid ? (
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">
              <span aria-hidden className="mr-1">
                {kid.avatar_emoji ?? "🦊"}
              </span>
              {kid.name}
            </span>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-full border border-border bg-card px-4 py-2 text-base font-bold text-card-foreground hover:opacity-90"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        ) : null}
      </header>

      <main className="flex-1 px-2 py-4">{children}</main>
    </div>
  );
}
