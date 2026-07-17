"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import Link from "next/link";

interface Quest {
  id: string; label: string; icon: string; n: number; done: boolean;
}

export default function QuestWidget() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completed, setCompleted] = useState(0);
  const [totalN, setTotalN] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/quest");
        const data = await res.json();
        if (data.quests) setQuests(data.quests);
        setCompleted(data.completed || 0);
        setTotalN(data.totalN || 0);
        setAllDone(data.allDone || false);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-sm">Nhiệm vụ hôm nay</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {completed}/{quests.length} · {allDone ? "✅ Xong" : `${totalN} N`}
        </span>
      </div>

      <div className="space-y-2">
        {quests.map((q) => (
          <div key={q.id} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${q.done ? "bg-green-500/5" : "bg-muted/10"}`}>
            {q.done ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
            )}
            <span className={`text-sm flex-1 ${q.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {q.icon} {q.label}
            </span>
            <span className={`text-[11px] font-medium ${q.done ? "text-green-400" : "text-muted-foreground"}`}>
              +{q.n} N
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
