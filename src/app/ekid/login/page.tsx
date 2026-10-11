"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { childEmail, normalizeUsername } from "@/lib/ekid/ekid-system";
import { KID } from "@/components/ekid/child/kid-theme";

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

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="text-7xl" aria-hidden>
          🚀
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-[#ff7a59]">
          Chào bé đến với eKid!
        </h1>
        <p className="mt-1 text-lg font-semibold text-[#6b5648]">
          Đăng nhập để bắt đầu học nhé
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col gap-4 rounded-3xl border-2 border-white bg-white/85 p-5 shadow-lg shadow-sky-200/60"
      >
        <label className="flex flex-col gap-1.5">
          <span className={KID.label}>Tên đăng nhập</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            placeholder="Ví dụ: be.an"
            className={KID.input}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={KID.label}>Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Mật khẩu của bé"
            className={KID.input}
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-[#ff7a59]/15 px-4 py-3 text-center text-lg font-bold text-[#e15a3a]"
          >
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={`mt-1 w-full ${KID.btnHero}`}>
          {loading ? "Đang vào lớp..." : "Vào học 🚀"}
        </button>
      </form>
    </div>
  );
}
