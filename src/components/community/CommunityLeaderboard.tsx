"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";

interface Entry { rank: number; name: string; n: number; journals: number; }

export default function CommunityLeaderboard() {
  const [data, setData] = useState<Entry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const json = await res.json();
        if (json.leaderboard) setData(json.leaderboard);
      } catch {}
    })();
  }, []);

  if (data.length === 0) return null;

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 text-center text-sm text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-sm">Bảng xếp hạng</h2>
      </div>
      <div className="space-y-2">
        {data.slice(0, 10).map((entry) => (
          <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-lg ${
            entry.rank <= 3 ? "bg-primary/5" : ""
          }`}>
            <div className="w-6 flex justify-center">{rankIcon(entry.rank)}</div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {entry.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{entry.name}</p>
              <p className="text-[12px] text-muted-foreground">{entry.journals} nhật ký</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{entry.n}</p>
              <p className="text-[12px] text-muted-foreground">N</p>
            </div>
          </div>
        ))}
      </div>
      {data.length > 10 && (
        <p className="text-[12px] text-center text-muted-foreground mt-3">+{data.length - 10} người khác</p>
      )}
    </div>
  );
}
