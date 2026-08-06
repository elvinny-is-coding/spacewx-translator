"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap,
  CloudLightning,
  AlertTriangle,
  Activity,
  TrendingUp,
  ChevronDown,
  Loader2,
  FileText,
} from "lucide-react";
import type { TimelineEvent } from "@/types/timeline";
import type { StormReport } from "@/types/postmortem";
import EventTimelineModalSingle from "@/components/event-timeline-modal-single";
import PostmortemReport from "@/components/postmortem-report";

interface EventTimelineModalProps {
  events: TimelineEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BATCH_SIZE = 20;

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

export default function EventTimelineModal({
  events,
  open,
  onOpenChange,
}: EventTimelineModalProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("events");
  const [reports, setReports] = useState<StormReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setVisibleCount(BATCH_SIZE);
    }
  }, [open]);

  // Fetch storm reports when the Reports tab is active
  useEffect(() => {
    if (!open || activeTab !== "reports" || reports.length > 0) return;

    let cancelled = false;
    async function fetchReports() {
      setIsLoadingReports(true);
      try {
        const res = await fetch("/api/postmortems");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const json = await res.json();
        if (!cancelled) {
          setReports(json.reports ?? []);
          setIsLoadingReports(false);
        }
      } catch {
        if (!cancelled) setIsLoadingReports(false);
      }
    }
    fetchReports();
    return () => {
      cancelled = true;
    };
  }, [open, activeTab, reports.length]);

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, events.length));
      setIsLoadingMore(false);
    }, 200);
  };

  const hasMore = visibleCount < events.length;
  const visibleEvents = events.slice(0, visibleCount);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-deep-indigo border-void-navy text-starlight max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-starlight font-display text-lg flex items-center gap-2">
              <Activity size={18} className="text-aurora-green" />
              Space Weather Events ({events.length})
            </DialogTitle>
            <DialogDescription className="text-faint-star">
              A detailed timeline of flares, CMEs, storms, and Kp spikes. Scroll
              to load more events. Click any event for full details.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid grid-cols-2 bg-void-navy mb-4">
              <TabsTrigger
                value="events"
                className="data-[state=active]:bg-aurora-green data-[state=active]:text-void-navy text-faint-star text-sm"
              >
                Events
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-aurora-green data-[state=active]:text-void-navy text-faint-star text-sm"
              >
                Storm Reports
              </TabsTrigger>
            </TabsList>

            {/* Events tab */}
            <TabsContent
              value="events"
              className="flex-1 overflow-y-auto pr-1 space-y-3 mt-0 custom-scrollbar"
            >
              {visibleEvents.map((event, idx) => (
                <div
                  key={`${event.id}-${idx}`}
                  className="rounded-lg border border-void-navy bg-void-navy/50 p-4 transition-colors hover:bg-void-navy/70 cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {EVENT_ICONS[event.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: `var(--color-${event.color})` }}
                        >
                          {EVENT_LABELS[event.type]}
                        </span>
                        <span className="text-xs text-faint-star">
                          {new Date(event.time).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-starlight">
                        {event.label}
                      </p>
                      {event.description && (
                        <p className="text-xs text-faint-star mt-1 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center py-3" ref={listEndRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} className="mr-2" />
                        Load{" "}
                        {Math.min(
                          BATCH_SIZE,
                          events.length - visibleCount,
                        )}{" "}
                        more ({events.length - visibleCount} remaining)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Storm Reports tab */}
            <TabsContent
              value="reports"
              className="flex-1 overflow-y-auto pr-1 space-y-3 mt-0 custom-scrollbar"
            >
              {isLoadingReports && (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full bg-void-navy" />
                  <Skeleton className="h-24 w-full bg-void-navy" />
                </div>
              )}

              {!isLoadingReports && reports.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <FileText size={32} className="text-faint-star/30" />
                  <p className="text-xs text-faint-star">
                    No storm reports yet. Reports are automatically generated
                    when a geomagnetic storm ends.
                  </p>
                </div>
              )}

              {reports.map((report) => (
                <PostmortemReport key={report.id} report={report} />
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Single‑event detail modal */}
      <EventTimelineModalSingle
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(o) => {
          if (!o) setSelectedEvent(null);
        }}
      />
    </>
  );
}
