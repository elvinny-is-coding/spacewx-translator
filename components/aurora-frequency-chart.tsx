"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  ArrowUpDown,
  Filter,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import type { AuroraLocation } from "@/lib/aurora-locations";
import type { ForecastPoint } from "@/types/spacewx";
import {
  getGeomagneticLatitude,
  AURORA_OVAL_BASE_LATITUDE,
  AURORA_OVAL_DEGREES_PER_KP,
} from "@/lib/aurora-utils";

interface AuroraFrequencyChartProps {
  forecast: ForecastPoint[] | null;
  locations: AuroraLocation[];
}

type DateRange = "3d" | "7d" | "30d" | "custom";
type SortOrder = "desc" | "asc";

function maxKpToHex(maxKp: number): string {
  if (maxKp >= 7) return "#f59e0b";
  if (maxKp >= 5) return "#8b5cf6";
  return "#3ECF8E";
}

export default function AuroraFrequencyChart({
  forecast,
  locations,
}: AuroraFrequencyChartProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [hideZero, setHideZero] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Compute the active date range
  const activeRange = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "3d":
        return {
          from: now,
          to: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        };
      case "7d":
        return {
          from: now,
          to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
      case "30d":
        return {
          from: now,
          to: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        };
      case "custom":
        return {
          from: customFrom ? new Date(customFrom + "T00:00:00Z") : now,
          to: customTo ? new Date(customTo + "T23:59:59.999Z") : now,
        };
    }
  }, [dateRange, customFrom, customTo]);

  // Filter forecast points within the date range
  const filteredForecast = useMemo(() => {
    if (!forecast || forecast.length === 0) return [];
    return forecast.filter((p) => {
      const t = new Date(p.time).getTime();
      return t >= activeRange.from.getTime() && t <= activeRange.to.getTime();
    });
  }, [forecast, activeRange]);

  // Compute frequency for each location
  const locationFrequencies = useMemo(() => {
    const results: {
      name: string;
      count: number;
      maxKp: number;
      lat: number;
      lng: number;
    }[] = [];

    for (const loc of locations) {
      const geomagLat = getGeomagneticLatitude(loc.lat, loc.lng);
      const minKp =
        (AURORA_OVAL_BASE_LATITUDE - geomagLat) / AURORA_OVAL_DEGREES_PER_KP;

      let count = 0;
      let maxKp = 0;
      for (const p of filteredForecast) {
        if (p.kp >= minKp) {
          count++;
          if (p.kp > maxKp) maxKp = p.kp;
        }
      }
      results.push({
        name: loc.name,
        count,
        maxKp,
        lat: loc.lat,
        lng: loc.lng,
      });
    }

    return results;
  }, [locations, filteredForecast]);

  // Apply sorting and filtering
  const chartData = useMemo(() => {
    let data = [...locationFrequencies];
    if (hideZero) {
      data = data.filter((d) => d.count > 0);
    }
    data.sort((a, b) => {
      const diff = a.count - b.count;
      return sortOrder === "desc" ? -diff : diff;
    });
    return data;
  }, [locationFrequencies, hideZero, sortOrder]);

  if (!forecast || forecast.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <BarChart3 size={40} className="text-faint-star/30" />
        <p className="text-sm text-faint-star">
          Forecast data is not yet available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date range presets */}
        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label="Date range selector"
        >
          {(["3d", "7d", "30d", "custom"] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={dateRange === r ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(r)}
              className={
                dateRange === r
                  ? "bg-aurora-green text-void-navy hover:bg-aurora-green/90"
                  : "border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight"
              }
              aria-pressed={dateRange === r}
            >
              {r === "3d"
                ? "3 Days"
                : r === "7d"
                  ? "7 Days"
                  : r === "30d"
                    ? "30 Days"
                    : "Custom"}
            </Button>
          ))}
        </div>

        {/* Sort order */}
        <Select
          value={sortOrder}
          onValueChange={(val) => setSortOrder(val as SortOrder)}
        >
          <SelectTrigger className="bg-void-navy border-deep-indigo text-starlight text-xs h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-deep-indigo border-void-navy text-starlight">
            <SelectItem value="desc">Most Likely</SelectItem>
            <SelectItem value="asc">Least Likely</SelectItem>
          </SelectContent>
        </Select>

        {/* Hide zero toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHideZero(!hideZero)}
          className={`border-deep-indigo text-xs ${
            hideZero
              ? "bg-aurora-green/10 text-aurora-green"
              : "text-faint-star hover:text-starlight"
          }`}
        >
          <Filter size={14} className="mr-1" />
          Show only with aurora
          {hideZero && <Check size={14} className="ml-1" />}
        </Button>
      </div>

      {/* Custom date inputs */}
      {dateRange === "custom" && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="freq-from" className="text-xs text-faint-star">
              From
            </Label>
            <Input
              id="freq-from"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green w-40 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="freq-to" className="text-xs text-faint-star">
              To
            </Label>
            <Input
              id="freq-to"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green w-40 h-9"
            />
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <BarChart3 size={40} className="text-faint-star/30" />
          <p className="text-sm text-faint-star">
            No locations with aurora windows in this date range.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-deep-indigo bg-void-navy/30 p-4">
          <ResponsiveContainer
            width="100%"
            height={Math.max(400, chartData.length * 28)}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1a2540"
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "#8A93A8", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#8A93A8", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#131B33",
                  border: "1px solid #3ECF8E",
                  borderRadius: "0.75rem",
                  color: "#E7ECF5",
                  fontSize: "0.875rem",
                }}
                formatter={(value: any, name: any) => {
                  if (name === "count") return [`${value} windows`, "Windows"];
                  return [value, name];
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={maxKpToHex(entry.maxKp)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-faint-star">
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded inline-block"
            style={{ backgroundColor: "#3ECF8E" }}
          />{" "}
          Kp 4+
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded inline-block"
            style={{ backgroundColor: "#8b5cf6" }}
          />{" "}
          Kp 5+
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded inline-block"
            style={{ backgroundColor: "#f59e0b" }}
          />{" "}
          Kp 7+
        </span>
      </div>
    </div>
  );
}
