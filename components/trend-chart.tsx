"use client";

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
import type { ForecastPoint } from "@/types/spacewx";

interface TrendChartProps {
  forecast: ForecastPoint[] | null;
}

export default function TrendChart({ forecast }: TrendChartProps) {
  if (!forecast || forecast.length === 0) {
    return (
      <Card className="border-none bg-deep-indigo">
        <CardContent className="flex h-64 items-center justify-center p-6">
          <p className="text-sm text-faint-star">Insufficient data for trend</p>
        </CardContent>
      </Card>
    );
  }

  // Format data for Recharts
  const chartData = forecast.map((point) => ({
    time: new Date(point.time).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    kp: point.kp,
  }));

  return (
    <Card className="border-none bg-deep-indigo">
      <CardContent className="p-6">
        <h3 className="mb-1 font-display text-lg text-starlight">
          7‑DAY TREND
        </h3>
        <p className="mb-4 text-sm text-faint-star">
          Forecast of geomagnetic activity over the next week. Watch for upward
          swings — they often mean aurora may become visible farther from the
          poles.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="auroraGradient" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#auroraGradient)"
              dot={{ r: 3, fill: "#3ECF8E" }}
              activeDot={{ r: 5, fill: "#3ECF8E" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
