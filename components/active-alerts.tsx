"use client";

import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import type { Alert } from "@/types/spacewx";
import AlertDetailModal from "@/components/alert-detail-modal";
import AlertDetailModalSingle from "@/components/alert-detail-modal-single";

interface ActiveAlertsProps {
  alerts: Alert[];
}

function ActiveAlerts({ alerts }: ActiveAlertsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  if (alerts.length === 0) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="flex items-center gap-3 p-6">
          <CheckCircle
            size={20}
            className="text-aurora-green"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-starlight">
              No active alerts
            </p>
            <p className="text-xs text-faint-star">
              Everything is quiet right now — no watches, warnings, or alerts
              have been issued by NOAA.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-6">
          <h3 className="mb-1 font-display text-lg text-starlight">
            ACTIVE ALERTS
          </h3>
          <p className="mb-4 text-sm text-faint-star">
            NOAA alerts filtered by Kairo — click any alert for the full
            message, or open the list to browse all.
          </p>
          <ul className="space-y-4" role="list" aria-label="Active NOAA alerts">
            {alerts.slice(0, 5).map((alert, idx) => {
              const needsTruncation = alert.message.length > 200;

              return (
                <li
                  key={`${alert.id}-${idx}`}
                  className="rounded-lg border border-void-navy bg-void-navy/50 p-4 cursor-pointer hover:bg-void-navy transition-colors min-h-[72px] touch-manipulation"
                  onClick={() => setSelectedAlert(alert)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedAlert(alert);
                    }
                  }}
                  aria-label={`Alert: ${alert.message.slice(0, 100)}...`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={16}
                        className="mt-0.5 shrink-0 text-solar-amber"
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-starlight">
                          {needsTruncation
                            ? alert.message.slice(0, 200) + "…"
                            : alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-faint-star">
                    Issued: {new Date(alert.issueTime).toLocaleString("en-US")}
                  </p>
                </li>
              );
            })}
          </ul>
          {alerts.length > 5 && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight min-h-[44px]"
                aria-label={`View all ${alerts.length} alerts`}
              >
                View all {alerts.length} alerts
                <ChevronRight size={14} className="ml-1" aria-hidden="true" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDetailModalSingle
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={(open) => {
          if (!open) setSelectedAlert(null);
        }}
      />

      <AlertDetailModal
        alerts={alerts}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

export default memo(ActiveAlerts);
