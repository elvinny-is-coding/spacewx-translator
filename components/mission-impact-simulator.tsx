// components/mission-impact-simulator.tsx
"use client";

import { useState } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type {
  MissionImpactRequest,
  MissionImpactResponse,
  ToleranceLevel,
} from "@/types/mission-impact";
import type { MissionType } from "@/types/mission-advisory";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Rocket,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  ChevronRight,
  Target,
  Zap,
} from "lucide-react";

interface MissionImpactSimulatorProps {
  data: SpaceWeatherData;
}

const MISSION_TYPES: MissionType[] = [
  "CubeSat Launch",
  "HF Operation",
  "Balloon Flight",
  "Aurora Photography",
  "Satellite Maintenance",
  "Telescope Observation",
];

const TOLERANCE_LEVELS: ToleranceLevel[] = ["strict", "moderate", "flexible"];

function toleranceLabel(t: ToleranceLevel): string {
  switch (t) {
    case "strict":
      return "Strict — only go if conditions are well within limits";
    case "moderate":
      return "Moderate — accept manageable risks";
    case "flexible":
      return "Flexible — proceed unless critical risk";
  }
}

function toleranceDisplayLabel(t: ToleranceLevel): string {
  switch (t) {
    case "strict":
      return "Strict";
    case "moderate":
      return "Moderate";
    case "flexible":
      return "Flexible";
  }
}

function verdictColor(verdict: string): string {
  switch (verdict) {
    case "GO":
      return "bg-aurora-green/10 border-aurora-green/30 text-aurora-green dark:bg-aurora-green/20 dark:text-aurora-green dark:border-aurora-green/30";
    case "CONDITIONAL GO":
      return "bg-solar-amber/10 border-solar-amber/30 text-solar-amber dark:bg-solar-amber/20 dark:text-solar-amber dark:border-solar-amber/30";
    case "NO GO":
      return "bg-red-500/10 border-red-500/30 text-red-600 dark:bg-red-600/20 dark:text-red-400 dark:border-red-600/30";
    default:
      return "bg-faint-star/10 border-faint-star/30 text-faint-star dark:bg-faint-star/20 dark:text-faint-star dark:border-faint-star/30";
  }
}

function verdictIcon(verdict: string) {
  switch (verdict) {
    case "GO":
      return <CheckCircle size={24} className="text-aurora-green dark:text-aurora-green" />;
    case "CONDITIONAL GO":
      return <AlertTriangle size={24} className="text-solar-amber dark:text-solar-amber" />;
    case "NO GO":
      return <XCircle size={24} className="text-red-600 dark:text-red-400" />;
    default:
      return <Target size={24} className="text-faint-star dark:text-faint-star" />;
  }
}

function riskSeverityColor(severity: string): string {
  switch (severity) {
    case "low":
      return "bg-aurora-green/20 text-aurora-green dark:bg-aurora-green/30 dark:text-aurora-green";
    case "medium":
      return "bg-solar-amber/20 text-solar-amber dark:bg-solar-amber/30 dark:text-solar-amber";
    case "high":
      return "bg-solar-amber/30 text-solar-amber dark:bg-solar-amber/40 dark:text-solar-amber";
    case "critical":
      return "bg-red-600/20 text-red-400 dark:bg-red-600/30 dark:text-red-400";
    default:
      return "bg-faint-star/20 text-faint-star dark:bg-faint-star/30 dark:text-faint-star";
  }
}

