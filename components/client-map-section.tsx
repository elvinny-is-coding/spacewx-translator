"use client";

import { useState, useCallback } from "react";
import AuroraMapWrapper from "@/components/aurora-map-wrapper";
import CalendarExport from "@/components/calendar-export";
import type { ForecastPoint } from "@/types/spacewx";

interface ClientMapSectionProps {
  kpForecast: ForecastPoint[] | null;
}

export default function ClientMapSection({
  kpForecast,
}: ClientMapSectionProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    label?: string;
  } | null>(null);

  const handleLocationChange = useCallback(
    (lat: number, lng: number, label?: string) => {
      setSelectedLocation({ lat, lng, label });
    },
    [],
  );

  return (
    <div className="space-y-4">
      <AuroraMapWrapper onLocationChange={handleLocationChange} />
      <CalendarExport
        selectedLocation={selectedLocation}
        kpForecast={kpForecast}
      />
    </div>
  );
}
