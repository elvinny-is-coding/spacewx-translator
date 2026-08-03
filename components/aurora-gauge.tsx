import { severityFromKp } from "@/config/constants";

interface AuroraGaugeProps {
  kp: number | null;
}

// Kp runs 0–9. The ring's filled arc length is proportional to kp / 9.
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AuroraGauge({ kp }: AuroraGaugeProps) {
  const { label, color } = severityFromKp(kp);
  const displayKp = kp !== null ? kp.toFixed(1) : "—";
  const isNoData = kp === null;

  // Determine the stroke colour: faint-star for no data, otherwise the severity colour
  const strokeColor = isNoData
    ? "var(--color-faint-star)"
    : `var(--color-${color})`;

  // Fraction of the ring to fill, clamped to [0, 1] in case kp ever
  // exceeds the nominal 0–9 range.
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
                // `color-mix()` is the valid way to apply alpha to a CSS
                // custom property inside a color function — appending
                // `/ 60%` directly after a bare var() is not valid CSS
                // and the browser silently drops the whole `filter`
                // declaration, so previously this glow never rendered.
                filter: `drop-shadow(0 0 12px color-mix(in srgb, var(--color-${color}) 60%, transparent))`,
              } as React.CSSProperties)
        }
        aria-label={`Current Kp index: ${displayKp}. Severity: ${label}`}
      >
        {/* Background ring */}
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="transparent"
          stroke="var(--color-deep-indigo)"
          strokeWidth="12"
        />
        {/* Coloured severity ring — arc length scales with kp / 9 */}
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
