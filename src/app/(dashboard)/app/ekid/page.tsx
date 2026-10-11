"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KidAvatar } from "@/components/ekid/KidAvatar";
import { DailyLimitBadge } from "@/components/ekid/DailyLimitBadge";
import { AssessmentIntro } from "@/components/ekid/AssessmentIntro";
import { EkidVoiceSession, type EkidKidLite, type EkidLessonLite } from "@/components/ekid/EkidVoiceSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_LIMIT = 25;

export default function EkidPage() {
  const [kids, setKids] = useState<EkidKidLite[]>([]);
  const [selected, setSelected] = useState<EkidKidLite | null>(null);
  const [intro, setIntro] = useState<EkidKidLite | null>(null);
  const [lesson, setLesson] = useState<EkidLessonLite | null>(null);
  const [remaining, setRemaining] = useState(DEFAULT_LIMIT);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tạo bé ngay tại chỗ (không cần qua trang Thiết lập hồ sơ).
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

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

  // Tạo hồ sơ bé mới rồi nạp lại danh sách.
  async function createKid() {
    setCreateMsg(null);
    if (!newName.trim() || !newDob) {
      setCreateMsg("Vui lòng nhập tên và ngày sinh của con.");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/ekid/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), date_of_birth: newDob }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        setCreateMsg((d?.error as string) ?? "Có lỗi khi tạo hồ sơ bé.");
        return;
      }
      setNewName("");
      setNewDob("");
      setCreateMsg(null);
      setShowCreate(false);
      await loadKids();
    } catch {
      setCreateMsg("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  }

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

  // Form tạo bé — dùng chung cho cả trạng thái rỗng lẫn nút "Thêm bé".
  const createForm = (
    <div className="space-y-3 rounded-2xl border border-border bg-card/80 p-4">
      <h2 className="text-sm font-semibold text-foreground">Tạo hồ sơ bé</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          placeholder="Tên con"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setCreateMsg(null);
          }}
          className="flex-1"
        />
        <Input
          type="date"
          value={newDob}
          onChange={(e) => {
            setNewDob(e.target.value);
            setCreateMsg(null);
          }}
          className="sm:w-44"
          max={new Date().toISOString().split("T")[0]}
          aria-label="Ngày sinh của bé"
        />
        <Button onClick={createKid} disabled={creating}>
          {creating ? "Đang tạo..." : "Tạo hồ sơ bé"}
        </Button>
      </div>
      {createMsg && <p className="text-sm text-destructive">{createMsg}</p>}
    </div>
  );

  if (loading) return <div className="p-4 text-muted-foreground">Đang tải...</div>;

  if (!kids.length) {
    return (
      <div className="space-y-4 p-2 md:p-4" style={{ background: "#1a0a2e" }}>
        <h1 className="text-lg font-semibold text-foreground">eKid — Học cùng AI</h1>
        <p className="text-sm text-muted-foreground">
          Chưa có hồ sơ bé nào. Tạo hồ sơ cho con để bắt đầu học cùng AI Mentor (eKid).
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {createForm}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 md:p-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">eKid — Học cùng AI</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setShowCreate((s) => !s)}>
          ＋ Thêm bé
        </Button>
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
      {showCreate && createForm}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {intro ? (
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
