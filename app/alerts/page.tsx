// app/alerts/page.tsx
"use client";

import { useSpaceWeather } from "@/providers/space-weather-provider";
import { useThresholds } from "@/hooks/use-thresholds";
import SourceWarningBanner from "@/components/source-warning-banner";
import ThresholdAlertBanner from "@/components/threshold-alert-banner";
import ThresholdManager from "@/components/threshold-manager";

export default function AlertsPage() {
  const data = useSpaceWeather();
  const {
    thresholds,
    breachedAlerts,
    isLoading,
    addThreshold,
    updateThreshold,
    deleteThreshold,
  } = useThresholds(data);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-starlight">
          Custom Alert Thresholds
        </h2>
        <p className="text-sm text-faint-star">
          Set personal thresholds for Kp index, solar wind speed, and Bz. Get
          notified when current conditions cross your defined limits.
        </p>
      </div>

      <SourceWarningBanner warnings={data.warnings} />

      <ThresholdAlertBanner breachedAlerts={breachedAlerts} />

      <ThresholdManager
        thresholds={thresholds}
        isLoading={isLoading}
        onAdd={addThreshold}
        onEdit={updateThreshold}
        onDelete={deleteThreshold}
      />
    </div>
  );
}
