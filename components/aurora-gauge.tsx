import { severityFromKp } from "@/config/constants";

interface AuroraGaugeProps {
  kp: number | null;
}

export default function AuroraGauge({ kp }: AuroraGaugeProps) {
  const { label, color } = severityFromKp(kp);
  const displayKp = kp !== null ? kp.toFixed(1) : "—";
  const isNoData = kp === null;

  // Determine the stroke colour: faint-star for no data, otherwise the severity colour
  const strokeColor = isNoData
    ? "var(--color-faint-star)"
    : `var(--color-${color})`;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 200 200"
        width="256"
        height="256"
        className={
          isNoData
            ? "opacity-50"
            : "drop-shadow-[0_0_15px_var(--color-aurora-green)] animate-breathe"
        }
        style={
          isNoData
            ? undefined
            : ({
                filter: `drop-shadow(0 0 12px var(--color-${color}) / 60%)`,
              } as React.CSSProperties)
        }
        aria-label={`Current Kp index: ${displayKp}. Severity: ${label}`}
      >
        {/* Background ring */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="transparent"
          stroke="var(--color-deep-indigo)"
          strokeWidth="12"
        />
        {/* Coloured severity ring — full circle */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="transparent"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          className="transition-colors duration-700"
        />
        {/* Kp value in centre */}
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

      {/* Severity label below the gauge */}
      <p className="mt-2 text-sm font-medium" style={{ color: strokeColor }}>
        {label}
      </p>
    </div>
  );
}
