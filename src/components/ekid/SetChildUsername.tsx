"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Tên đăng nhập hợp lệ: 3–20 ký tự trong [a-z0-9._] — khớp isValidUsername() phía server.
const USERNAME_RE = /^[a-z0-9._]{3,20}$/;

/** Đọc JSON an toàn, kèm thông điệp lỗi tiếng Việt nhất quán. */
async function readError(r: Response, fallback: string): Promise<string> {
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  return d.error || fallback;
}

/**
 * Đặt tên đăng nhập + mật khẩu cho con CHƯA có tài khoản (child_user_id IS NULL).
 * Dùng cho hồ sơ tạo từ v1 (trước khi có username). Gọi POST /api/ekid/kids/[kidId]/set-username.
 * Chỉ hiển thị cho chủ hồ sơ (isOwner).
 */
export function SetChildUsername({
  kidId,
  kidName,
  onChanged,
}: {
  kidId: string;
  kidName: string;
  onChanged: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit() {
    setMessage(null);
    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) {
      setMessage({
        kind: "err",
        text: "Tên đăng nhập cần 3–20 ký tự, chỉ gồm chữ thường a–z, số, dấu chấm hoặc gạch dưới.",
      });
      return;
    }
    if (password.length < 6) {
      setMessage({ kind: "err", text: "Mật khẩu phải có ít nhất 6 ký tự." });
      return;
    }
    if (password !== confirm) {
      setMessage({ kind: "err", text: "Mật khẩu xác nhận không khớp." });
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(`/api/ekid/kids/${kidId}/set-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password }),
      });
      if (!r.ok) {
        if (r.status === 409) {
          setMessage({
            kind: "err",
            text: `${await readError(r, "Tên đăng nhập đã tồn tại.")}. Chọn tên khác nhé.`,
          });
        } else {
          setMessage({ kind: "err", text: await readError(r, "Không đặt được tên đăng nhập.") });
        }
        return;
      }
      setMessage({
        kind: "ok",
        text: `Đã đặt tên đăng nhập cho ${kidName}. Con dùng tên đăng nhập + mật khẩu này để vào ekid.nooi.net.`,
      });
      setUsername("");
      setPassword("");
      setConfirm("");
      onChanged();
    } catch {
      setMessage({ kind: "err", text: "Không kết nối được máy chủ. Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-glass p-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Đặt tên đăng nhập cho con</h3>
        <p className="text-[11px] text-muted-foreground">
          Hồ sơ này chưa có tài khoản đăng nhập. Đặt tên đăng nhập + mật khẩu để con vào ekid.nooi.net.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="set-username">Tên đăng nhập</Label>
          <Input
            id="set-username"
            type="text"
            placeholder="VD: be.mai"
            autoComplete="off"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setMessage(null);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-password">Mật khẩu (≥6 ký tự)</Label>
          <Input
            id="set-password"
            type="password"
            placeholder="Ít nhất 6 ký tự"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage(null);
            }}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="set-confirm">Xác nhận mật khẩu</Label>
          <Input
            id="set-confirm"
            type="password"
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setMessage(null);
            }}
          />
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={message.kind === "ok" ? "text-sm text-n-green" : "text-sm text-destructive"}
        >
          {message.text}
        </p>
      )}

      <Button type="button" onClick={submit} disabled={busy} className="bg-primary text-primary-foreground">
        {busy ? "Đang lưu..." : "Đặt tên đăng nhập"}
      </Button>
    </div>
  );
}
