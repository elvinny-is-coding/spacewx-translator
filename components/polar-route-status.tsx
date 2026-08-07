// components/polar-route-status.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Clock, CheckCircle, Sparkles, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import type { IcaoAdvisory } from "@/types/icao";

interface PolarRouteStatusProps {
  onAdvisoryChange?: (active: boolean) => void;
}

function getSeverityLevel(advisory: IcaoAdvisory): "low" | "medium" | "high" {
  const text = advisory.advisory_text.toLowerCase();
  const phenomenon = advisory.phenomenon?.toLowerCase() || "";
  
  // High severity indicators
  if (text.includes("severe") || text.includes("critical") || text.includes("blackout") || 
      phenomenon.includes("blackout") || phenomenon.includes("severe")) {
    return "high";
  }
  
  // Medium severity indicators
  if (text.includes("moderate") || text.includes("elevated") || text.includes("advisory") ||
      phenomenon.includes("advisory") || phenomenon.includes("moderate")) {
    return "medium";
  }
  
  return "low";
}

function severityColor(level: string): string {
  switch (level) {
    case "high":
      return "bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-600/20 dark:text-red-400 dark:border-red-600/30";
    case "medium":
      return "bg-solar-amber/10 text-solar-amber border-solar-amber/30 dark:bg-solar-amber/20 dark:text-solar-amber dark:border-solar-amber/30";
    case "low":
      return "bg-aurora-green/10 text-aurora-green border-aurora-green/30 dark:bg-aurora-green/20 dark:text-aurora-green dark:border-aurora-green/30";
    default:
      return "bg-faint-star/10 text-faint-star border-faint-star/30 dark:bg-faint-star/20 dark:text-faint-star dark:border-faint-star/30";
  }
}

function severityIcon(level: string) {
  switch (level) {
    case "high":
      return <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />;
    case "medium":
      return <AlertTriangle size={16} className="text-solar-amber" />;
    case "low":
      return <CheckCircle size={16} className="text-aurora-green" />;
    default:
      return <Info size={16} className="text-faint-star" />;
  }
}

