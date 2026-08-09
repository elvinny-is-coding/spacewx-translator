"use client";

import StatusBar from "@/components/status-bar";
import ScalesDashboard from "@/components/noaa-scales/scales-dashboard";
import { useSpaceWeather } from "@/providers/space-weather-provider";

export default function ScalesPage() {
  const data = useSpaceWeather();

  return (
    <div className="space-y-8">
      <StatusBar
        lastUpdated={data.lastUpdated}
        warnings={data.warnings}
        kp={data.kp}
      />

      <section className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-starlight">
          NOAA Space Weather Scales
        </h2>
        <p className="text-sm text-faint-star">
          Real-time geomagnetic storm, radio blackout, and radiation storm scales
          with detailed system impact information
        </p>
      </section>

      <ScalesDashboard data={data} />
    </div>
  );
}
