// app/ops/page.tsx
"use client";

import { useSpaceWeather } from "@/providers/space-weather-provider";
import RiskScorecard from "@/components/risk-scorecard";
import MissionAdvisor from "@/components/mission-advisor";
import HfAdvisor from "@/components/hf-advisor";

export default function OpsPage() {
  const data = useSpaceWeather();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-starlight">
          Operations Center
        </h2>
        <p className="text-sm text-faint-star">
          AI‑powered operational intelligence for satellite operators, flight
          dispatchers, and radio engineers. Real‑time risk assessment, mission
          go/no‑go guidance, and HF band propagation analysis — all driven by
          live space weather data.
        </p>
      </div>

      <RiskScorecard data={data} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MissionAdvisor data={data} />
        <HfAdvisor data={data} />
      </div>
    </div>
  );
}
