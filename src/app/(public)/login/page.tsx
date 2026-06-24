import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-1/4 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-accent/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold">Chào mừng trở lại</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Đăng nhập vào tài khoản NOOI của bạn
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl">
          <AuthForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Chưa có tài khoản?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
