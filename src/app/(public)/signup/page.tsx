import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
      <div className="absolute top-1/4 -right-24 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -left-24 w-72 h-72 bg-primary/8 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Bắt đầu hành trình</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo tài khoản NOOI và khám phá sức mạnh AI
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 sm:p-6 shadow-xl">
          <AuthForm defaultTab="signup" />
        </div>
      </div>
    </div>
  );
}