export default function PolarRouteStatus({
  onAdvisoryChange,
}: PolarRouteStatusProps) {
  const [advisories, setAdvisories] = useState<IcaoAdvisory[] | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<Set<string>>(
    new Set(),
  );
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (advisoryNumber: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(advisoryNumber)) {
        next.delete(advisoryNumber);
      } else {
        next.add(advisoryNumber);
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/icao-advisory");
        if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
        const json = await res.json();
        if (!cancelled) {
          setAdvisories(json.advisories ?? []);
          setLastChecked(json.lastChecked);
          onAdvisoryChange?.(json.advisories && json.advisories.length > 0);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Unknown error");
          setIsLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [onAdvisoryChange]);

  const fetchSummary = useCallback(
    async (advisory: IcaoAdvisory) => {
      if (
        summaries[advisory.advisory_number] ||
        loadingSummaries.has(advisory.advisory_number)
      )
        return;

      setLoadingSummaries((prev) =>
        new Set(prev).add(advisory.advisory_number),
      );
      try {
        const res = await fetch("/api/icao-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            advisoryNumber: advisory.advisory_number,
            advisoryText: advisory.advisory_text,
          }),
        });
        if (!res.ok) return;
        const json = await res.json();
        setSummaries((prev) => ({
          ...prev,
          [advisory.advisory_number]: json.summary,
        }));
      } catch {
        // ignore
      } finally {
        setLoadingSummaries((prev) => {
          const next = new Set(prev);
          next.delete(advisory.advisory_number);
          return next;
        });
      }
    },
    [summaries, loadingSummaries],
  );

  // Fetch summaries when advisories load
  useEffect(() => {
    if (!advisories || advisories.length === 0) return;
    for (const advisory of advisories) {
      fetchSummary(advisory);
    }
  }, [advisories, fetchSummary]);

  if (isLoading) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Plane size={18} className="text-aurora-green dark:text-aurora-green" />
            <h4 className="text-base font-semibold text-starlight dark:text-starlight">
              Polar Route Advisories
            </h4>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-full bg-void-navy dark:bg-void-navy" />
            <Skeleton className="h-16 w-full bg-void-navy dark:bg-void-navy" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Plane size={18} className="text-aurora-green dark:text-aurora-green" />
            <h4 className="text-base font-semibold text-starlight dark:text-starlight">
              Polar Route Advisories
            </h4>
          </div>
          <p className="text-sm text-solar-amber dark:text-solar-amber">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const hasAdvisories = advisories && advisories.length > 0;
  const checkedTime = lastChecked
    ? new Date(lastChecked).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Calculate summary statistics
  const summaryStats = hasAdvisories ? {
    total: advisories!.length,
    high: advisories!.filter(a => getSeverityLevel(a) === "high").length,
    medium: advisories!.filter(a => getSeverityLevel(a) === "medium").length,
    low: advisories!.filter(a => getSeverityLevel(a) === "low").length,
  } : { total: 0, high: 0, medium: 0, low: 0 };

  return (
    <Card className="border-none bg-deep-indigo">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Plane size={18} className="text-aurora-green dark:text-aurora-green" />
            <h4 className="text-base font-semibold text-starlight dark:text-starlight">
              Polar Route Advisories
            </h4>
          </div>
          <p className="text-sm text-faint-star leading-relaxed dark:text-faint-star">
            Real-time ICAO space weather advisories affecting polar aviation routes.
            Monitor radiation levels and HF communication conditions for flight safety.
          </p>
        </div>

        {/* Summary Dashboard */}
        {hasAdvisories && (
          <div className="rounded-lg border border-deep-indigo bg-void-navy/30 dark:bg-void-navy/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-starlight dark:text-starlight" />
                <span className="text-sm font-medium text-starlight dark:text-starlight">Advisory Summary</span>
              </div>
              <span className="text-xs text-faint-star dark:text-faint-star">
                {checkedTime && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Last checked: {checkedTime}
                  </span>
                )}
              </span>
            </div>
            
            {/* Statistics Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-2">
                <div className="text-lg font-bold text-starlight dark:text-starlight">{summaryStats.total}</div>
                <div className="text-xs text-faint-star dark:text-faint-star">Total</div>
              </div>
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-2">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{summaryStats.high}</div>
                <div className="text-xs text-faint-star dark:text-faint-star">High</div>
              </div>
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-2">
                <div className="text-lg font-bold text-solar-amber">{summaryStats.medium}</div>
                <div className="text-xs text-faint-star dark:text-faint-star">Medium</div>
              </div>
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-2">
                <div className="text-lg font-bold text-aurora-green dark:text-aurora-green">{summaryStats.low}</div>
                <div className="text-xs text-faint-star dark:text-faint-star">Low</div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasAdvisories && (
          <div className="flex items-start gap-3 text-sm text-faint-star dark:text-faint-star bg-aurora-green/10 dark:bg-aurora-green/10 rounded-lg border border-aurora-green/20 dark:border-aurora-green/20 p-4">
            <CheckCircle
              size={20}
              className="text-aurora-green mt-0.5 shrink-0 dark:text-aurora-green"
            />
            <div>
              <p className="font-medium text-starlight dark:text-starlight">No active polar route advisories</p>
              <p className="mt-1">
                ICAO space weather advisories are issued only when conditions
                warrant. Most days, there are none.
              </p>
              {checkedTime && (
                <p className="flex items-center gap-1 mt-2 text-xs">
                  <Clock size={12} />
                  Last checked: {checkedTime}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Advisory list */}
        {hasAdvisories &&
          advisories!.map((advisory, idx) => {
            const summary = summaries[advisory.advisory_number];
            const isLoadingSummary = loadingSummaries.has(
              advisory.advisory_number,
            );
            const severity = getSeverityLevel(advisory);
            const isExpanded = expandedCards.has(advisory.advisory_number);
            
            return (
              <div
                key={idx}
                onClick={() => toggleCard(advisory.advisory_number)}
                className={`rounded-lg border transition-all cursor-pointer hover:opacity-90 ${severityColor(severity)} ${
                  isExpanded ? "p-4" : "p-3"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {severityIcon(severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-starlight dark:text-starlight">
                        {advisory.phenomenon || "Space Weather Advisory"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${severityColor(severity)}`}>
                          {severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-faint-star dark:text-faint-star">
                          #{advisory.advisory_number}
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

                    {/* AI Summary - Always visible */}
                    {isLoadingSummary && (
                      <Skeleton className="h-4 w-full bg-void-navy dark:bg-void-navy mb-2" />
                    )}
                    {summary && (
                      <div className="flex items-start gap-1.5 mb-2">
                        <Sparkles
                          size={12}
                          className="text-aurora-green mt-0.5 shrink-0 dark:text-aurora-green"
                        />
                        <p className="text-xs text-starlight leading-relaxed dark:text-starlight">
                          {summary}
                        </p>
                      </div>
                    )}

                    {/* Raw advisory text - Expandable */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-deep-indigo/30 dark:border-deep-indigo/30">
                        <div className="flex items-center gap-1 mb-2">
                          <Info size={12} className="text-faint-star/70 dark:text-faint-star/70" />
                          <p className="text-xs font-medium text-faint-star dark:text-faint-star">Full Advisory Text</p>
                        </div>
                        <p className="text-xs text-faint-star leading-relaxed whitespace-pre-wrap dark:text-faint-star">
                          {advisory.advisory_text}
                        </p>
                      </div>
                    )}

                    {/* Timestamps - Always visible */}
                    <div className="flex flex-wrap gap-2 text-[10px] text-faint-star/70 dark:text-faint-star/70 mt-2">
                      <span>
                        Issued:{" "}
                        {new Date(advisory.issue_time).toLocaleString("en-US")}
                      </span>
                      <span>
                        Valid:{" "}
                        {new Date(advisory.valid_time_begin).toLocaleString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}{" "}
                        –{" "}
                        {new Date(advisory.valid_time_end).toLocaleString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}
