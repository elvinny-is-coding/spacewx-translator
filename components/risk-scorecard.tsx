// components/risk-scorecard.tsx
"use client";

import { useState, useEffect } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { RiskAssessment, RiskLevel } from "@/types/risk-scorecard";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Loader2, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";

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

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];
const RISK_SCORES: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function riskColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-aurora-green/10 text-aurora-green border-aurora-green/30 dark:bg-aurora-green/20 dark:text-aurora-green dark:border-aurora-green/30";
    case "medium":
      return "bg-solar-amber/10 text-solar-amber border-solar-amber/30 dark:bg-solar-amber/20 dark:text-solar-amber dark:border-solar-amber/30";
    case "high":
      return "bg-solar-amber/20 text-solar-amber border-solar-amber/40 dark:bg-solar-amber/30 dark:text-solar-amber dark:border-solar-amber/40";
    case "critical":
      return "bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-600/20 dark:text-red-400 dark:border-red-600/30";
    default:
      return "bg-faint-star/10 text-faint-star border-faint-star/30 dark:bg-faint-star/20 dark:text-faint-star dark:border-faint-star/30";
  }
}

function riskProgressColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-aurora-green dark:bg-aurora-green";
    case "medium":
      return "bg-solar-amber dark:bg-solar-amber";
    case "high":
      return "bg-orange-500 dark:bg-orange-500";
    case "critical":
      return "bg-red-600 dark:bg-red-600";
    default:
      return "bg-faint-star dark:bg-faint-star";
  }
}

function riskProgressWidth(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "25%";
    case "medium":
      return "50%";
    case "high":
      return "75%";
    case "critical":
      return "100%";
    default:
      return "0%";
  }
}

function calculateOverallRisk(assessments: RiskAssessment[]): {
  level: RiskLevel;
  score: number;
  criticalCount: number;
  highCount: number;
} {
  if (assessments.length === 0) {
    return { level: "low", score: 0, criticalCount: 0, highCount: 0 };
  }

  const totalScore = assessments.reduce(
    (sum, a) => sum + RISK_SCORES[a.riskLevel],
    0,
  );
  const averageScore = totalScore / assessments.length;
  const criticalCount = assessments.filter((a) => a.riskLevel === "critical").length;
  const highCount = assessments.filter((a) => a.riskLevel === "high").length;

  let level: RiskLevel;
  if (criticalCount > 0) {
    level = "critical";
  } else if (highCount >= 2 || averageScore >= 3) {
    level = "high";
  } else if (averageScore >= 2) {
    level = "medium";
  } else {
    level = "low";
  }

  return { level, score: Math.round(averageScore * 10) / 10, criticalCount, highCount };
}

export default function RiskScorecard({ data }: RiskScorecardProps) {
  const [assessments, setAssessments] = useState<RiskAssessment[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (system: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(system)) {
        next.delete(system);
      } else {
        next.add(system);
      }
      return next;
    });
  };

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

  // Auto-expand high and critical risk cards
  useEffect(() => {
    if (assessments) {
      const highRiskSystems = assessments
        .filter((a) => a.riskLevel === "high" || a.riskLevel === "critical")
        .map((a) => a.system);
      setExpandedCards((prev) => {
        const next = new Set(prev);
        highRiskSystems.forEach((system) => next.add(system));
        return next;
      });
    }
  }, [assessments]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-aurora-green dark:text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight dark:text-starlight">
            Operational Risk Scorecard
          </h4>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full bg-void-navy dark:bg-void-navy" />
          <Skeleton className="h-16 w-full bg-void-navy dark:bg-void-navy" />
          <Skeleton className="h-16 w-full bg-void-navy dark:bg-void-navy" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-aurora-green dark:text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight dark:text-starlight">
            Operational Risk Scorecard
          </h4>
        </div>
        <div className="text-sm text-solar-amber text-center py-4 dark:text-solar-amber">{error}</div>
      </div>
    );
  }

  if (!assessments || assessments.length === 0) return null;

  const overallRisk = calculateOverallRisk(assessments);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-aurora-green dark:text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight dark:text-starlight">
            Operational Risk Scorecard
          </h4>
        </div>
        <p className="text-sm text-faint-star leading-relaxed dark:text-faint-star">
          Real-time risk assessment for critical operational systems based on current
          space weather conditions.
        </p>
      </div>

      {/* Summary Dashboard */}
      <div className="rounded-lg border border-deep-indigo bg-void-navy/30 dark:bg-void-navy/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-starlight dark:text-starlight" />
            <span className="text-sm font-medium text-starlight dark:text-starlight">Overall Risk Level</span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${riskColor(overallRisk.level)}`}
          >
            {overallRisk.level.toUpperCase()}
          </span>
        </div>
        
        {/* Risk Progress Bar */}
        <div className="mb-3">
          <div className="h-2 bg-deep-indigo/50 dark:bg-deep-indigo/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${riskProgressColor(overallRisk.level)}`}
              style={{ width: riskProgressWidth(overallRisk.level) }}
            />
          </div>
        </div>

        {/* Risk Statistics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-2">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{overallRisk.criticalCount}</div>
            <div className="text-xs text-faint-star dark:text-faint-star">Critical</div>
          </div>
          <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-2">
            <div className="text-lg font-bold text-solar-amber dark:text-solar-amber">{overallRisk.highCount}</div>
            <div className="text-xs text-faint-star dark:text-faint-star">High</div>
          </div>
          <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-2">
            <div className="text-lg font-bold text-aurora-green dark:text-aurora-green">{assessments.length - overallRisk.criticalCount - overallRisk.highCount}</div>
            <div className="text-xs text-faint-star dark:text-faint-star">Low/Med</div>
          </div>
        </div>
      </div>

      {/* System Risk Cards */}
      <div className="space-y-2">
        {assessments.map((a, i) => {
          const isExpanded = expandedCards.has(a.system);
          return (
            <div
              key={`${a.system}-${i}`}
              onClick={() => toggleCard(a.system)}
              className={`rounded-lg border transition-all cursor-pointer hover:opacity-90 ${riskColor(a.riskLevel)} ${
                isExpanded ? "p-4" : "p-3"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl" role="img" aria-hidden="true">
                  {SYSTEM_ICONS[a.system] || "📡"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-starlight dark:text-starlight">
                      {a.system}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${riskColor(a.riskLevel)}`}
                      >
                        {a.riskLevel.toUpperCase()}
                      </span>
                      <span className="text-faint-star transition-colors dark:text-faint-star">
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="h-1.5 bg-deep-indigo/50 dark:bg-deep-indigo/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${riskProgressColor(a.riskLevel)}`}
                        style={{ width: riskProgressWidth(a.riskLevel) }}
                      />
                    </div>
                  </div>

                  {/* Always visible: Driver */}
                  {a.driver && (
                    <div className="flex items-center gap-1 mb-1">
                      <Info size={12} className="text-faint-star/70 dark:text-faint-star/70" />
                      <p className="text-xs text-faint-star/90 dark:text-faint-star/90">
                        <span className="font-medium">Driver:</span> {a.driver}
                      </p>
                    </div>
                  )}

                  {/* Expandable: Detailed Recommendation */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-deep-indigo/30 dark:border-deep-indigo/30">
                      <p className="text-sm text-faint-star leading-relaxed dark:text-faint-star">
                        {a.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
