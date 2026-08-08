"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { useSpaceWeather } from "@/providers/space-weather-provider";
import {
  getGeomagneticLatitude,
  AURORA_OVAL_BASE_LATITUDE,
  AURORA_OVAL_DEGREES_PER_KP,
} from "@/lib/aurora-utils";
import { LOCATIONS } from "@/lib/aurora-locations";
import AuroraFrequencyChart from "@/components/aurora-frequency-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LocationAutocomplete from "@/components/location-autocomplete";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar as CalendarIcon,
  Sparkles,
  BarChart3,
  TrendingUp,
} from "lucide-react";

// ── Color coding for max Kp in a day ──

function maxKpToColor(maxKp: number): string {
  if (maxKp >= 7)
    return "bg-amber-500 text-white dark:bg-amber-600 dark:text-white";
  if (maxKp >= 5)
    return "bg-violet-500 text-white dark:bg-violet-600 dark:text-white";
  if (maxKp >= 4)
    return "bg-green-500 text-white dark:bg-green-600 dark:text-white";
  return "";
}

function maxKpToBorderColor(maxKp: number): string {
  if (maxKp >= 7) return "border-amber-500/30 dark:border-amber-600/30";
  if (maxKp >= 5) return "border-violet-500/30 dark:border-violet-600/30";
  if (maxKp >= 4) return "border-green-500/30 dark:border-green-600/30";
  return "border-deep-indigo/30 dark:border-deep-indigo/30";
}

function maxKpToBackgroundColor(maxKp: number): string {
  if (maxKp >= 7) return "bg-amber-500/10 dark:bg-amber-600/20";
  if (maxKp >= 5) return "bg-violet-500/10 dark:bg-violet-600/20";
  if (maxKp >= 4) return "bg-green-500/10 dark:bg-green-600/20";
  return "bg-void-navy/30 dark:bg-void-navy/40";
}

