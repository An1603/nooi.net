"use client";

interface RadarChartProps {
  scores: Record<string, number>;
  labels: string[];
}

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
const LEVELS = 5;

export function RadarChart({ scores, labels }: RadarChartProps) {
  const keys = Object.keys(scores);
  const n = keys.length;
  if (n < 3) return null;

  // Compute polygon points
  const angleSlice = (2 * Math.PI) / n;

  function polarToCartesian(angle: number, r: number): [number, number] {
    const x = CENTER + r * Math.cos(angle - Math.PI / 2);
    const y = CENTER + r * Math.sin(angle - Math.PI / 2);
    return [x, y];
  }

  // Background grid (concentric polygons)
  const gridPolygons = [];
  for (let level = 1; level <= LEVELS; level++) {
    const r = (RADIUS / LEVELS) * level;
    const points = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = polarToCartesian(angleSlice * i, r);
      points.push(`${x},${y}`);
    }
    gridPolygons.push(
      <polygon
        key={`grid-${level}`}
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.5}
        className="text-border/50"
      />
    );
  }

  // Axis lines
  const axisLines = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = polarToCartesian(angleSlice * i, RADIUS);
    axisLines.push(
      <line
        key={`axis-${i}`}
        x1={CENTER} y1={CENTER}
        x2={x} y2={y}
        stroke="currentColor"
        strokeWidth={0.5}
        className="text-border/40"
      />
    );
  }

  // Score polygon
  const scorePoints = [];
  for (let i = 0; i < n; i++) {
    const key = keys[i];
    const score = scores[key] || 5;
    const r = (score / 10) * RADIUS;
    const [x, y] = polarToCartesian(angleSlice * i, r);
    scorePoints.push(`${x},${y}`);
  }

  // Labels
  const labelElements = [];
  for (let i = 0; i < n; i++) {
    const labelR = RADIUS + 24;
    const [x, y] = polarToCartesian(angleSlice * i, labelR);
    const displayLabel = labels[i] || keys[i];
    labelElements.push(
      <text
        key={`label-${i}`}
        x={x} y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        fontSize={10}
        fontWeight={500}
      >
        {displayLabel}
      </text>
    );
  }

  // Score dots
  const dots = [];
  for (let i = 0; i < n; i++) {
    const key = keys[i];
    const score = scores[key] || 5;
    const r = (score / 10) * RADIUS;
    const [x, y] = polarToCartesian(angleSlice * i, r);
    dots.push(
      <circle
        key={`dot-${i}`}
        cx={x} cy={y}
        r={4}
        fill="currentColor"
        className="text-primary"
      />
    );
  }

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {/* Center */}
      <circle cx={CENTER} cy={CENTER} r={2} className="fill-border/30" />

      {gridPolygons}
      {axisLines}

      {/* Score area */}
      <polygon
        points={scorePoints.join(" ")}
        fill="currentColor"
        className="text-primary/20"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {dots}
      {labelElements}
    </svg>
  );
}