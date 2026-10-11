"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KidAvatar } from "@/components/ekid/KidAvatar";
import { DailyLimitBadge } from "@/components/ekid/DailyLimitBadge";
import { AssessmentIntro } from "@/components/ekid/AssessmentIntro";
import { EkidVoiceSession, type EkidKidLite, type EkidLessonLite } from "@/components/ekid/EkidVoiceSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_LIMIT = 25;
// Tên đăng nhập hợp lệ: 3–20 ký tự trong [a-z0-9._] — khớp isValidUsername() phía server.
const USERNAME_RE = /^[a-z0-9._]{3,20}$/;

export default function EkidPage() {
  const [kids, setKids] = useState<EkidKidLite[]>([]);
  const [selected, setSelected] = useState<EkidKidLite | null>(null);
  const [intro, setIntro] = useState<EkidKidLite | null>(null);
  const [lesson, setLesson] = useState<EkidLessonLite | null>(null);
  const [remaining, setRemaining] = useState(DEFAULT_LIMIT);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
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

  // Nạp danh sách hồ sơ bé (chủ sở hữu + caregiver đã liên kết) và trả về mảng mới nhất.
  async function loadKids(): Promise<EkidKidLite[]> {
    const r = await fetch("/api/ekid/kids");
    if (!r.ok) throw new Error("Không tải được hồ sơ bé");
    const d = await r.json();
    const list: EkidKidLite[] = d.kids ?? [];
    setKids(list);
    return list;
  }

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
  }, []);

  // Mở phiên voice cho bé: tải bài học theo lứa + số phút còn lại hôm nay.
  async function openSession(kid: EkidKidLite) {
    setError(null);
    const lim = kid.daily_limit_min ?? DEFAULT_LIMIT;
    try {
      const [lr, sr] = await Promise.all([
        fetch(`/api/ekid/lessons?band=${kid.placement_age_band ?? "mam-non"}`),
        fetch(`/api/ekid/session?kid_id=${kid.id}`),
      ]);
      if (!lr.ok || !sr.ok) {
        throw new Error("Không tải được bài học hoặc phiên học của bé");
      }
      const [l, s] = await Promise.all([lr.json(), sr.json()]);
      setLesson((l.lessons ?? [])[0] ?? null);
      setLimit(lim);
      setRemaining(s.remaining ?? lim);
      setSelected(kid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi mở phiên học");
    }
  }

  // Chọn con: nếu là con của mình và CHƯA làm test đầu vào → hiện bài kiểm tra trước.
  // Con của caregiver (is_owner === false) không có quyền nộp test → vào thẳng phiên.
  function pick(kid: EkidKidLite) {
    setError(null);
    if (kid.is_owner !== false && !kid.has_entry_test) {
      setIntro(kid);
      return;
    }
    void openSession(kid);
  }

  // Xong test đầu vào → nạp lại hồ sơ (lấy placement mới) rồi vào phiên voice.
  async function onIntroDone() {
    const k = intro;
    setIntro(null);
    let fresh: EkidKidLite | null = k;
    try {
      const list = await loadKids();
      fresh = list.find((x) => x.id === k?.id) ?? k;
    } catch {
      // Nếu nạp lại lỗi thì vẫn dùng hồ sơ cũ để vào phiên.
    }
    if (fresh) await openSession(fresh);
  }

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
      <h1 className="text-lg font-semibold text-foreground">eKid — Học cùng AI</h1>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/app/ekid/report"
          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          📊 Tiến độ
        </Link>
        <Link
          href="/app/ekid/relatives"
          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          👨‍👩‍👧 Người thân
        </Link>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Tạo tài khoản cho con (username + mật khẩu để con vào ekid.nooi.net). */}
      <section className="rounded-2xl border border-border bg-card/70 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Tạo tài khoản cho con</h2>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-3 text-sm"
            onClick={() => {
              setShowCreate((v) => !v);
              setFormError(null);
            }}
          >
            {showCreate ? "Đóng" : "➕ Tạo"}
          </Button>
        </div>

        {createdUsername && (
          <p className="rounded-lg border border-border bg-glass px-3 py-2 text-sm text-n-green">
            Đã tạo tài khoản cho con với tên đăng nhập <b className="font-semibold">{createdUsername}</b>. Đưa tên
            đăng nhập + mật khẩu này cho con để vào ekid.nooi.net.
          </p>
        )}

        {showCreate && (
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
        )}
      </section>

      {!kids.length ? (
        <p className="text-sm text-muted-foreground">
          Chưa có hồ sơ bé nào. Dùng nút &quot;Tạo&quot; phía trên để tạo tài khoản cho con.
        </p>
      ) : intro ? (
        <AssessmentIntro
          key={intro.id}
          kidId={intro.id}
          band={intro.placement_age_band ?? "mam-non"}
          onDone={onIntroDone}
        />
      ) : !selected ? (
        <div className="flex flex-wrap gap-3">
          {kids.map((k) => (
            <button key={k.id} onClick={() => pick(k)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/70 px-5 py-4">
              <KidAvatar emoji={k.avatar_emoji || "🦊"} />
              <span className="text-sm font-medium text-foreground">{k.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <DailyLimitBadge remaining={remaining} limit={limit} />
          <EkidVoiceSession kid={selected} lesson={lesson ?? undefined} remaining={remaining} />
        </div>
      )}
    </div>
  );
}
