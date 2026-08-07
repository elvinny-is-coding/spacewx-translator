// components/polar-route-brief.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Loader2,
  XCircle,
  Info,
} from "lucide-react";
import { useSpaceWeather } from "@/providers/space-weather-provider";
import {
  ROUTE_PRESETS,
  type RoutePreset,
  type PolarRouteBrief,
} from "@/types/polar-brief";
import type { IcaoAdvisory } from "@/types/icao";

interface PolarRouteBriefProps {
  onAdvisoryChange?: (active: boolean) => void;
}

function statusColor(status: PolarRouteBrief["status"]): string {
  switch (status) {
    case "OPEN":
      return "bg-aurora-green/10 border-aurora-green/30 text-aurora-green";
    case "CONDITIONAL":
      return "bg-solar-amber/10 border-solar-amber/30 text-solar-amber";
    case "AVOID":
      return "bg-red-600/10 border-red-600/30 text-red-400";
    default:
      return "bg-faint-star/10 border-faint-star/30 text-faint-star";
  }
}

function statusIcon(status: PolarRouteBrief["status"]) {
  switch (status) {
    case "OPEN":
      return <CheckCircle size={24} className="text-aurora-green" />;
    case "CONDITIONAL":
      return <AlertTriangle size={24} className="text-solar-amber" />;
    case "AVOID":
      return <XCircle size={24} className="text-red-400" />;
    default:
      return <Info size={24} className="text-faint-star" />;
  }
}

export default function PolarRouteBrief({
  onAdvisoryChange,
}: PolarRouteBriefProps) {
  const data = useSpaceWeather();

  // ---- ICAO advisories ----
  const [advisories, setAdvisories] = useState<IcaoAdvisory[] | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isLoadingAdvisories, setIsLoadingAdvisories] = useState(true);

  // ---- Route brief ----
  const [selectedRouteId, setSelectedRouteId] = useState(ROUTE_PRESETS[0].id);
  const [brief, setBrief] = useState<PolarRouteBrief | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Expand advisories ----
  const [showAdvisories, setShowAdvisories] = useState(false);

  // Fetch ICAO advisories on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch("/api/icao-advisory");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!cancelled) {
          const active = json.advisories ?? [];
          setAdvisories(active);
          setLastChecked(json.lastChecked);
          onAdvisoryChange?.(active.length > 0);
        }
      } catch {
        // non‑critical
      } finally {
        if (!cancelled) setIsLoadingAdvisories(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [onAdvisoryChange]);

  // Fetch brief when route changes
  const fetchBrief = useCallback(
    async (routeId: string) => {
      setIsLoadingBrief(true);
      setError(null);
      try {
        const res = await fetch("/api/polar-route-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ routeId, data }),
        });
        if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
        const json = await res.json();
        setBrief(json.brief);
      } catch (err: any) {
        setError(err.message ?? "Unknown error");
      } finally {
        setIsLoadingBrief(false);
      }
    },
    [data],
  );

  useEffect(() => {
    fetchBrief(selectedRouteId);
  }, [selectedRouteId, fetchBrief]);

  const selectedRoute = ROUTE_PRESETS.find((r) => r.id === selectedRouteId)!;

  return (
    <Card className="border-none bg-deep-indigo">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Plane size={20} className="text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight">
            Polar Route Brief
          </h4>
        </div>

        {/* Route selector */}
        <div className="space-y-1.5">
          <Label
            htmlFor="route-select"
            className="text-sm text-faint-star font-medium"
          >
            Select Route
          </Label>
          <Select
            value={selectedRouteId}
            onValueChange={(val) => setSelectedRouteId(val)}
            disabled={isLoadingBrief}
          >
            <SelectTrigger
              id="route-select"
              className="bg-void-navy border-deep-indigo text-starlight text-sm h-10"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-deep-indigo border-void-navy text-starlight">
              {ROUTE_PRESETS.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-faint-star">{selectedRoute.description}</p>
        </div>

        {/* Loading brief */}
        {isLoadingBrief && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4 bg-void-navy" />
            <Skeleton className="h-4 w-1/2 bg-void-navy" />
            <Skeleton className="h-4 w-full bg-void-navy" />
          </div>
        )}

        {/* Error */}
        {!isLoadingBrief && error && (
          <div className="text-sm text-solar-amber text-center py-4">
            {error}
          </div>
        )}

        {/* Brief card */}
        {!isLoadingBrief && !error && brief && (
          <div
            className={`rounded-xl border p-5 space-y-4 ${statusColor(brief.status)}`}
          >
            {/* Top row: icon + route + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon(brief.status)}
                <div>
                  <p className="text-sm font-medium text-starlight">
                    {brief.selectedRoute.label}
                  </p>
                  <p className="text-xs text-faint-star">{brief.hazardType}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-bold border border-current">
                {brief.status}
              </span>
            </div>

            {/* Valid window */}
            {brief.validWindow && (
              <div className="flex items-center gap-2 text-xs">
                <Clock size={14} className="text-current" />
                <span>Valid: {brief.validWindow}</span>
              </div>
            )}

            {/* Alternatives */}
            {brief.alternatives.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-starlight">
                  Alternative Actions
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-faint-star">
                  {brief.alternatives.map((alt, i) => (
                    <li key={i}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI summary */}
            <p className="text-xs text-faint-star leading-relaxed">
              {brief.summary}
            </p>

            {/* Generated at */}
            <p className="text-[10px] text-faint-star/50">
              Generated{" "}
              {new Date(brief.generatedAt).toLocaleTimeString("en-US")}
            </p>
          </div>
        )}

        {/* ICAO advisories section */}
        <div className="space-y-2">
          {isLoadingAdvisories && (
            <Skeleton className="h-4 w-1/2 bg-void-navy" />
          )}

          {!isLoadingAdvisories && advisories && advisories.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvisories(!showAdvisories)}
                className="text-faint-star hover:text-starlight p-0 h-auto"
              >
                {showAdvisories ? (
                  <ChevronDown size={14} className="mr-1" />
                ) : (
                  <ChevronRight size={14} className="mr-1" />
                )}
                {advisories.length} Active ICAO Advisor
                {advisories.length > 1 ? "ies" : "y"}
              </Button>

              {showAdvisories && (
                <div className="space-y-3 pl-2">
                  {advisories.map((adv, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-solar-amber/20 bg-solar-amber/5 p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-solar-amber">
                          {adv.phenomenon || "Space Weather Advisory"}
                        </span>
                        <span className="text-xs text-faint-star">
                          #{adv.advisory_number}
                        </span>
                      </div>
                      <p className="text-xs text-faint-star leading-relaxed whitespace-pre-wrap">
                        {adv.advisory_text}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-faint-star/70 mt-1">
                        <span>
                          Issued:{" "}
                          {new Date(adv.issue_time).toLocaleString("en-US")}
                        </span>
                        <span>
                          Valid:{" "}
                          {new Date(adv.valid_time_begin).toLocaleString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" },
                          )}{" "}
                          –{" "}
                          {new Date(adv.valid_time_end).toLocaleString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!isLoadingAdvisories && advisories && advisories.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-faint-star">
              <CheckCircle size={14} className="text-aurora-green" />
              <span>
                No active ICAO advisories.{" "}
                {lastChecked && (
                  <span className="text-faint-star/70">
                    Last checked:{" "}
                    {new Date(lastChecked).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
