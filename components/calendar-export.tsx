"use client";

import { useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, MapPin } from "lucide-react";
import type { ForecastPoint } from "@/types/spacewx";
import { generateAuroraCalendar } from "@/lib/ics-utils";

interface CalendarExportProps {
  selectedLocation: {
    lat: number;
    lng: number;
    label?: string;
  } | null;
  kpForecast: ForecastPoint[] | null;
}

export default function CalendarExport({
  selectedLocation,
  kpForecast,
}: CalendarExportProps) {
  const icsContent = useMemo(() => {
    if (!selectedLocation || !kpForecast) return null;
    return generateAuroraCalendar(
      kpForecast,
      selectedLocation.lat,
      selectedLocation.lng,
      selectedLocation.label,
    );
  }, [selectedLocation, kpForecast]);

  const eventCount = useMemo(() => {
    if (!icsContent) return 0;
    // Count "BEGIN:VEVENT" occurrences in the ICS string
    return (icsContent.match(/BEGIN:VEVENT/g) || []).length;
  }, [icsContent]);

  const handleDownload = useCallback(() => {
    if (!icsContent) return;

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "aurora-forecast.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [icsContent]);

  // No location selected
  if (!selectedLocation) {
    return (
      <Card className="border border-void-navy bg-deep-indigo shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <MapPin size={18} className="text-faint-star" />
          <p className="text-sm text-faint-star">
            Tap on the map first to select a location, then add upcoming aurora
            events to your calendar.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Location selected but forecast unavailable
  if (!kpForecast || kpForecast.length === 0) {
    return (
      <Card className="border border-void-navy bg-deep-indigo shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <MapPin size={18} className="text-faint-star" />
          <p className="text-sm text-faint-star">
            Forecast data unavailable. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Location selected, forecast available, but no events
  if (eventCount === 0) {
    return (
      <Card className="border border-void-navy bg-deep-indigo shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <CalendarPlus size={18} className="text-faint-star" />
          <p className="text-sm text-faint-star">
            No significant aurora events expected at this location in the next 7
            days.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Events available
  return (
    <Card className="border border-void-navy bg-deep-indigo shadow-sm">
      <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <CalendarPlus size={18} className="text-aurora-green" />
          <p className="text-sm text-starlight">
            {eventCount} upcoming aurora event{eventCount > 1 ? "s" : ""} at{" "}
            <span className="font-medium">
              {selectedLocation.label || "selected location"}
            </span>
          </p>
        </div>
        <Button
          onClick={handleDownload}
          className="bg-aurora-green text-void-navy hover:bg-aurora-green/90 w-full sm:w-auto"
        >
          <CalendarPlus size={14} className="mr-1" />
          Add to Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
