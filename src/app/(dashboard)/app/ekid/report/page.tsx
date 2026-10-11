"use client";
import { useEffect, useState } from "react";
import { KidProgress, type EkidSessionLite } from "@/components/ekid/KidProgress";

export default function EkidReportPage() {
  const [sessions, setSessions] = useState<EkidSessionLite[]>([]);
  const [kidId, setKidId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const kr = await fetch("/api/ekid/kids").then((r) => r.json());
      const kid = (kr.kids ?? [])[0];
      if (!kid) return;
      setKidId(kid.id);
      const sr = await fetch(`/api/ekid/session?kid_id=${kid.id}`).then((r) => r.json());
      setSessions(sr.sessions ?? []);
    })();
  }, []);

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">Tiến độ học của bé</h1>
      <KidProgress sessions={sessions} />
      {kidId && (
        <a href="/app/ekid/relatives" className="text-sm text-primary underline">
          Liên kết người thân →
        </a>
      )}
    </div>
  );
}
