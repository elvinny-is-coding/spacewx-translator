// components/polar-route-status.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Clock, CheckCircle } from "lucide-react";
import type { IcaoAdvisory } from "@/types/icao";

export default function PolarRouteStatus() {
  const [advisories, setAdvisories] = useState<IcaoAdvisory[] | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  if (isLoading) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-void-navy" />
          <Skeleton className="h-4 w-1/2 bg-void-navy" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-4">
          <p className="text-xs text-solar-amber">{error}</p>
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

  return (
    <Card className="border-none bg-deep-indigo">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Plane size={18} className="text-aurora-green" />
          <h4 className="text-sm font-semibold text-starlight">
            Polar Route Advisories
          </h4>
        </div>

        {/* Empty state */}
        {!hasAdvisories && (
          <div className="flex items-start gap-2 text-xs text-faint-star">
            <CheckCircle
              size={16}
              className="text-aurora-green mt-0.5 shrink-0"
            />
            <div>
              <p>No active polar route advisories.</p>
              {checkedTime && (
                <p className="flex items-center gap-1 mt-1">
                  <Clock size={10} />
                  Last checked: {checkedTime}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Advisory list */}
        {hasAdvisories &&
          advisories!.map((advisory, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-solar-amber/30 bg-solar-amber/5 p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-solar-amber">
                  {advisory.phenomenon || "Space Weather Advisory"}
                </span>
                <span className="text-xs text-faint-star">
                  #{advisory.advisory_number}
                </span>
              </div>
              <p className="text-xs text-faint-star leading-relaxed whitespace-pre-wrap">
                {advisory.advisory_text}
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-faint-star/70">
                <span>
                  Issued:{" "}
                  {new Date(advisory.issue_time).toLocaleString("en-US")}
                </span>
                <span>
                  Valid:{" "}
                  {new Date(advisory.valid_time_begin).toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {new Date(advisory.valid_time_end).toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
