// components/mission-advisor.tsx
"use client";

import { useState } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { MissionType, MissionAdvisory } from "@/types/mission-advisory";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface MissionAdvisorProps {
  data: SpaceWeatherData;
}

const MISSION_TYPES: MissionType[] = [
  "CubeSat Launch",
  "HF Operation",
  "Balloon Flight",
  "Aurora Photography",
];

function verdictColor(verdict: string): string {
  switch (verdict) {
    case "GO":
      return "bg-aurora-green text-void-navy";
    case "CONDITIONAL GO":
      return "bg-solar-amber/20 text-solar-amber";
    case "NO GO":
      return "bg-red-600 text-white";
    default:
      return "bg-faint-star text-void-navy";
  }
}

function VerdictIcon({ verdict }: { verdict: string }) {
  if (verdict === "GO")
    return <CheckCircle size={16} className="text-aurora-green" />;
  if (verdict === "CONDITIONAL GO")
    return <AlertCircle size={16} className="text-solar-amber" />;
  if (verdict === "NO GO")
    return <XCircle size={16} className="text-red-500" />;
  return null;
}

export default function MissionAdvisor({ data }: MissionAdvisorProps) {
  const [selectedMission, setSelectedMission] = useState<MissionType | null>(
    null,
  );
  const [advisory, setAdvisory] = useState<MissionAdvisory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMissionSelect = async (mission: MissionType) => {
    setSelectedMission(mission);
    setAdvisory(null);
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/mission-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionType: mission, data }),
      });
      if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
      const json = await res.json();
      setAdvisory(json.advisory);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Rocket size={16} className="text-aurora-green" />
        <h4 className="text-sm font-semibold text-starlight">
          Mission Window Advisor
        </h4>
      </div>

      <Select
        value={selectedMission ?? ""}
        onValueChange={(val) => handleMissionSelect(val as MissionType)}
      >
        <SelectTrigger className="w-full bg-void-navy border-void-navy text-starlight text-sm">
          <SelectValue placeholder="Select mission type..." />
        </SelectTrigger>
        <SelectContent className="bg-deep-indigo border-void-navy text-starlight">
          {MISSION_TYPES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-void-navy" />
          <Skeleton className="h-4 w-3/4 bg-void-navy" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="text-sm text-solar-amber text-center py-2">{error}</div>
      )}

      {/* Advisory result */}
      {!isLoading && !error && advisory && (
        <div className="rounded-lg border border-void-navy bg-void-navy/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-starlight">
              {advisory.missionType}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${verdictColor(advisory.verdict)}`}
            >
              {advisory.verdict}
            </span>
          </div>
          <p className="text-xs text-faint-star leading-relaxed">
            {advisory.summary}
          </p>
          {advisory.earliestSafeWindow && (
            <div className="flex items-center gap-1.5 text-xs text-aurora-green">
              <Clock size={12} />
              <span>Earliest safe window: {advisory.earliestSafeWindow}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
