"use client";

import StatusBar from "@/components/status-bar";
import AuroraGauge from "@/components/aurora-gauge";
import { useSpaceWeather } from "@/providers/space-weather-provider";
import { severityFromKp } from "@/config/constants";

export default function OverviewPage() {
  const data = useSpaceWeather();
  const { label } = severityFromKp(data.kp);
  const alertCount = data.alerts.length;
  const notableFlares = data.flares.filter((f) => {
    const m = f.classType.match(/^([CXM])(\d+\.?\d*)$/i);
    if (!m) return false;
    const letter = m[1].toUpperCase();
    const num = parseFloat(m[2]);
    return letter === "X" || (letter === "M" && num >= 5);
  }).length;

  return (
    <div className="space-y-8">
      <StatusBar
        lastUpdated={data.lastUpdated}
        warnings={data.warnings}
        kp={data.kp}
      />

      <section className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-starlight">
          Current Space Weather
        </h2>
        <p className="text-sm text-faint-star">
          The Kp index shows how disturbed Earth’s magnetic field is right now.
          Higher values mean brighter aurora and possible effects on satellites,
          power grids, and radio signals.
        </p>
      </section>

      <section className="flex justify-center">
        <AuroraGauge kp={data.kp} />
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Kp Index" value={data.kp?.toFixed(1) ?? "—"} />
        <StatCard label="Condition" value={label} />
        <StatCard label="Active Alerts" value={String(alertCount)} />
        <StatCard label="Notable Flares" value={String(notableFlares)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-deep-indigo border border-void-navy p-4 text-center">
      <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-display text-starlight">{value}</p>
    </div>
  );
}
