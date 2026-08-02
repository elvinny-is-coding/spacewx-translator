"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { useAiSummary } from "@/hooks/use-ai-summary";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";

interface AiSummaryCardProps {
  data: SpaceWeatherData;
  audience: Audience;
}

const AUDIENCE_DESCRIPTIONS: Record<Audience, string> = {
  general:
    "A simple, jargon‑free explanation of what's happening in space weather right now — perfect for aurora watchers and curious minds.",
  educator:
    "A science‑focused summary explaining the causes and effects of current solar activity. Ideal for classrooms and self‑learning.",
  technical:
    "A precise technical brief for satellite operators, pilots, and radio engineers who need to understand potential impacts on their systems.",
};

export default function AiSummaryCard({ data, audience }: AiSummaryCardProps) {
  const { summary, isLoading, error, retry } = useAiSummary(data, audience);

  return (
    <Card className="border-none bg-deep-indigo shadow-lg">
      <CardContent className="p-6 space-y-3">
        <div>
          <h3 className="font-display text-lg text-starlight flex items-center gap-2">
            <Sparkles size={18} className="text-aurora-green" />
            Your AI Summary
          </h3>
          <p className="text-sm text-faint-star">
            {AUDIENCE_DESCRIPTIONS[audience]}
          </p>
        </div>

        <div className="min-h-[60px]">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-void-navy" />
              <Skeleton className="h-4 w-3/4 bg-void-navy" />
              <Skeleton className="h-4 w-5/6 bg-void-navy" />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle size={24} className="text-solar-amber" />
              <p className="text-sm text-faint-star">{error}</p>
              <button
                onClick={retry}
                className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-aurora-green transition hover:bg-void-navy"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && summary && (
            <p className="text-base leading-relaxed text-starlight">
              {summary}
            </p>
          )}

          {!isLoading && !error && !summary && (
            <p className="text-sm text-faint-star italic">
              Waiting for space weather data…
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
