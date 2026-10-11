"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KidAvatar } from "@/components/ekid/KidAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BAND_LABEL, type AgeBand } from "@/lib/ekid/ekid-system";

// Tên đăng nhập hợp lệ: 3–20 ký tự trong [a-z0-9._] — khớp isValidUsername() phía server.
const USERNAME_RE = /^[a-z0-9._]{3,20}$/;

/** Hồ sơ bé rút gọn dùng cho lưới danh sách con. */
interface KidListItem {
  id: string;
  name: string;
  avatar_emoji?: string | null;
  placement_age_band?: string | null;
  placement_level?: number | null;
  daily_limit_min?: number | null;
  status?: string | null;
  is_owner?: boolean;
}

/** Nhãn lứa tuổi từ placement_age_band (fallback: giá trị gốc). */
function bandLabel(band?: string | null): string {
  if (!band) return "Chưa định vị";
  return BAND_LABEL[band as AgeBand] ?? band;
}

/** Con đang bị khoá hay đang hoạt động (mặc định: hoạt động khi status trống). */
function isLocked(k: KidListItem): boolean {
  return k.status === "khoa";
}

export default function EkidPage() {
  const [kids, setKids] = useState<KidListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tạo tài khoản cho con: username + mật khẩu để con đăng nhập ekid.nooi.net.
  const [showCreate, setShowCreate] = useState(false);
  const [fName, setFName] = useState("");
  const [fDob, setFDob] = useState("");
  const [fUsername, setFUsername] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fEmoji, setFEmoji] = useState("🦊");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  // Nạp danh sách hồ sơ bé (chủ sở hữu + caregiver đã liên kết).
  const loadKids = useCallback(async (): Promise<KidListItem[]> => {
    const r = await fetch("/api/ekid/kids");
    if (!r.ok) throw new Error("Không tải được hồ sơ bé");
    const d = await r.json();
    const list: KidListItem[] = d.kids ?? [];
    setKids(list);
    return list;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadKids();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadKids]);

  // Tạo tài khoản con: kiểm tra hợp lệ phía client rồi POST kèm username + mật khẩu.
  // Lỗi trùng tên (409) / sai định dạng (400) hiện thông báo tiếng Việt rõ ràng.
  async function createKid() {
    setFormError(null);
    setCreatedUsername(null);

    const name = fName.trim();
    const username = fUsername.trim().toLowerCase();
    if (!name || !fDob) {
      setFormError("Vui lòng nhập tên và ngày sinh của con.");
      return;
    }
    if (!USERNAME_RE.test(username)) {
      setFormError("Tên đăng nhập cần 3–20 ký tự, chỉ gồm chữ thường a–z, số, dấu chấm hoặc gạch dưới.");
      return;
    }
    if (fPassword.length < 6) {
      setFormError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setCreating(true);
    try {
      const r = await fetch("/api/ekid/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date_of_birth: fDob,
          username,
          password: fPassword,
          avatar_emoji: fEmoji || "🦊",
        }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        if (r.status === 409) setFormError("Tên đăng nhập đã tồn tại. Chọn tên khác nhé.");
        else if (r.status === 400) setFormError(d?.error ?? "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.");
        else setFormError(d?.error ?? "Có lỗi khi tạo tài khoản cho con. Vui lòng thử lại.");
        return;
      }
      // Giữ nguyên các ô để cha/mẹ còn đọc lại tên đăng nhập + mật khẩu vừa nhập.
      setCreatedUsername(username);
      await loadKids().catch(() => {
        // Tạo xong nhưng nạp lại danh sách lỗi → không chặn thông báo thành công.
      });
    } catch {
      setFormError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  }

  // Xoá form để tạo bé kế tiếp.
  function resetCreateForm() {
    setFName("");
    setFDob("");
    setFUsername("");
    setFPassword("");
    setFEmoji("🦊");
    setFormError(null);
    setCreatedUsername(null);
  }

  const today = new Date().toISOString().split("T")[0];

  if (loading) return <div className="p-4 text-muted-foreground">Đang tải...</div>;

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-foreground">eKid — Quản lý con</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="bg-primary text-primary-foreground"
            onClick={() => {
              setShowCreate((v) => !v);
              setFormError(null);
            }}
          >
            {showCreate ? "Đóng" : "➕ Thêm con"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Tạo tài khoản cho con (username + mật khẩu để con vào ekid.nooi.net). */}
      {showCreate && (
        <section className="rounded-2xl border border-border bg-card/70 p-3 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Thêm con — tạo tài khoản đăng nhập</h2>

          {createdUsername && (
            <p className="rounded-lg border border-border bg-glass px-3 py-2 text-sm text-n-green">
              Đã tạo tài khoản cho con với tên đăng nhập <b className="font-semibold">{createdUsername}</b>. Đưa tên
              đăng nhập + mật khẩu này cho con để vào ekid.nooi.net.
            </p>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="kid-name">Tên con *</Label>
                <Input
                  id="kid-name"
                  type="text"
                  placeholder="VD: Bé Mai"
                  value={fName}
                  onChange={(e) => { setFName(e.target.value); setFormError(null); }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kid-dob">Ngày sinh *</Label>
                <Input
                  id="kid-dob"
                  type="date"
                  value={fDob}
                  max={today}
                  onChange={(e) => { setFDob(e.target.value); setFormError(null); }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kid-username">Tên đăng nhập *</Label>
                <Input
                  id="kid-username"
                  type="text"
                  placeholder="VD: be.mai"
                  autoComplete="off"
                  value={fUsername}
                  onChange={(e) => { setFUsername(e.target.value); setFormError(null); }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kid-password">Mật khẩu * (≥6 ký tự)</Label>
                <Input
                  id="kid-password"
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  autoComplete="new-password"
                  value={fPassword}
                  onChange={(e) => { setFPassword(e.target.value); setFormError(null); }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kid-emoji">Biểu tượng</Label>
                <Input
                  id="kid-emoji"
                  type="text"
                  placeholder="🦊"
                  className="w-16 text-center"
                  value={fEmoji}
                  onChange={(e) => setFEmoji(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={createKid} disabled={creating} className="bg-primary text-primary-foreground">
                {creating ? "Đang tạo..." : "Tạo tài khoản cho con"}
              </Button>
              {(createdUsername || fName || fUsername || fPassword) && (
                <Button type="button" variant="ghost" onClick={resetCreateForm}>
                  Tạo bé khác
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Tên đăng nhập 3–20 ký tự (chữ thường a–z, số, dấu chấm, gạch dưới). Con sẽ dùng tên đăng nhập + mật khẩu
              này để đăng nhập tại ekid.nooi.net.
            </p>
          </div>
        </section>
      )}

      {/* Lưới danh sách con — mỗi thẻ mở console của con. */}
      {!kids.length ? (
        <p className="text-sm text-muted-foreground">
          Chưa có hồ sơ bé nào. Dùng nút &quot;➕ Thêm con&quot; để tạo tài khoản cho con.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kids.map((k) => (
            <Link
              key={k.id}
              href={`/app/ekid/${k.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-3 transition-colors hover:border-primary/60"
            >
              <KidAvatar emoji={k.avatar_emoji || "🦊"} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-semibold text-foreground">{k.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {bandLabel(k.placement_age_band)} · Cấp {k.placement_level ?? 1}
                </p>
                <span
                  className={
                    isLocked(k)
                      ? "inline-flex items-center rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                      : "inline-flex items-center rounded-full border border-border bg-glass px-2 py-0.5 text-xs text-n-green"
                  }
                >
                  {isLocked(k) ? "🔒 Đang khoá" : "✅ Hoạt động"}
                </span>
              </div>
              <span className="shrink-0 text-muted-foreground" aria-hidden>
                ›
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
