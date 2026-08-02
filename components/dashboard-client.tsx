"use client";

import { useState } from "react";
import AudienceToggle from "@/components/audience-toggle";
import AiSummaryCard from "@/components/ai-summary-card";
import TrendChart from "@/components/trend-chart";
import HistoricalChart from "@/components/historical-chart";
import EventTimeline from "@/components/event-timeline";
import ActiveAlerts from "@/components/active-alerts";
import SourceWarningBanner from "@/components/source-warning-banner";
import ThresholdAlertBanner from "@/components/threshold-alert-banner";
import ThresholdManager from "@/components/threshold-manager";
import { useThresholds } from "@/hooks/use-thresholds";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";

interface DashboardClientProps {
  data: SpaceWeatherData;
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const [audience, setAudience] = useState<Audience>("general");
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

      <AudienceToggle selected={audience} onChange={setAudience} />

      <AiSummaryCard data={data} audience={audience} />

      <TrendChart forecast={data.kpForecast} />

      <HistoricalChart />

      <EventTimeline />

      <ActiveAlerts alerts={data.alerts} />
    </div>
  );
}
