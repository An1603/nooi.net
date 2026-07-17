"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, TrendingUp } from "lucide-react";

interface Entry {
  rank: number; user_id: string; name: string; n: number; journals: number;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const json = await res.json();
        if (json.leaderboard) setData(json.leaderboard);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 text-center text-sm text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="page-shell page-shell-narrow space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bảng xếp hạng</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Top học viên tích cực nhất</p>
        </div>
      </div>

      {loading && <p className="text-center text-muted-foreground">Đang tải...</p>}

      {data.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có dữ liệu. Hãy là người đầu tiên!</p>
        </div>
      )}

      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.user_id} className={`rounded-xl border p-4 flex items-center gap-4 ${
            entry.rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border bg-card"
          }`}>
            <div className="w-8 flex justify-center">{rankIcon(entry.rank)}</div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {entry.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{entry.name}</p>
              <p className="text-xs text-muted-foreground">{entry.journals} nhật ký</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{entry.n}</p>
              <p className="text-[12px] text-muted-foreground">N</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
