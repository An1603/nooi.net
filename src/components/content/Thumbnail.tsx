import { cn } from "@/lib/utils";
import { Play, Music, FileText, Image, File, Mic, BookOpen, Sparkles } from "lucide-react";

// ─── Type-based gradient config ──────────────────────────────────────────────
const TYPE_THUMBNAIL: Record<
  string,
  {
    gradient: string;
    icon: React.ReactNode;
    pattern: "dots" | "waves" | "grid" | "circles" | "diamonds";
  }
> = {
  document: {
    gradient: "from-blue-900/60 via-blue-800/30 to-indigo-900/60",
    icon: <FileText className="w-8 h-8 text-blue-300/70" />,
    pattern: "dots",
  },
  video: {
    gradient: "from-red-900/60 via-rose-800/20 to-orange-900/50",
    icon: <Play className="w-8 h-8 text-red-300/70" />,
    pattern: "circles",
  },
  audio: {
    gradient: "from-green-900/60 via-emerald-800/20 to-teal-900/50",
    icon: <Music className="w-8 h-8 text-green-300/70" />,
    pattern: "waves",
  },
  image: {
    gradient: "from-yellow-900/60 via-amber-800/20 to-orange-900/50",
    icon: <Image className="w-8 h-8 text-yellow-300/70" />,
    pattern: "grid",
  },
  pdf: {
    gradient: "from-orange-900/60 via-red-800/20 to-rose-900/50",
    icon: <File className="w-8 h-8 text-orange-300/70" />,
    pattern: "diamonds",
  },
  note: {
    gradient: "from-purple-900/60 via-violet-800/20 to-fuchsia-900/50",
    icon: <BookOpen className="w-8 h-8 text-purple-300/70" />,
    pattern: "dots",
  },
  journal: {
    gradient: "from-cyan-900/60 via-sky-800/20 to-blue-900/50",
    icon: <Mic className="w-8 h-8 text-cyan-300/70" />,
    pattern: "waves",
  },
};

const DEFAULT_THUMBNAIL = {
  gradient: "from-accent/40 via-primary/20 to-secondary/40",
  icon: <Sparkles className="w-8 h-8 text-primary/50" />,
  pattern: "dots" as const,
};

// ─── SVG Pattern Overlays ────────────────────────────────────────────────────
function PatternDots() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots-pattern)" />
    </svg>
  );
}

function PatternWaves() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <path d="M0 100 Q50 50 100 100 Q150 150 200 100 Q250 50 300 100 Q350 150 400 100 L400 200 L0 200 Z" fill="currentColor" className="text-white" />
      <path d="M0 120 Q50 70 100 120 Q150 170 200 120 Q250 70 300 120 Q350 170 400 120 L400 200 L0 200 Z" fill="currentColor" className="text-white/60" />
    </svg>
  );
}

function PatternGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="1" height="30" fill="currentColor" className="text-white/30" />
          <rect width="30" height="1" fill="currentColor" className="text-white/30" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
}

function PatternCircles() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="circles-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" className="text-white/30" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circles-pattern)" />
    </svg>
  );
}

function PatternDiamonds() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="diamonds-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect x="15" y="0" width="15" height="15" fill="currentColor" className="text-white/20" transform="rotate(45 22.5 7.5)" />
          <rect x="0" y="15" width="15" height="15" fill="currentColor" className="text-white/20" transform="rotate(45 7.5 22.5)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#diamonds-pattern)" />
    </svg>
  );
}

const PATTERN_COMPONENTS: Record<string, React.FC> = {
  dots: PatternDots,
  waves: PatternWaves,
  grid: PatternGrid,
  circles: PatternCircles,
  diamonds: PatternDiamonds,
};

// ─── Main Thumbnail Component ────────────────────────────────────────────────
interface ThumbnailProps {
  fileType?: string | null;
  title: string;
  url?: string | null;
  thumbnailUrl?: string | null;
  className?: string;
  showOverlay?: boolean;
}

export function Thumbnail({
  fileType,
  title,
  url,
  thumbnailUrl,
  className,
  showOverlay = true,
}: ThumbnailProps) {
  const config = TYPE_THUMBNAIL[fileType || ""] || DEFAULT_THUMBNAIL;
  const Pattern = PATTERN_COMPONENTS[config.pattern] || PATTERN_COMPONENTS.dots;
  const firstLetter = title?.trim()?.[0]?.toUpperCase() || "?";

  // Nếu có thumbnail URL thật → dùng ảnh
  if (thumbnailUrl) {
    return (
      <div className={cn("relative aspect-video bg-muted overflow-hidden", className)}>
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden",
        "bg-gradient-to-br",
        config.gradient,
        className
      )}
    >
      {/* Pattern overlay */}
      <Pattern />

      {/* Radial glow */}
      <div className="absolute -top-1/2 -right-1/4 w-3/4 h-3/4 rounded-full bg-white/5 blur-3xl" />

      {/* Type icon top-right */}
      <div className="absolute top-3 right-3 opacity-60">{config.icon}</div>

      {/* Large initial letter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl font-black text-white/10 select-none tracking-tighter">
          {firstLetter}
        </span>
      </div>

      {/* Overlay gradient at bottom for text readability */}
      {showOverlay && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
      )}
    </div>
  );
}
