"use client";

import TrendChart from "@/components/trend-chart";
import HistoricalChart from "@/components/historical-chart";
import EventTimeline from "@/components/event-timeline";
import ActiveAlerts from "@/components/active-alerts";
import SourceWarningBanner from "@/components/source-warning-banner";
import ThresholdAlertBanner from "@/components/threshold-alert-banner";
import ThresholdManager from "@/components/threshold-manager";
import { useThresholds } from "@/hooks/use-thresholds";
import type { SpaceWeatherData } from "@/types/spacewx";

interface DashboardClientProps {
  data: SpaceWeatherData;
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const {
    thresholds,
    breachedAlerts,
    isLoading,
    addThreshold,
    updateThreshold,
    deleteThreshold,
  } = useThresholds(data);

  return (
    <div className="space-y-6">
      <SourceWarningBanner warnings={data.warnings} />

      <ThresholdAlertBanner breachedAlerts={breachedAlerts} />

      <ThresholdManager
        thresholds={thresholds}
        isLoading={isLoading}
        onAdd={addThreshold}
        onEdit={updateThreshold}
        onDelete={deleteThreshold}
      />

      <TrendChart forecast={data.kpForecast} />

      <HistoricalChart />

      <EventTimeline />

      <ActiveAlerts alerts={data.alerts} />
    </div>
  );
}
