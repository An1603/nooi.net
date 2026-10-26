import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { authCookieName, OPC_HOST } from "@/lib/supabase/cookies";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Nếu đã đăng nhập → redirect về dashboard.
  // Lưu ý: KHÔNG bọc redirect() trong try/catch — NEXT_REDIRECT là exception
  // điều khiển luồng, bắt nhầm sẽ nuốt redirect và hiện lại form đăng nhập.
  let daDangNhap = false;
  const host = (await headers()).get("host") || "";
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
        cookieOptions: { name: authCookieName(host) },
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
          <h1 className="text-xl font-bold">Chào mừng trở lại</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Đăng nhập vào tài khoản NOOI của bạn
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 sm:p-6 shadow-xl">
          <AuthForm defaultTab="signin" />
        </div>
      </div>
    </div>
  );
}
