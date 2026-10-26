import type { Metadata } from "next";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { authCookieOptions, OPC_HOST } from "@/lib/supabase/cookies";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "";
  return { title: host === OPC_HOST ? "Đăng nhập · OPC Center" : "Đăng nhập · NOOI" };
}

export default async function LoginPage() {
  // Nếu đã đăng nhập → redirect về dashboard.
  // Lưu ý: KHÔNG bọc redirect() trong try/catch — NEXT_REDIRECT là exception
  // điều khiển luồng, bắt nhầm sẽ nuốt redirect và hiện lại form đăng nhập.
  let daDangNhap = false;
  const host = (await headers()).get("host") || "";
  const laOpc = host === OPC_HOST;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
        cookieOptions: authCookieOptions(host),
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    daDangNhap = !!user;
  } catch {}
  if (daDangNhap) redirect(host === OPC_HOST ? "/" : "/app");

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-1/4 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-accent/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">{laOpc ? "Tiếp tục hành trình OPC" : "Chào mừng trở lại"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {laOpc
              ? "Đăng nhập để xem lộ trình, đơn hàng và cộng đồng của bạn."
              : "Đăng nhập vào tài khoản NOOI của bạn"}
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 sm:p-6 shadow-xl">
          <AuthForm defaultTab="signin" />
        </div>

        {laOpc ? (
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              ← Về trang OPC
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
