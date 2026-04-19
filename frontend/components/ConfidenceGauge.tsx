"use client";

interface Props {
  score: number; // 0 to 1
  size?: number;
}

export default function ConfidenceGauge({ score, size = 160 }: Props) {
  const pct = Math.max(0, Math.min(1, score));
  const radius = (size - 24) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc: 220 degrees total (from ~200° to ~-20°)
  const startAngle = -220;
  const sweepAngle = 220 * pct;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Background arc — full 220°
  const bgPath = arcPath(-200, 40, radius);

  // Foreground arc — proportion of score
  const fgEndDeg = -200 + sweepAngle;
  const fgPath = sweepAngle > 2 ? arcPath(-200, fgEndDeg, radius) : null;

  // Color
  const color =
    pct >= 0.7 ? "#22c55e" : pct >= 0.5 ? "#f59e0b" : "#ef4444";
  const label =
    pct >= 0.7 ? "High Confidence" : pct >= 0.5 ? "Moderate" : "Low Confidence";

  const strokeWidth = 14;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground arc */}
        {fgPath && (
          <path
            d={fgPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#glow)"
            style={{
              transition: "stroke-dasharray 1s ease, stroke 0.5s ease",
            }}
          />
        )}

        {/* Score text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.18}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {Math.round(pct * 100)}%
        </text>

        {/* Sub-label */}
        <text
          x={cx}
          y={cy + size * 0.13}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={size * 0.09}
          fontFamily="Inter, sans-serif"
        >
          confidence
        </text>
      </svg>
      <span
        className="text-sm font-semibold mt-1"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
