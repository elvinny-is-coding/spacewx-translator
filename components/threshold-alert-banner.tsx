"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BellRing } from "lucide-react";

interface ThresholdAlertBannerProps {
  breachedAlerts: {
    threshold: {
      label?: string;
      parameter: string;
      operator: string;
      value: number;
    };
    currentValue: number;
    message: string;
  }[];
}

export default function ThresholdAlertBanner({
  breachedAlerts,
}: ThresholdAlertBannerProps) {
  if (!breachedAlerts || breachedAlerts.length === 0) return null;

  return (
    <Alert className="border-solar-amber/50 bg-solar-amber/10">
      <BellRing className="h-4 w-4 text-solar-amber" />
      <AlertTitle className="text-sm font-medium text-solar-amber">
        Threshold Alert{breachedAlerts.length > 1 ? "s" : ""}
      </AlertTitle>
      <AlertDescription className="mt-1 space-y-1">
        {breachedAlerts.map((alert, i) => (
          <div key={i} className="text-xs text-starlight">
            <span className="font-semibold">
              {alert.threshold.label ||
                `${alert.threshold.parameter} ${alert.threshold.operator} ${alert.threshold.value}`}
              :
            </span>{" "}
            currently{" "}
            <span className="text-solar-amber">{alert.currentValue}</span>
          </div>
        ))}
      </AlertDescription>
    </Alert>
  );
}
