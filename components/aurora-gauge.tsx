import { memo } from "react";
import { severityFromKp } from "@/config/constants";

interface AuroraGaugeProps {
  kp: number | null;
}

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AuroraGauge({ kp }: AuroraGaugeProps) {
  const { label, color } = severityFromKp(kp);
  const displayKp = kp !== null ? kp.toFixed(1) : "—";
  const isNoData = kp === null;

  const strokeColor = isNoData
    ? "var(--color-faint-star)"
    : `var(--color-${color})`;

  const progress = isNoData ? 0 : Math.max(0, Math.min(1, kp! / 9));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 200 200"
        width="256"
        height="256"
        className={isNoData ? "opacity-50" : "animate-breathe"}
        style={
          isNoData
            ? undefined
            : ({
                filter: `drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))`,
              } as React.CSSProperties)
        }
        aria-label={`Current Kp index: ${displayKp}. Severity: ${label}`}
      >
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="transparent"
          stroke="var(--color-deep-indigo)"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          className="transition-all duration-700"
        />
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="central"
          className={
            isNoData
              ? "fill-faint-star font-mono text-4xl"
              : "fill-starlight font-display text-5xl font-semibold"
          }
        >
          {displayKp}
        </text>
      </svg>

      <p className="mt-2 text-sm font-medium" style={{ color: strokeColor }}>
        {label}
      </p>
    </div>
  );
}

export default memo(AuroraGauge);
