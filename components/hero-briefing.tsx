"use client";

import { useState } from "react";
import AudienceToggle from "@/components/audience-toggle";
import AiSummaryCard from "@/components/ai-summary-card";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";

interface HeroBriefingProps {
  data: SpaceWeatherData;
}

export default function HeroBriefing({ data }: HeroBriefingProps) {
  const [audience, setAudience] = useState<Audience>("general");

  return (
    <section className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="font-display text-3xl text-starlight">
          Your AI Space Weather Briefing
        </h2>
        <p className="text-sm text-faint-star">
          A personalised summary of what’s happening in space weather right now
          — pick your audience below.
        </p>
      </div>

      <div className="mx-auto max-w-md">
        <AudienceToggle selected={audience} onChange={setAudience} />
      </div>

      <div className="mx-auto max-w-2xl">
        {/* The key forces a brand new AiSummaryCard when audience changes,
            destroying any stale chat state. */}
        <AiSummaryCard key={audience} data={data} audience={audience} />
      </div>
    </section>
  );
}
