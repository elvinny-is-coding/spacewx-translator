// components/postmortem-report.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CloudLightning, Clock, TrendingUp } from "lucide-react";
import type { StormReport } from "@/types/postmortem";

interface PostmortemReportProps {
  report: StormReport;
}

export default function PostmortemReport({ report }: PostmortemReportProps) {
  const stormStart = new Date(report.storm_start);
  const stormEnd = new Date(report.storm_end);

  return (
    <Card className="border-none bg-void-navy/60 hover:bg-void-navy transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudLightning size={16} className="text-solar-amber" />
            <h4 className="text-sm font-medium text-starlight">
              Geomagnetic Storm —{" "}
              {stormStart.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </h4>
          </div>
          <Badge
            className="border-none px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--color-solar-amber)",
              color: "#0B1120",
            }}
          >
            Kp {report.peak_kp?.toFixed(1) ?? "?"}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-faint-star">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {report.duration_hours != null
              ? `~${Math.round(report.duration_hours)}h`
              : "Unknown duration"}
          </span>
          <span className="flex items-center gap-1">
            <Zap size={12} />
            {report.precursor_flares?.length ?? 0} flare
            {report.precursor_flares?.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={12} />
            {report.precursor_cmes?.length ?? 0} CME
            {report.precursor_cmes?.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Report text */}
        <p className="text-xs text-faint-star leading-relaxed whitespace-pre-wrap">
          {report.report_text}
        </p>

        {/* Generated timestamp */}
        <p className="text-[10px] text-faint-star/50">
          AI‑generated report —{" "}
          {new Date(report.generated_at).toLocaleString("en-US")}
        </p>
      </CardContent>
    </Card>
  );
}
