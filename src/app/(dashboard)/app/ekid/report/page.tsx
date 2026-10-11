"use client";
import { useEffect, useState } from "react";
import { KidProgress, type EkidSessionLite } from "@/components/ekid/KidProgress";

export default function EkidReportPage() {
  const [sessions, setSessions] = useState<EkidSessionLite[]>([]);
  const [kidId, setKidId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const kr = await fetch("/api/ekid/kids");
        if (!kr.ok) throw new Error("Không tải được hồ sơ bé");
        const kd = await kr.json();
        const kid = (kd.kids ?? [])[0];
        if (!kid) return;
        setKidId(kid.id);
        const sr = await fetch(`/api/ekid/session?kid_id=${kid.id}`);
        if (!sr.ok) throw new Error("Không tải được phiên học của bé");
        const sd = await sr.json();
        setSessions(sd.sessions ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-2 md:p-4 text-sm text-muted-foreground" style={{ background: "#1a0a2e" }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">Tiến độ học của bé</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <KidProgress sessions={sessions} />
      {kidId && (
        <a href="/app/ekid/relatives" className="text-sm text-primary underline">
          Liên kết người thân →
        </a>
      )}
    </div>
  );
}
