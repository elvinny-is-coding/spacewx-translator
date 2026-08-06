// components/mission-advisor.tsx
"use client";

import { useState, useEffect } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { MissionType, MissionAdvisory } from "@/types/mission-advisory";
import { Skeleton } from "@/components/ui/skeleton";
import MissionChips from "@/components/mission-chips";
import {
  Rocket,
  Radio,
  Plane,
  Camera,
  Wrench,
  Telescope,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Target,
} from "lucide-react";

interface MissionAdvisorProps {
  data: SpaceWeatherData;
}

const MISSION_ICONS: Record<MissionType, React.ReactNode> = {
  "CubeSat Launch": <Rocket size={20} />,
  "HF Operation": <Radio size={20} />,
  "Balloon Flight": <Plane size={20} />,
  "Aurora Photography": <Camera size={20} />,
  "Satellite Maintenance": <Wrench size={20} />,
  "Telescope Observation": <Telescope size={20} />,
};

function verdictBadge(verdict: string): {
  bg: string;
  text: string;
  icon: React.ReactNode;
  label: string;
} {
  switch (verdict) {
    case "GO":
      return {
        bg: "bg-aurora-green/10 border-aurora-green/30",
        text: "text-aurora-green",
        icon: <CheckCircle size={24} className="text-aurora-green" />,
        label: "GO",
      };
    case "CONDITIONAL GO":
      return {
        bg: "bg-solar-amber/10 border-solar-amber/30",
        text: "text-solar-amber",
        icon: <AlertCircle size={24} className="text-solar-amber" />,
        label: "CONDITIONAL GO",
      };
    case "NO GO":
      return {
        bg: "bg-red-600/10 border-red-600/30",
        text: "text-red-400",
        icon: <XCircle size={24} className="text-red-400" />,
        label: "NO GO",
      };
    default:
      return {
        bg: "bg-faint-star/10 border-faint-star/30",
        text: "text-faint-star",
        icon: <Target size={24} className="text-faint-star" />,
        label: "UNKNOWN",
      };
  }
}

export default function MissionAdvisor({ data }: MissionAdvisorProps) {
  const [selectedMission, setSelectedMission] =
    useState<MissionType>("CubeSat Launch");
  const [advisory, setAdvisory] = useState<MissionAdvisory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch advisory when mission type changes
  useEffect(() => {
    let cancelled = false;

    async function fetchAdvisory() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/mission-advisory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionType: selectedMission, data }),
        });
        if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
        const json = await res.json();
        if (!cancelled) {
          setAdvisory(json.advisory);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Unknown error");
          setIsLoading(false);
        }
      }
    }

    fetchAdvisory();
    return () => {
      cancelled = true;
    };
  }, [selectedMission, data]);

  const verdict = advisory ? verdictBadge(advisory.verdict) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target size={18} className="text-aurora-green" />
        <h4 className="text-sm font-semibold text-starlight">
          Mission Window Advisor
        </h4>
      </div>

      {/* Mission type chips */}
      <MissionChips
        selected={selectedMission}
        onChange={setSelectedMission}
        disabled={isLoading}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 bg-void-navy" />
          <Skeleton className="h-16 w-full bg-void-navy" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="text-sm text-solar-amber text-center py-4">{error}</div>
      )}

      {/* Advisory card */}
      {!isLoading && !error && advisory && verdict && (
        <div className={`rounded-xl border p-5 space-y-3 ${verdict.bg}`}>
          {/* Top row: icon, mission type, verdict label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={verdict.text}>
                {MISSION_ICONS[advisory.missionType]}
              </div>
              <div>
                <span className="text-sm font-medium text-starlight">
                  {advisory.missionType}
                </span>
                {advisory.earliestSafeWindow && (
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-aurora-green">
                    <Clock size={12} />
                    <span>Earliest safe: {advisory.earliestSafeWindow}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {verdict.icon}
              <span className={`text-sm font-bold ${verdict.text}`}>
                {verdict.label}
              </span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-xs text-faint-star leading-relaxed">
            {advisory.summary}
          </p>
        </div>
      )}
    </div>
  );
}
