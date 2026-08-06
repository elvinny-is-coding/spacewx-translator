"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap,
  CloudLightning,
  AlertTriangle,
  Activity,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import type { TimelineEvent } from "@/types/timeline";
import EventTimelineModal from "@/components/event-timeline-modal";
import EventTimelineModalSingle from "@/components/event-timeline-modal-single";

type DateRange = "24h" | "7d" | "30d" | "custom";

function computeRange(
  range: DateRange,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const now = new Date();
  switch (range) {
    case "24h":
      return {
        from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
      };
    case "7d":
      return {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
      };
    case "30d":
      return {
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
      };
    case "custom":
      if (!customFrom || !customTo)
        return { from: now.toISOString(), to: now.toISOString() };
      const fromDate = new Date(customFrom + "T00:00:00Z");
      const toDate = new Date(customTo + "T23:59:59.999Z");
      return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }
}

const EVENT_ICONS: Record<TimelineEvent["type"], React.ReactNode> = {
  flare: <Zap size={16} className="text-solar-amber" />,
  cme: <CloudLightning size={16} className="text-aurora-violet" />,
  geomagnetic_storm: <AlertTriangle size={16} className="text-solar-amber" />,
  radiation_storm: <AlertTriangle size={16} className="text-solar-amber" />,
  alert: <Activity size={16} className="text-aurora-green" />,
  kp_spike: <TrendingUp size={16} className="text-aurora-green" />,
};

const EVENT_LABELS: Record<TimelineEvent["type"], string> = {
  flare: "Solar Flare",
  cme: "CME",
  geomagnetic_storm: "Geomagnetic Storm",
  radiation_storm: "Radiation Storm",
  alert: "Alert",
  kp_spike: "Kp Spike",
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  if (abs < 60 * 60 * 1000) return `${Math.floor(abs / 60000)}m ago`;
  if (abs < 24 * 60 * 60 * 1000) return `${Math.floor(abs / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventTimeline() {
  const [range, setRange] = useState<DateRange>("24h");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { from, to } = computeRange(range, customFrom, customTo);
      const res = await fetch(
        `/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      if (!res.ok)
        throw new Error(`Failed to fetch events (HTTP ${res.status})`);
      const json = await res.json();
      setEvents(json.events ?? []);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
      setIsLoading(false);
    }
  }, [range, customFrom, customTo]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <>
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-display text-lg text-starlight">
              EVENT TIMELINE
            </h3>
            <p className="text-sm text-faint-star">
              A chronological view of solar flares, CMEs, geomagnetic storms,
              radiation storms, and Kp spikes — across the time range you
              choose.
            </p>
          </div>

          {/* Range selector */}
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Date range selector"
          >
            {(["24h", "7d", "30d", "custom"] as DateRange[]).map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(r)}
                className={
                  range === r
                    ? "bg-aurora-green text-void-navy hover:bg-aurora-green/90"
                    : "border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight"
                }
                aria-pressed={range === r}
              >
                {r === "24h"
                  ? "24 Hours"
                  : r === "7d"
                    ? "7 Days"
                    : r === "30d"
                      ? "30 Days"
                      : "Custom"}
              </Button>
            ))}
          </div>

          {/* Custom date inputs */}
          {range === "custom" && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label
                  htmlFor="event-from-date"
                  className="text-xs text-faint-star whitespace-nowrap"
                >
                  From
                </Label>
                <Input
                  id="event-from-date"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green w-full sm:w-40"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label
                  htmlFor="event-to-date"
                  className="text-xs text-faint-star whitespace-nowrap"
                >
                  To
                </Label>
                <Input
                  id="event-to-date"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green w-full sm:w-40"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full bg-void-navy" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3 bg-void-navy" />
                    <Skeleton className="h-4 w-2/3 bg-void-navy" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="text-center text-sm text-solar-amber py-8">
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={fetchEvents}
                className="ml-2 text-aurora-green"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && events.length === 0 && (
            <div className="text-center text-sm text-faint-star py-8">
              No events found in this time range.
            </div>
          )}

          {/* Timeline preview */}
          {!isLoading && !error && events.length > 0 && (
            <>
              <div className="relative pl-6 border-l-2 border-deep-indigo space-y-6">
                {events.slice(0, 5).map((event, idx) => {
                  const needsTruncation =
                    (event.description?.length ?? 0) > 150;

                  return (
                    <div key={`${event.id}-${idx}`} className="relative">
                      <div
                        className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full border-2 border-deep-indigo"
                        style={{
                          backgroundColor: `var(--color-${event.color})`,
                        }}
                      />
                      <p className="text-xs text-faint-star mb-1">
                        {formatRelativeTime(event.time)}
                      </p>
                      <Card
                        className="border-none bg-void-navy/60 hover:bg-void-navy transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {EVENT_ICONS[event.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{
                                  color: `var(--color-${event.color})`,
                                }}
                              >
                                {EVENT_LABELS[event.type]}
                              </span>
                              <span className="text-xs text-faint-star">
                                {new Date(event.time).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-starlight">
                              {event.label}
                            </p>
                            {event.description && (
                              <p className="text-xs text-faint-star mt-1 leading-relaxed">
                                {needsTruncation
                                  ? event.description.slice(0, 150) + "…"
                                  : event.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {/* View all button */}
              {events.length > 5 && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    className="border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight"
                  >
                    View all {events.length} events
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Single-event modal */}
      <EventTimelineModalSingle
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />

      {/* All-events modal */}
      <EventTimelineModal
        events={events}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
