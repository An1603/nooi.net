"use client";
import { useEffect, useState } from "react";
import { KidAvatar } from "@/components/ekid/KidAvatar";
import { DailyLimitBadge } from "@/components/ekid/DailyLimitBadge";
import { EkidVoiceSession, type EkidKidLite, type EkidLessonLite } from "@/components/ekid/EkidVoiceSession";

export default function EkidPage() {
  const [kids, setKids] = useState<EkidKidLite[]>([]);
  const [selected, setSelected] = useState<EkidKidLite | null>(null);
  const [lesson, setLesson] = useState<EkidLessonLite | null>(null);
  const [remaining, setRemaining] = useState(25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/ekid/kids");
      const d = await r.json();
      setKids(d.kids ?? []);
      setLoading(false);
    })();
  }, []);

  async function pick(kid: EkidKidLite) {
    setSelected(kid);
    const [l, s] = await Promise.all([
      fetch(`/api/ekid/lessons?band=${kid.placement_age_band ?? "mam-non"}`).then((r) => r.json()),
      fetch(`/api/ekid/session?kid_id=${kid.id}`).then((r) => r.json()),
    ]);
    setLesson((l.lessons ?? [])[0] ?? null);
    setRemaining(s.remaining ?? 25);
  }

  if (loading) return <div className="p-4 text-muted-foreground">Đang tải...</div>;

  if (!kids.length) {
    return (
      <div className="p-4" style={{ background: "#1a0a2e" }}>
        <h1 className="text-lg font-semibold text-foreground">eKid — Học cùng AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chưa có hồ sơ bé nào. Tạo tài khoản cho con trong phần Thiết lập hồ sơ.
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">eKid — Học cùng AI</h1>
      {!selected ? (
        <div className="flex flex-wrap gap-3">
          {kids.map((k) => (
            <button key={k.id} onClick={() => pick(k)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/70 px-5 py-4">
              <KidAvatar emoji="🦊" />
              <span className="text-sm font-medium text-foreground">{k.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <DailyLimitBadge remaining={remaining} limit={25} />
          <EkidVoiceSession kid={selected} lesson={lesson ?? undefined} remaining={remaining} />
        </div>
      )}
    </div>
  );
}
