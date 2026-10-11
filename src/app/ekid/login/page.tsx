"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { childEmail, normalizeUsername } from "@/lib/ekid/ekid-system";

export default function EkidLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const normalized = normalizeUsername(username);
    if (!normalized || !password) {
      setError("Bé nhớ nhập đủ tên đăng nhập và mật khẩu nhé!");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: childEmail(normalized),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Tên đăng nhập hoặc mật khẩu chưa đúng. Bé thử lại nhé!");
      return;
    }

    router.push("/ekid");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="text-6xl" aria-hidden>
          🚀
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-primary">
          Chào bé đến với eKid!
        </h1>
        <p className="mt-1 text-lg font-semibold text-foreground">
          Đăng nhập để bắt đầu học nhé
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-lg"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-bold text-card-foreground">
            Tên đăng nhập
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            placeholder="Ví dụ: be.an"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-xl text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-bold text-card-foreground">Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Mật khẩu của bé"
            className="rounded-2xl border border-border bg-background px-4 py-3 text-xl text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-destructive/15 px-4 py-3 text-center text-lg font-bold text-destructive"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-full bg-primary px-6 py-4 text-2xl font-extrabold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang vào lớp..." : "Vào học 🚀"}
        </button>
      </form>
    </div>
  );
}
