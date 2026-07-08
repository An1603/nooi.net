"use client";

interface Dataset {
  label: string;
  scores: Record<string, number>;
  color: string;
}

interface MultiRadarChartProps {
  labels: string[];
  datasets: Dataset[];
}

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 130;
const LEVELS = 5;

export function MultiRadarChart({ labels, datasets }: MultiRadarChartProps) {
  const n = labels.length;
  if (n < 3) return null;

  const angleSlice = (2 * Math.PI) / n;

  function polarToCartesian(angle: number, r: number): [number, number] {
    const x = CENTER + r * Math.cos(angle - Math.PI / 2);
    const y = CENTER + r * Math.sin(angle - Math.PI / 2);
    return [x, y];
  }

  // Grid
  const gridPolygons = [];
  for (let level = 1; level <= LEVELS; level++) {
    const r = (RADIUS / LEVELS) * level;
    const points = [];
    for (let i = 0; i < n; i++) points.push(polarToCartesian(angleSlice * i, r).join(","));
    gridPolygons.push(
      <polygon key={level} points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth={0.5} className="text-border/50" />
    );
  }

  // Axis lines
  const axisLines = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = polarToCartesian(angleSlice * i, RADIUS);
    axisLines.push(<line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="currentColor" strokeWidth={0.5} className="text-border/40" />);
  }

  // Labels
  const labelElements = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = polarToCartesian(angleSlice * i, RADIUS + 24);
    labelElements.push(
      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize={10} fontWeight={500}>
        {labels[i]}
      </text>
    );
  }

  // Score polygons và dots
  const scorePolygons = datasets.map((ds, di) => {
    const points = labels.map((_, i) => {
      const key = labels[i]; // labels map 1:1 with axis keys
      // Tìm key thực từ labels
      const axisKeys = ["THẤY", "HIỂU", "BUÔNG", "AN TRÚ", "BIẾT ƠN", "PHỤNG SỰ", "TỈNH THỨC"];
      const actualKey = axisKeys[i];
      const score = ds.scores[actualKey] || 5;
      const r = (score / 10) * RADIUS;
      return polarToCartesian(angleSlice * i, r).join(",");
    });
    return (
      <polygon
        key={`poly-${di}`}
        points={points.join(" ")}
        fill={ds.color}
        fillOpacity={0.12}
        stroke={ds.color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    );
  });

  // Dots
  const dots = datasets.flatMap((ds, di) =>
    labels.map((_, i) => {
      const axisKeys = ["THẤY", "HIỂU", "BUÔNG", "AN TRÚ", "BIẾT ƠN", "PHỤNG SỰ", "TỈNH THỨC"];
      const actualKey = axisKeys[i];
      const score = ds.scores[actualKey] || 5;
      const r = (score / 10) * RADIUS;
      const [x, y] = polarToCartesian(angleSlice * i, r);
      return <circle key={`dot-${di}-${i}`} cx={x} cy={y} r={3.5} fill={ds.color} />;
    })
  );

  // Legend
  const legend = (
    <div className="flex justify-center gap-4 mt-3">
      {datasets.map((ds) => (
        <div key={ds.label} className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: ds.color }} />
          <span className="text-muted-foreground">{ds.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={CENTER} cy={CENTER} r={2} className="fill-border/30" />
        {gridPolygons}
        {axisLines}
        {scorePolygons}
        {dots}
        {labelElements}
      </svg>
      {legend}
    </div>
  );
}
