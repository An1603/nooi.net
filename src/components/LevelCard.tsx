import { TrendingUp } from "lucide-react";

interface Props {
  level: number;
  levelName: string;
  n: number;
  nForNext: number;
  progressPercent: number;
}

const LEVEL_COLORS = [
  "text-amber-400", // Level 1
  "text-blue-400",  // Level 2
  "text-cyan-400",  // Level 3
  "text-amber-400", // Level 4
  "text-orange-400",// Level 5
  "text-red-400",   // Level 6
  "text-purple-400",// Level 7
];

export function LevelCard({ level, levelName, n, nForNext, progressPercent }: Props) {
  const levelColor = LEVEL_COLORS[Math.min(level - 1, 6)] || "text-amber-400";
  const remaining = nForNext > 0 ? nForNext - n : 0;

  return (
    <div className="rounded-xl border border-border/50 bg-[#1e1b4b]/80 p-6 backdrop-blur-sm hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start gap-6">
        {/* Left column */}
        <div className="flex-1">
          {/* Label */}
          <span className="text-xs text-muted-foreground">Cấp độ</span>

          {/* Level name */}
          <h2 className={`text-2xl font-bold mt-1 ${levelColor}`}>
            {levelName}
          </h2>
        </div>

        {/* Right column */}
        <div className="text-right shrink-0">
          <span className="text-xs text-muted-foreground">NOOI (N)</span>
          <p className="text-2xl font-bold text-white mt-1">{n} N</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(progressPercent, 100)}%`,
              background: "linear-gradient(90deg, #fbbf24, #4ade80)",
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {n >= 2500 ? (
            "🏆 Tối đa"
          ) : (
            <>{progressPercent}% — còn {remaining} N để lên cấp tiếp theo</>
          )}
        </p>
      </div>
    </div>
  );
}