export default function MissionImpactSimulator({
  data,
}: MissionImpactSimulatorProps) {
  const [missionType, setMissionType] = useState<MissionType>("CubeSat Launch");
  const [timeWindowStart, setTimeWindowStart] = useState("");
  const [timeWindowEnd, setTimeWindowEnd] = useState("");
  const [altitudeKm, setAltitudeKm] = useState("");
  const [tolerance, setTolerance] = useState<ToleranceLevel>("moderate");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [impact, setImpact] = useState<MissionImpactResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetChange = (preset: string | null) => {
    if (!preset) return;
    setSelectedPreset(preset);
    const now = new Date();
    let startTime = now;
    let endTime = now;

    switch (preset) {
      case "next-24h":
        endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "next-48h":
        endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        break;
      case "next-7d":
        endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "next-14d":
        endTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case "next-30d":
        endTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case "today":
        startTime = new Date(now.setHours(0, 0, 0, 0));
        endTime = new Date(now.setHours(23, 59, 59, 999));
        break;
      default:
        return;
    }

    setTimeWindowStart(startTime.toISOString().slice(0, 16));
    setTimeWindowEnd(endTime.toISOString().slice(0, 16));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeWindowStart || !timeWindowEnd || isLoading) return;

    setImpact(null);
    setError(null);
    setIsLoading(true);

    const missionRequest: MissionImpactRequest = {
      missionType,
      timeWindowStart: new Date(timeWindowStart).toISOString(),
      timeWindowEnd: new Date(timeWindowEnd).toISOString(),
      altitudeKm: altitudeKm ? parseFloat(altitudeKm) : undefined,
      tolerance,
    };

    try {
      const res = await fetch("/api/mission-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionRequest, data }),
      });
      if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
      const json = await res.json();
      setImpact(json.impact);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-aurora-green dark:text-aurora-green" />
          <h4 className="text-base font-semibold text-starlight dark:text-starlight">
            Mission Impact Simulator
          </h4>
        </div>
        <p className="text-sm text-faint-star leading-relaxed dark:text-faint-star">
          Simulate mission impact based on space weather conditions and time windows.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mission type */}
          <div className="space-y-1.5">
            <Label className="text-sm text-starlight font-medium dark:text-starlight">Mission Type</Label>
            <Select
              value={missionType}
              onValueChange={(val) => setMissionType(val as MissionType)}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-void-navy border-deep-indigo text-starlight text-sm h-10 w-full dark:bg-void-navy dark:border-deep-indigo dark:text-starlight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-deep-indigo border-void-navy text-starlight dark:bg-deep-indigo dark:border-void-navy dark:text-starlight">
                {MISSION_TYPES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tolerance - Segmented Control */}
          <div className="space-y-1.5">
            <Label className="text-sm text-starlight font-medium dark:text-starlight">Risk Tolerance</Label>
            <div className="grid grid-cols-3 gap-2">
              {TOLERANCE_LEVELS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTolerance(t)}
                  disabled={isLoading}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    tolerance === t
                      ? "bg-aurora-green text-void-navy border-aurora-green shadow-sm"
                      : "bg-void-navy text-faint-star border-deep-indigo hover:bg-deep-indigo/50 dark:bg-void-navy dark:text-faint-star dark:border-deep-indigo dark:hover:bg-deep-indigo/50"
                  }`}
                >
                  {toleranceDisplayLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Time window start */}
          <div className="space-y-1.5">
            <Label className="text-sm text-starlight font-medium dark:text-starlight">Time Window Start</Label>
            <Input
              type="datetime-local"
              value={timeWindowStart}
              onChange={(e) => setTimeWindowStart(e.target.value)}
              disabled={isLoading}
              className="bg-void-navy border-deep-indigo text-starlight text-sm h-10 w-full dark:bg-void-navy dark:border-deep-indigo dark:text-starlight"
            />
          </div>

          {/* Time window end */}
          <div className="space-y-1.5">
            <Label className="text-sm text-starlight font-medium dark:text-starlight">Time Window End</Label>
            <Input
              type="datetime-local"
              value={timeWindowEnd}
              onChange={(e) => setTimeWindowEnd(e.target.value)}
              disabled={isLoading}
              className="bg-void-navy border-deep-indigo text-starlight text-sm h-10 w-full dark:bg-void-navy dark:border-deep-indigo dark:text-starlight"
            />
          </div>

          {/* Altitude with unit adornment */}
          <div className="space-y-1.5">
            <Label className="text-sm text-starlight font-medium dark:text-starlight">Altitude</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="e.g., 400"
                value={altitudeKm}
                onChange={(e) => setAltitudeKm(e.target.value)}
                disabled={isLoading}
                className="bg-void-navy border-deep-indigo text-starlight text-sm h-10 w-full pr-12 dark:bg-void-navy dark:border-deep-indigo dark:text-starlight"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint-star pointer-events-none dark:text-faint-star">km</span>
            </div>
          </div>

          {/* Quick preset */}
          <div className="space-y-1.5">
            <Label className="text-sm text-starlight font-medium dark:text-starlight">Quick Preset</Label>
            <Select
              value={selectedPreset}
              onValueChange={handlePresetChange}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-void-navy border-deep-indigo text-starlight text-sm h-10 w-full dark:bg-void-navy dark:border-deep-indigo dark:text-starlight">
                <SelectValue placeholder="Select a time preset" />
              </SelectTrigger>
              <SelectContent className="bg-deep-indigo border-void-navy text-starlight dark:bg-deep-indigo dark:border-void-navy dark:text-starlight">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="next-24h">Next 24 Hours</SelectItem>
                <SelectItem value="next-48h">Next 48 Hours</SelectItem>
                <SelectItem value="next-7d">Next 7 Days</SelectItem>
                <SelectItem value="next-14d">Next 14 Days</SelectItem>
                <SelectItem value="next-30d">Next 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          size="default"
          disabled={!timeWindowStart || !timeWindowEnd || isLoading}
          className="w-full bg-aurora-green text-white hover:bg-aurora-green/90 font-semibold"
        >
          {isLoading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Rocket size={16} className="mr-2" />
          )}
          Simulate Impact
        </Button>
      </form>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4 bg-void-navy dark:bg-void-navy" />
          <Skeleton className="h-4 w-1/2 bg-void-navy dark:bg-void-navy" />
          <Skeleton className="h-20 w-full bg-void-navy dark:bg-void-navy" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="text-sm text-solar-amber text-center py-4 dark:text-solar-amber">{error}</div>
      )}

      {/* Impact result */}
      {!isLoading && !error && impact && (
        <div
          className={`rounded-xl border p-5 space-y-4 ${verdictColor(impact.verdict)}`}
        >
          {/* Top: verdict + confidence */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {verdictIcon(impact.verdict)}
              <div>
                <p className="text-sm font-medium text-starlight dark:text-starlight">
                  {impact.verdict}
                </p>
                <p className="text-xs text-faint-star dark:text-faint-star">
                  Confidence: {(impact.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="w-16 h-2 bg-void-navy dark:bg-void-navy rounded-full overflow-hidden">
              <div
                className="h-full bg-aurora-green transition-all dark:bg-aurora-green"
                style={{ width: `${impact.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Risks */}
          {impact.risks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-starlight dark:text-starlight">Top Risks</p>
              <div className="space-y-1.5">
                {impact.risks.map((risk, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 text-xs ${riskSeverityColor(risk.severity)}`}
                  >
                    <span className="font-semibold">{risk.name}</span>
                    <span className="mx-1">—</span>
                    {risk.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mitigations */}
          {impact.mitigations.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-starlight dark:text-starlight">Mitigations</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-faint-star dark:text-faint-star">
                {impact.mitigations.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Change condition */}
          <div className="flex items-start gap-2 text-xs text-faint-star dark:text-faint-star">
            <Shield size={14} className="mt-0.5 shrink-0" />
            <p>{impact.changeCondition}</p>
          </div>

          {/* Summary */}
          <p className="text-xs text-faint-star leading-relaxed dark:text-faint-star">
            {impact.summary}
          </p>
        </div>
      )}
    </div>
  );
}
