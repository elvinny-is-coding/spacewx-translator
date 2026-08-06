// components/cme-countdown.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudLightning, CalendarPlus, Loader2 } from "lucide-react";
import { generateCmeCalendar } from "@/lib/ics-utils";

interface CmeCountdownProps {
  data: SpaceWeatherData;
}

/** Convert km/s to estimated transit time in milliseconds (1 AU / speed) */
function estimateArrivalMs(startTime: string, speedKmS: number): number {
  const startMs = new Date(startTime).getTime();
  const transitSeconds = 1.496e8 / speedKmS; // 1 AU in km / speed km/s
  return startMs + transitSeconds * 1000;
}

/** Format milliseconds difference into a countdown string */
function formatCountdown(ms: number): string {
  if (ms <= 0) return "Arriving now";
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds % 60}s`;
}

/** Format a timestamp as a human-readable date/time */
function formatArrival(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function CmeCountdown({ data }: CmeCountdownProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Find the most significant notable CME
  const notableCmes = data.cmes.filter((c) => {
    if (!c.speed) return false;
    return c.speed > 800 || (c.note && c.note.toLowerCase().includes("earth"));
  });

  if (notableCmes.length === 0) return null; // nothing to show

  // Pick the fastest one
  const cme = notableCmes.reduce((fastest, c) =>
    (c.speed ?? 0) > (fastest.speed ?? 0) ? c : fastest,
  );

  const speed = cme.speed!;
  const halfAngle = cme.halfAngle;
  const isEarthDirected = !!(
    cme.note && cme.note.toLowerCase().includes("earth")
  );
  const arrivalMs = estimateArrivalMs(cme.startTime, speed);
  const arrivalIso = new Date(arrivalMs).toISOString();

  // Live countdown tick
  useEffect(() => {
    if (arrivalMs <= Date.now()) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [arrivalMs]);

  // Fetch AI narrative
  useEffect(() => {
    let cancelled = false;
    async function fetchNarrative() {
      setIsLoadingNarrative(true);
      setNarrativeError(null);
      try {
        const res = await fetch("/api/cme-impact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cmeSpeed: speed,
            halfAngle,
            isEarthDirected,
            estArrival: formatArrival(arrivalMs),
            data,
          }),
        });
        if (!res.ok) throw new Error("Failed to fetch impact narrative");
        const json = await res.json();
        if (!cancelled) {
          setNarrative(json.narrative);
          setIsLoadingNarrative(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setNarrativeError(err.message ?? "Unknown error");
          setIsLoadingNarrative(false);
        }
      }
    }
    fetchNarrative();
    return () => {
      cancelled = true;
    };
  }, [speed, halfAngle, isEarthDirected, arrivalMs, data]);

  const handleCalendarDownload = useCallback(() => {
    if (!narrative) return;
    const ics = generateCmeCalendar(speed, arrivalIso, narrative);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cme-impact-${cme.startTime.slice(0, 10)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [narrative, speed, arrivalIso, cme.startTime]);

  const countdown = formatCountdown(arrivalMs - now);
  const hasArrived = arrivalMs <= now;

  return (
    <Card className="border-solar-amber/40 bg-solar-amber/5 shadow-lg">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-solar-amber/20 flex items-center justify-center">
            <CloudLightning size={20} className="text-solar-amber" />
          </div>
          <div>
            <h3 className="font-display text-base text-starlight">
              CME Earth‑Impact Watch
            </h3>
            <p className="text-xs text-faint-star">
              {speed} km/s •{" "}
              {isEarthDirected ? "Earth‑directed" : "Glancing impact possible"}
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center py-3 rounded-lg bg-void-navy/50 border border-void-navy">
          <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
            Estimated arrival
          </p>
          <p className="text-2xl font-mono font-bold text-solar-amber">
            {hasArrived ? "Arriving now" : countdown}
          </p>
          <p className="text-xs text-faint-star mt-1">
            {formatArrival(arrivalMs)}
          </p>
        </div>

        {/* AI narrative */}
        {isLoadingNarrative && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-void-navy" />
            <Skeleton className="h-4 w-3/4 bg-void-navy" />
          </div>
        )}
        {narrativeError && (
          <p className="text-xs text-solar-amber">{narrativeError}</p>
        )}
        {!isLoadingNarrative && narrative && (
          <p className="text-xs text-faint-star leading-relaxed">{narrative}</p>
        )}

        {/* Calendar button */}
        {narrative && (
          <Button
            onClick={handleCalendarDownload}
            size="sm"
            className="w-full bg-solar-amber text-void-navy hover:bg-solar-amber/90"
          >
            <CalendarPlus size={14} className="mr-1" />
            Add to Calendar (.ics)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
