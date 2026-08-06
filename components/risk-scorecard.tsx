// components/risk-scorecard.tsx
"use client";

import { useState, useEffect } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { RiskAssessment } from "@/types/risk-scorecard";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RiskScorecardProps {
  data: SpaceWeatherData;
}

const SYSTEM_ICONS: Record<string, string> = {
  "HF Communications": "📻",
  GNSS: "🛰️",
  "LEO Satellite Drag": "🛸",
  "Power Grid": "⚡",
  "Polar Aviation": "✈️",
};

function riskColor(level: string): string {
  switch (level) {
    case "low":
      return "bg-aurora-green text-void-navy";
    case "medium":
      return "bg-solar-amber/20 text-solar-amber";
    case "high":
      return "bg-solar-amber text-void-navy";
    case "critical":
      return "bg-red-600 text-white";
    default:
      return "bg-faint-star text-void-navy";
  }
}

export default function RiskScorecard({ data }: RiskScorecardProps) {
  const [assessments, setAssessments] = useState<RiskAssessment[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchRisk() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/risk-scorecard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
        const json = await res.json();
        if (!cancelled) {
          setAssessments(json.assessments);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Unknown error");
          setIsLoading(false);
        }
      }
    }
    fetchRisk();
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full bg-void-navy" />
        <Skeleton className="h-4 w-3/4 bg-void-navy" />
        <Skeleton className="h-4 w-5/6 bg-void-navy" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-solar-amber text-center py-4">{error}</div>
    );
  }

  if (!assessments || assessments.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-aurora-green" />
        <h4 className="text-sm font-semibold text-starlight">
          Operational Risk Scorecard
        </h4>
      </div>
      <div className="space-y-2">
        {assessments.map((a, i) => (
          <div
            key={`${a.system}-${i}`}
            className="rounded-lg border border-void-navy bg-void-navy/50 p-3 flex items-start gap-3"
          >
            <span className="text-lg" role="img" aria-hidden="true">
              {SYSTEM_ICONS[a.system] || "📡"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-starlight">
                  {a.system}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor(a.riskLevel)}`}
                >
                  {a.riskLevel.toUpperCase()}
                </span>
              </div>
              {a.driver && (
                <p className="text-xs text-faint-star mb-1 italic">
                  Driver: {a.driver}
                </p>
              )}
              <p className="text-xs text-faint-star leading-relaxed">
                {a.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
