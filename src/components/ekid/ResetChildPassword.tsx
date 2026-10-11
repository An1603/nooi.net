"use client";
import { useState } from "react";

/**
 * (I-UI1) Đổi mật khẩu đăng nhập cho tài khoản con.
 * Phụ huynh (chủ hồ sơ) nhập mật khẩu mới (≥6 ký tự) → POST /api/ekid/kids/reset-password.
 * Chỉ hiển thị cho hồ sơ mà người dùng hiện tại là CHỦ (is_owner).
 */
export function ResetChildPassword({
  kidId,
  kidName,
}: {
  kidId: string;
  kidName: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit() {
    if (password.length < 6) {
      setMessage({ kind: "err", text: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ekid/kids/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kid_id: kidId, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Đổi mật khẩu thất bại");
      setMessage({ kind: "ok", text: `Đã đổi mật khẩu cho ${kidName}.` });
      setPassword("");
      setOpen(false);
    } catch (e) {
      setMessage({
        kind: "err",
        text: e instanceof Error ? e.message : "Có lỗi khi đổi mật khẩu",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMessage(null);
        }}
        className="rounded-full border border-border bg-glass px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/60"
      >
        🔑 Đổi mật khẩu cho con
      </button>

      {open && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-glass p-3 sm:flex-row sm:items-center">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
            autoComplete="new-password"
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Đang lưu..." : "Lưu mật khẩu"}
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={
            message.kind === "ok"
              ? "text-sm text-n-green"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
