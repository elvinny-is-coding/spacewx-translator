"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Snapshot {
  timestamp: string;
  kp: number | null;
}

type DateRange = "24h" | "7d" | "30d" | "custom";

function computeRange(
  range: DateRange,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const now = new Date();
  switch (range) {
    case "24h":
      return {
        from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
      };
    case "7d":
      return {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
      };
    case "30d":
      return {
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
      };
    case "custom":
      if (!customFrom || !customTo)
        return { from: now.toISOString(), to: now.toISOString() };
      const fromDate = new Date(customFrom + "T00:00:00Z");
      const toDate = new Date(customTo + "T23:59:59.999Z");
      return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }
}

export default function HistoricalChart() {
  const [range, setRange] = useState<DateRange>("24h");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSnapshots() {
      setIsLoading(true);
      setError(null);
      try {
        const { from, to } = computeRange(range, customFrom, customTo);
        const res = await fetch(
          `/api/snapshots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        );
        if (!res.ok)
          throw new Error(`Failed to fetch snapshots (HTTP ${res.status})`);
        const json = await res.json();
        if (!cancelled) {
          const data = json.snapshots.map((s: Snapshot) => ({
            time: new Date(s.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            kp: s.kp,
          }));
          setSnapshots(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Unknown error");
          setIsLoading(false);
        }
      }
    }
    fetchSnapshots();
    return () => {
      cancelled = true;
    };
  }, [range, customFrom, customTo]);

  return (
    <Card className="border-none bg-deep-indigo">
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-display text-lg text-starlight">HISTORICAL KP</h3>
          <p className="text-sm text-faint-star">
            See how geomagnetic activity has changed over the past day, week, or
            month.
          </p>
        </div>

        {/* Range selector */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Date range selector"
        >
          {(["24h", "7d", "30d", "custom"] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
              className={
                range === r
                  ? "bg-aurora-green text-void-navy hover:bg-aurora-green/90"
                  : "border-deep-indigo text-faint-star hover:bg-deep-indigo/50 hover:text-starlight"
              }
              aria-pressed={range === r}
            >
              {r === "24h"
                ? "24 Hours"
                : r === "7d"
                  ? "7 Days"
                  : r === "30d"
                    ? "30 Days"
                    : "Custom"}
            </Button>
          ))}
        </div>

        {/* Custom date inputs */}
        {range === "custom" && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label
                htmlFor="from-date"
                className="text-xs text-faint-star whitespace-nowrap"
              >
                From
              </Label>
              <Input
                id="from-date"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green w-full sm:w-40"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label
                htmlFor="to-date"
                className="text-xs text-faint-star whitespace-nowrap"
              >
                To
              </Label>
              <Input
                id="to-date"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-void-navy border-void-navy text-starlight placeholder:text-faint-star focus:border-aurora-green w-full sm:w-40"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        )}

        {/* Chart area */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4 bg-void-navy" />
            <Skeleton className="h-64 w-full bg-void-navy" />
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center text-sm text-solar-amber py-12">
            {error}
          </div>
        )}

        {!isLoading && !error && snapshots.length === 0 && (
          <div className="text-center text-sm text-faint-star py-12">
            No historical data available for this period.
          </div>
        )}

        {!isLoading && !error && snapshots.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={snapshots}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="historicalGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3ECF8E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3ECF8E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#1a2540"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#8A93A8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 9]}
                  ticks={[0, 2, 4, 6, 8]}
                  tick={{ fill: "#8A93A8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#131B33",
                    border: "1px solid #3ECF8E",
                    borderRadius: "0.75rem",
                    color: "#E7ECF5",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kp"
                  stroke="#3ECF8E"
                  strokeWidth={2}
                  fill="url(#historicalGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#3ECF8E" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
