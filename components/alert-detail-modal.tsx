"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import type { Alert } from "@/types/spacewx";
import AlertDetailModalSingle from "@/components/alert-detail-modal-single";

interface AlertDetailModalProps {
  alerts: Alert[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BATCH_SIZE = 20;

export default function AlertDetailModal({
  alerts,
  open,
  onOpenChange,
}: AlertDetailModalProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setVisibleCount(BATCH_SIZE);
    }
  }, [open]);

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, alerts.length));
      setIsLoadingMore(false);
    }, 200);
  };

  const hasMore = visibleCount < alerts.length;
  const visibleAlerts = alerts.slice(0, visibleCount);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-deep-indigo border-void-navy text-starlight max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-starlight font-display text-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-solar-amber" />
              Active Space Weather Alerts ({alerts.length})
            </DialogTitle>
            <DialogDescription className="text-faint-star">
              Official notices from NOAA. Scroll down to see all alerts —
              grouped by recency.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1 space-y-3 mt-4 custom-scrollbar">
            {visibleAlerts.map((alert, idx) => {
              const needsTruncation = alert.message.length > 300;
              return (
                <div
                  key={`${alert.id}-${idx}`}
                  className="rounded-lg border border-void-navy bg-void-navy/50 p-4 transition-colors hover:bg-void-navy/70 cursor-pointer"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 shrink-0 text-solar-amber"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-starlight break-words">
                        {needsTruncation
                          ? alert.message.slice(0, 300) + "…"
                          : alert.message}
                      </p>
                      <p className="mt-2 text-xs text-faint-star">
                        Issued:{" "}
                        {new Date(alert.issueTime).toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

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
                        alerts.length - visibleCount,
                      )}{" "}
                      more ({alerts.length - visibleCount} remaining)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Single‑alert modal triggered from within the list modal */}
      <AlertDetailModalSingle
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={(o) => {
          if (!o) setSelectedAlert(null);
        }}
      />
    </>
  );
}