export default function AuroraCalendar() {
  const data = useSpaceWeather();
  const forecast = data.kpForecast ?? [];

  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<
    "calendar" | "summary" | "frequency"
  >("calendar");

  // Compute visibility for each forecast point
  const visibleWindows = useMemo(() => {
    if (forecast.length === 0) return [];
    const geomagLat = getGeomagneticLatitude(
      selectedLocation.lat,
      selectedLocation.lng,
    );
    const minRequiredKp =
      (AURORA_OVAL_BASE_LATITUDE - geomagLat) / AURORA_OVAL_DEGREES_PER_KP;

    return forecast
      .filter((p) => p.kp >= minRequiredKp)
      .map((p) => ({
        time: new Date(p.time),
        kp: p.kp,
      }));
  }, [forecast, selectedLocation]);

  // Map day → max Kp for that day
  const dayMaxKp = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of visibleWindows) {
      const key = format(w.time, "yyyy-MM-dd");
      const existing = map.get(key) ?? 0;
      map.set(key, Math.max(existing, w.kp));
    }
    return map;
  }, [visibleWindows]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDays = dayMaxKp.size;
    const highKpDays = Array.from(dayMaxKp.values()).filter(
      (kp) => kp >= 7,
    ).length;
    const goodKpDays = Array.from(dayMaxKp.values()).filter(
      (kp) => kp >= 5 && kp < 7,
    ).length;
    const moderateKpDays = Array.from(dayMaxKp.values()).filter(
      (kp) => kp >= 4 && kp < 5,
    ).length;
    const bestDay =
      totalDays > 0
        ? Array.from(dayMaxKp.entries()).reduce(
            (best, [key, kp]) => (kp > best[1] ? [key, kp] : best),
            ["", 0],
          )
        : null;

    return {
      totalDays,
      highKpDays,
      goodKpDays,
      moderateKpDays,
      bestDay,
      avgKp:
        totalDays > 0
          ? Array.from(dayMaxKp.values()).reduce((sum, kp) => sum + kp, 0) /
            totalDays
          : 0,
    };
  }, [dayMaxKp]);

  // Windows for the selected date
  const selectedWindows = useMemo(() => {
    if (!selectedDate) return [];
    return visibleWindows.filter((w) => isSameDay(w.time, selectedDate));
  }, [visibleWindows, selectedDate]);

  // Calendar grid days
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-starlight flex items-center gap-2 dark:text-starlight">
            <CalendarIcon
              size={20}
              className="text-aurora-green dark:text-aurora-green"
            />
            When and where to see the aurora.
          </h3>

          {/* View toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={
                viewMode === "calendar"
                  ? "bg-aurora-green text-white hover:bg-aurora-green/90 dark:bg-aurora-green dark:text-white"
                  : "border-deep-indigo text-starlight hover:bg-deep-indigo/50 dark:border-deep-indigo dark:text-starlight dark:hover:bg-deep-indigo/50"
              }
            >
              <CalendarIcon size={14} className="mr-1" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "summary" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("summary")}
              className={
                viewMode === "summary"
                  ? "bg-aurora-green text-white hover:bg-aurora-green/90 dark:bg-aurora-green dark:text-white"
                  : "border-deep-indigo text-starlight hover:bg-deep-indigo/50 dark:border-deep-indigo dark:text-starlight dark:hover:bg-deep-indigo/50"
              }
            >
              <BarChart3 size={14} className="mr-1" />
              Summary
            </Button>
            <Button
              variant={viewMode === "frequency" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("frequency")}
              className={
                viewMode === "frequency"
                  ? "bg-aurora-green text-white hover:bg-aurora-green/90 dark:bg-aurora-green dark:text-white"
                  : "border-deep-indigo text-starlight hover:bg-deep-indigo/50 dark:border-deep-indigo dark:text-starlight dark:hover:bg-deep-indigo/50"
              }
            >
              <BarChart3 size={14} className="mr-1" />
              Frequency
            </Button>
          </div>
        </div>
      </div>

      {/* Location selector */}
      <div className="space-y-1.5">
        <Label className="text-sm text-starlight font-medium dark:text-starlight">
          <MapPin size={12} className="inline mr-1" />
          Location
        </Label>
        <LocationAutocomplete
          locations={LOCATIONS}
          selected={selectedLocation}
          onChange={setSelectedLocation}
        />
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="text-faint-star hover:text-starlight dark:text-faint-star dark:hover:text-starlight"
            >
              <ChevronLeft size={20} />
            </Button>
            <h4 className="font-display text-base text-starlight dark:text-starlight">
              {format(currentMonth, "MMMM yyyy")}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="text-faint-star hover:text-starlight dark:text-faint-star dark:hover:text-starlight"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-xs font-medium text-faint-star py-2 dark:text-faint-star"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const maxKp = dayMaxKp.get(key);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSel = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  disabled={!isCurrentMonth}
                  className={`relative flex flex-col items-center justify-center h-16 rounded-lg text-sm transition-all ${
                    !isCurrentMonth
                      ? "text-faint-star/30 cursor-default bg-void-navy/20 dark:bg-void-navy/20"
                      : maxKp
                        ? `${maxKpToBackgroundColor(maxKp)} ${maxKpToBorderColor(maxKp)} cursor-pointer hover:scale-105 hover:shadow-lg`
                        : "text-faint-star hover:bg-void-navy/50 cursor-pointer dark:text-faint-star dark:hover:bg-void-navy/50"
                  } ${
                    isSel
                      ? "ring-2 ring-aurora-green ring-offset-2 ring-offset-deep-indigo dark:ring-aurora-green dark:ring-offset-deep-indigo"
                      : ""
                  } ${today && !isSel ? "border-2 border-aurora-green/50 dark:border-aurora-green/50" : ""}`}
                >
                  <span className="font-mono text-sm">{format(day, "d")}</span>
                  {maxKp && (
                    <span className="text-[10px] leading-tight mt-0.5 font-semibold">
                      Kp {maxKp.toFixed(1)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Enhanced Legend */}
          <div className="flex items-center gap-4 text-xs text-faint-star dark:text-faint-star">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500 inline-block dark:bg-green-600" />{" "}
              Kp 4+
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-violet-500 inline-block dark:bg-violet-600" />{" "}
              Kp 5+
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block dark:bg-amber-600" />{" "}
              Kp 7+
            </span>
          </div>

          {/* Selected date detail */}
          {selectedDate && (
            <div className="rounded-xl border border-deep-indigo bg-void-navy/50 p-4 space-y-3 dark:bg-void-navy/50 dark:border-deep-indigo">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={16}
                  className="text-aurora-green dark:text-aurora-green"
                />
                <h4 className="text-sm font-semibold text-starlight dark:text-starlight">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h4>
              </div>

              {selectedWindows.length === 0 ? (
                <p className="text-sm text-faint-star dark:text-faint-star">
                  No aurora expected at {selectedLocation.name} on this date.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedWindows.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-void-navy/50 px-3 py-2 dark:bg-void-navy/50"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`border-none px-2 py-0.5 text-xs font-mono font-bold ${maxKpToColor(w.kp)}`}
                        >
                          Kp {w.kp.toFixed(1)}
                        </Badge>
                        <span className="text-sm text-starlight dark:text-starlight">
                          {format(w.time, "HH:mm")} –{" "}
                          {format(
                            new Date(w.time.getTime() + 3 * 60 * 60 * 1000),
                            "HH:mm",
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-faint-star dark:text-faint-star">
                        {w.kp >= 7
                          ? "Bright aurora likely"
                          : w.kp >= 5
                            ? "Good chance"
                            : "Possible"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Summary View */}
      {viewMode === "summary" && (
        <div className="space-y-4">
          {/* Summary Dashboard */}
          <div className="rounded-xl border border-deep-indigo bg-void-navy/30 p-4 dark:bg-void-navy/40 dark:border-deep-indigo">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3
                size={18}
                className="text-starlight dark:text-starlight"
              />
              <h4 className="text-base font-semibold text-starlight dark:text-starlight">
                Month Overview
              </h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-starlight dark:text-starlight">
                  {summaryStats.totalDays}
                </div>
                <div className="text-xs text-faint-star dark:text-faint-star">
                  Aurora Days
                </div>
              </div>
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {summaryStats.highKpDays}
                </div>
                <div className="text-xs text-faint-star dark:text-faint-star">
                  High Kp (7+)
                </div>
              </div>
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-violet-500">
                  {summaryStats.goodKpDays}
                </div>
                <div className="text-xs text-faint-star dark:text-faint-star">
                  Good Kp (5-6)
                </div>
              </div>
              <div className="bg-void-navy/50 dark:bg-void-navy/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-500 dark:text-green-600">
                  {summaryStats.avgKp.toFixed(1)}
                </div>
                <div className="text-xs text-faint-star dark:text-faint-star">
                  Avg Kp
                </div>
              </div>
            </div>

            {summaryStats.bestDay && (
              <div className="mt-4 p-3 bg-aurora-green/10 rounded-lg border border-aurora-green/20 dark:bg-aurora-green/10 dark:border-aurora-green/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp
                    size={16}
                    className="text-aurora-green dark:text-aurora-green"
                  />
                  <span className="text-sm font-medium text-starlight dark:text-starlight">
                    Best Day
                  </span>
                </div>
                <p className="text-sm text-starlight dark:text-starlight">
                  {format(new Date(summaryStats.bestDay[0]), "MMMM d, yyyy")}{" "}
                  with Kp {summaryStats.bestDay[1].toFixed(1)}
                </p>
              </div>
            )}
          </div>

          {/* Detailed Day List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-starlight dark:text-starlight">
              Day-by-Day Breakdown
            </h4>
            <div className="space-y-2">
              {Array.from(dayMaxKp.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([dateStr, kp]) => {
                  const date = new Date(dateStr);
                  const windows = visibleWindows.filter((w) =>
                    isSameDay(w.time, date),
                  );
                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(date)}
                      className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-lg ${maxKpToBorderColor(kp)} ${maxKpToBackgroundColor(kp)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-starlight dark:text-starlight">
                          {format(date, "EEE, MMM d")}
                        </span>
                        <Badge
                          className={`border-none px-2 py-0.5 text-xs font-mono font-bold ${maxKpToColor(kp)}`}
                        >
                          Kp {kp.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="text-xs text-faint-star dark:text-faint-star">
                        {windows.length > 0
                          ? `${windows.length} time window${windows.length > 1 ? "s" : ""}: ${windows.map((w) => format(w.time, "HH:mm")).join(", ")}`
                          : "No visible windows"}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Frequency View */}
      {viewMode === "frequency" && (
        <AuroraFrequencyChart
          forecast={data.kpForecast}
          locations={LOCATIONS}
        />
      )}
    </div>
  );
}
