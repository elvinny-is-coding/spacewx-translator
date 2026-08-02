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
import {
  Zap,
  CloudLightning,
  AlertTriangle,
  Activity,
  TrendingUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { TimelineEvent } from "@/types/timeline";

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
  const listEndRef = useRef<HTMLDivElement>(null);

  // Reset visible count when modal opens
  useEffect(() => {
    if (open) {
      setVisibleCount(BATCH_SIZE);
    }
  }, [open]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-deep-indigo border-void-navy text-starlight max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-starlight font-display text-lg flex items-center gap-2">
            <Activity size={18} className="text-aurora-green" />
            Space Weather Events ({events.length})
          </DialogTitle>
          <DialogDescription className="text-faint-star">
            A detailed timeline of flares, CMEs, storms, and Kp spikes. Scroll
            to load more events.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable event list */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3 mt-4 custom-scrollbar">
          {visibleEvents.map((event, idx) => (
            <div
              key={`${event.id}-${idx}`}
              className="rounded-lg border border-void-navy bg-void-navy/50 p-4 transition-colors hover:bg-void-navy/70"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{EVENT_ICONS[event.type]}</div>
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

          {/* Load more trigger */}
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
                    Load {Math.min(
                      BATCH_SIZE,
                      events.length - visibleCount,
                    )}{" "}
                    more ({events.length - visibleCount} remaining)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
