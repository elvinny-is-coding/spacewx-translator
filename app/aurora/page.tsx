// app/aurora/page.tsx
"use client";

import { useSpaceWeather } from "@/providers/space-weather-provider";
import ClientMapSection from "@/components/client-map-section";

export default function AuroraPage() {
  const data = useSpaceWeather();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-starlight">
          Where Can You See the Aurora?
        </h2>
        <p className="text-sm text-faint-star">
          Tap anywhere on the map or use your location to check visibility right
          now. Download upcoming aurora events to your calendar.
        </p>
      </div>
      <ClientMapSection kpForecast={data.kpForecast} />
    </div>
  );
}
