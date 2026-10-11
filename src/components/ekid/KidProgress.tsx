"use client";

export interface EkidSessionLite {
  id: string;
  started_at: string;
  duration_min: number | null;
  score: number | null;
  ai_notes: string | null;
}

/**
 * Danh sách tiến độ các buổi học của bé: ngày, số phút, điểm và nhận xét AI.
 */
export function KidProgress({ sessions }: { sessions: EkidSessionLite[] }) {
  if (!sessions.length) {
    return <p className="text-sm text-muted-foreground">Chưa có buổi học nào. Hãy bắt đầu nào!</p>;
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s.id} className="rounded-xl border border-border bg-glass px-3 py-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{new Date(s.started_at).toLocaleDateString("vi-VN")}</span>
            <span>
              {s.duration_min ?? 0} phút{s.score != null ? ` · ${s.score}%` : ""}
            </span>
          </div>
          {s.ai_notes && <p className="text-foreground mt-1">{s.ai_notes}</p>}
        </li>
      ))}
    </ul>
  );
}
