"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Zap,
  CloudLightning,
  AlertTriangle,
  Activity,
  TrendingUp,
} from "lucide-react";
import type { TimelineEvent } from "@/types/timeline";

interface EventTimelineModalSingleProps {
  event: TimelineEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_ICONS: Record<TimelineEvent["type"], React.ReactNode> = {
  flare: <Zap size={18} className="text-solar-amber" />,
  cme: <CloudLightning size={18} className="text-aurora-violet" />,
  geomagnetic_storm: <AlertTriangle size={18} className="text-solar-amber" />,
  radiation_storm: <AlertTriangle size={18} className="text-solar-amber" />,
  alert: <Activity size={18} className="text-aurora-green" />,
  kp_spike: <TrendingUp size={18} className="text-aurora-green" />,
};

const EVENT_LABELS: Record<TimelineEvent["type"], string> = {
  flare: "Solar Flare",
  cme: "CME",
  geomagnetic_storm: "Geomagnetic Storm",
  radiation_storm: "Radiation Storm",
  alert: "Alert",
  kp_spike: "Kp Spike",
};

export default function EventTimelineModalSingle({
  event,
  open,
  onOpenChange,
}: EventTimelineModalSingleProps) {
  if (!event) return null;

  // For alert-type events, use the full alert message from raw data
  const isAlert =
    event.type === "alert" ||
    event.type === "radiation_storm" ||
    event.type === "geomagnetic_storm";
  const rawAlert =
    isAlert && event.raw && typeof event.raw === "object"
      ? (event.raw as any)
      : null;
  const fullText = rawAlert?.message || event.description || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-deep-indigo border-void-navy text-starlight sm:max-w-[90vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-starlight font-display text-lg flex items-center gap-2">
            {EVENT_ICONS[event.type]}
            {EVENT_LABELS[event.type]} Details
          </DialogTitle>
          <DialogDescription className="text-faint-star">
            Full information about this space weather event.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 mt-4 space-y-3">
          <div className="rounded-lg border border-void-navy bg-void-navy/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `var(--color-${event.color})`,
                  color: "#0B1120",
                }}
              >
                {EVENT_LABELS[event.type]}
              </span>
              <span className="text-xs text-faint-star">
                {new Date(event.time).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* If it's a NOAA alert, show the full message */}
            {rawAlert ? (
              <p className="text-sm text-starlight leading-relaxed whitespace-pre-wrap break-words mb-3">
                {fullText}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-starlight mb-2">
                  {event.label}
                </p>
                {event.description && (
                  <p className="text-sm text-faint-star leading-relaxed whitespace-pre-wrap break-words">
                    {event.description}
                  </p>
                )}
              </>
            )}

            {/* Issue time for alerts */}
            {rawAlert?.issueTime && (
              <p className="mt-2 text-xs text-faint-star">
                Issued: {new Date(rawAlert.issueTime).toLocaleString("en-US")}
              </p>
            )}

            <p className="mt-3 text-xs text-faint-star">
              Source:{" "}
              {event.source === "donki" ? "NASA DONKI" : "Supabase (NOAA)"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
