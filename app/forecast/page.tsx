// app/forecast/page.tsx
"use client";

import TrendChart from "@/components/trend-chart";
import HistoricalChart from "@/components/historical-chart";
import { useSpaceWeather } from "@/providers/space-weather-provider";

export default function ForecastPage() {
  const data = useSpaceWeather();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-starlight">
            What's coming?
          </h2>
          <p className="text-sm text-faint-star">
            Kairo's forecast of geomagnetic activity over the next week. Watch
            for upward swings — they often mean aurora may become visible
            farther from the poles.
          </p>
        </div>
        <TrendChart forecast={data.kpForecast} />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-starlight">
            What happened recently?
          </h2>
          <p className="text-sm text-faint-star">
            See how geomagnetic activity has changed over the past day, week, or
            month.
          </p>
        </div>
        <HistoricalChart />
      </section>
    </div>
  );
}
