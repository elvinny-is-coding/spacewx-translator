"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import type { Alert } from "@/types/spacewx";
import AlertDetailModal from "@/components/alert-detail-modal";

interface ActiveAlertsProps {
  alerts: Alert[];
}

export default function ActiveAlerts({ alerts }: ActiveAlertsProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (alerts.length === 0) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="flex items-center gap-3 p-6">
          <CheckCircle size={20} className="text-aurora-green" />
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
            Official notices from NOAA when space weather events — like solar
            flares, radiation storms, or geomagnetic disturbances — could affect
            satellites, power grids, or radio communications.
          </p>
          <ul className="space-y-4">
            {alerts.slice(0, 5).map((alert, idx) => (
              <li
                key={`${alert.id}-${idx}`}
                className="rounded-lg border border-void-navy bg-void-navy/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 shrink-0 text-solar-amber"
                    />
                    <p className="text-sm leading-relaxed text-starlight">
                      {alert.message.length > 200
                        ? alert.message.slice(0, 200) + "…"
                        : alert.message}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-faint-star">
                  Issued: {new Date(alert.issueTime).toLocaleString("en-US")}
                </p>
              </li>
            ))}
          </ul>
          {alerts.length > 5 && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight"
              >
                View all {alerts.length} alerts
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDetailModal
        alerts={alerts}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
