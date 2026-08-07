// components/anomaly-readiness-monitor.tsx
"use client";

import { useState, useEffect } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type {
  Subsystem,
  ReadinessLevel,
  ReadinessAssessment,
} from "@/types/anomaly-readiness";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Satellite,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

interface AnomalyReadinessMonitorProps {
  data: SpaceWeatherData;
}

const SUBSYSTEM_ICONS: Record<Subsystem, string> = {
  GNSS: "🛰️",
  "Star Tracker": "⭐",
  Communications: "📡",
  "Satellite Drag": "🛸",
  "Radiation SEU": "⚡",
};

function readinessColor(level: ReadinessLevel): string {
  switch (level) {
    case "low":
      return "bg-aurora-green/10 border-aurora-green/30 text-aurora-green";
    case "medium":
      return "bg-solar-amber/10 border-solar-amber/30 text-solar-amber";
    case "high":
      return "bg-solar-amber/20 border-solar-amber/40 text-solar-amber";
    case "critical":
      return "bg-red-600/10 border-red-600/30 text-red-400";
    default:
      return "bg-faint-star/10 border-faint-star/30 text-faint-star";
  }
}

function readinessBadge(level: ReadinessLevel): string {
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

export default function AnomalyReadinessMonitor({
  data,
}: AnomalyReadinessMonitorProps) {
  const [assessments, setAssessments] = useState<ReadinessAssessment[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (subsystem: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(subsystem)) {
        next.delete(subsystem);
      } else {
        next.add(subsystem);
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchReadiness() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/anomaly-readiness", {
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
    fetchReadiness();
    return () => {
      cancelled = true;
    };
  }, [data]);

  // Auto‑expand medium and high risk cards
  useEffect(() => {
    if (assessments) {
      const highRisk = assessments
        .filter(
          (a) =>
            a.level === "medium" ||
            a.level === "high" ||
            a.level === "critical",
        )
        .map((a) => a.subsystem);
      setExpandedCards((prev) => {
        const next = new Set(prev);
        highRisk.forEach((s) => next.add(s));
        return next;
      });
    }
  }, [assessments]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Satellite size={18} className="text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight">
            Anomaly Readiness Monitor
          </h4>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full bg-void-navy" />
          <Skeleton className="h-16 w-full bg-void-navy" />
          <Skeleton className="h-16 w-full bg-void-navy" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Satellite size={18} className="text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight">
            Anomaly Readiness Monitor
          </h4>
        </div>
        <div className="text-sm text-solar-amber text-center py-4">{error}</div>
      </div>
    );
  }

  if (!assessments || assessments.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Satellite size={18} className="text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight">
            Anomaly Readiness Monitor
          </h4>
        </div>
        <p className="text-sm text-faint-star leading-relaxed">
          Spacecraft subsystem readiness based on current space weather
          conditions. AI provides operational recommendations for each
          subsystem.
        </p>
      </div>

      {/* Subsystem cards */}
      <div className="space-y-2">
        {assessments.map((a, i) => {
          const isExpanded = expandedCards.has(a.subsystem);
          return (
            <div
              key={`${a.subsystem}-${i}`}
              onClick={() => toggleCard(a.subsystem)}
              className={`rounded-lg border transition-all cursor-pointer hover:opacity-90 ${readinessColor(a.level)} ${
                isExpanded ? "p-4" : "p-3"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg" role="img" aria-hidden="true">
                  {SUBSYSTEM_ICONS[a.subsystem]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-starlight">
                      {a.subsystem}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${readinessBadge(a.level)}`}
                      >
                        {a.level.toUpperCase()}
                      </span>
                      <span className="text-faint-star transition-colors">
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Driver */}
                  <div className="flex items-center gap-1 mb-1">
                    <Info size={12} className="text-faint-star/70" />
                    <p className="text-xs text-faint-star/90">
                      <span className="font-medium">Driver:</span> {a.driver}
                    </p>
                  </div>

                  {/* Expandable: AI recommendation */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-deep-indigo/30">
                      <p className="text-sm text-faint-star leading-relaxed">
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
