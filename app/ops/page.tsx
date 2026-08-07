// app/ops/page.tsx
"use client";

import { useState } from "react";
import { useSpaceWeather } from "@/providers/space-weather-provider";
import RiskScorecard from "@/components/risk-scorecard";
import MissionAdvisor from "@/components/mission-advisor";
import HfAdvisor from "@/components/hf-advisor";
import PolarRouteBrief from "@/components/polar-route-brief";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function OpsPage() {
  const data = useSpaceWeather();
  const [polarAdvisoryActive, setPolarAdvisoryActive] = useState(false);

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

      {/* Audience callout */}
      <Card className="border border-deep-indigo bg-void-navy/40">
        <CardContent className="flex items-start gap-3 p-4">
          <Info size={18} className="text-aurora-green mt-0.5 shrink-0" />
          <p className="text-xs text-faint-star leading-relaxed">
            <span className="font-medium text-starlight">Who this is for:</span>{" "}
            Satellite operators, flight dispatchers, ham radio operators, and
            mission planners. If you're looking for aurora forecasts or
            educational content, the{" "}
            <strong className="text-starlight">Aurora</strong> and{" "}
            <strong className="text-starlight">Forecast</strong> pages are a
            better fit.
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-6">
          <MissionAdvisor data={data} />
        </CardContent>
      </Card>

      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-6">
          <RiskScorecard
            data={data}
            polarAdvisoryActive={polarAdvisoryActive}
          />
        </CardContent>
      </Card>

      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-6">
          <PolarRouteBrief onAdvisoryChange={setPolarAdvisoryActive} />
        </CardContent>
      </Card>

      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-6">
          <HfAdvisor data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
