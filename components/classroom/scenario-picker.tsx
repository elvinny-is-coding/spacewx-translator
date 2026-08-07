// components/classroom/scenario-picker.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSpaceWeather } from "@/providers/space-weather-provider";
import { getAllScenarios } from "@/data/scenarios";
import type { ScenarioFixture } from "@/types/classroom";
import {
  CalendarDays,
  History,
  Clock,
  Zap,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface ScenarioPickerProps {
  selected: ScenarioFixture | null;
  onChange: (scenario: ScenarioFixture) => void;
  disabled?: boolean;
}

export default function ScenarioPicker({
  selected,
  onChange,
  disabled = false,
}: ScenarioPickerProps) {
  const [activeTab, setActiveTab] = useState<"historical" | "today">(
    "historical",
  );
  const liveData = useSpaceWeather();
  const scenarios = getAllScenarios();

  // Build a "Today" scenario from live data
  const todayScenario: ScenarioFixture = {
    id: "today",
    title: "Today's Live Conditions",
    date: new Date().toISOString(),
    description:
      "Make a decision based on real‑time space weather data from NOAA and NASA.",
    snapshot: {
      kp: liveData.kp,
      noaaScaleG: liveData.noaaScaleG,
      noaaScaleR: liveData.noaaScaleR,
      noaaScaleS: liveData.noaaScaleS,
      solarWindSpeed: liveData.solarWind?.speed ?? null,
      solarWindBz: liveData.solarWind?.bz ?? null,
      flares: liveData.flares.map((f) => ({
        classType: f.classType,
        beginTime: f.beginTime,
      })),
      cmes: liveData.cmes.map((c) => ({
        speed: c.speed,
        note: c.note,
        startTime: c.startTime,
      })),
    },
    deterministicVerdict: "CONDITIONAL GO", // placeholder – will be overwritten by the deterministic check
    historicalOutcome: undefined,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-display text-lg text-starlight">
          Choose a Scenario
        </h3>
        <p className="text-sm text-faint-star">
          Pick a real historical event or use today's live conditions to
          practice your space weather decision‑making.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "historical"}
          onClick={() => setActiveTab("historical")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "historical"
              ? "bg-aurora-green text-void-navy"
              : "bg-void-navy text-faint-star hover:text-starlight border border-deep-indigo",
          )}
        >
          <History size={16} />
          Historical Scenarios
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "today"}
          onClick={() => setActiveTab("today")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "today"
              ? "bg-aurora-green text-void-navy"
              : "bg-void-navy text-faint-star hover:text-starlight border border-deep-indigo",
          )}
        >
          <Zap size={16} />
          Today's Live Data
        </button>
      </div>

      {/* Historical scenarios grid */}
      {activeTab === "historical" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((scenario) => {
            const isActive = selected?.id === scenario.id;
            const hasXFlare = scenario.snapshot.flares.some((f) =>
              f.classType.toUpperCase().startsWith("X"),
            );
            const isExtreme = scenario.deterministicVerdict === "NO GO";

            return (
              <button
                key={scenario.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(scenario)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? "border-aurora-green bg-aurora-green/10 ring-2 ring-aurora-green/30"
                    : "border-deep-indigo bg-void-navy/50 hover:border-faint-star/30 hover:bg-void-navy",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      isExtreme
                        ? "bg-red-600/20 text-red-400"
                        : hasXFlare
                          ? "bg-solar-amber/20 text-solar-amber"
                          : "bg-deep-indigo text-faint-star",
                    )}
                  >
                    {isExtreme ? (
                      <AlertTriangle size={16} />
                    ) : hasXFlare ? (
                      <Zap size={16} />
                    ) : (
                      <Activity size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-starlight truncate">
                      {scenario.title}
                    </p>
                    <p className="text-xs text-faint-star flex items-center gap-1 mt-0.5">
                      <CalendarDays size={12} />
                      {scenario.date}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-faint-star leading-relaxed">
                  {scenario.description}
                </p>
                {isExtreme && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-600/30">
                    EXTREME EVENT
                  </span>
                )}
                {hasXFlare && !isExtreme && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-solar-amber/20 text-solar-amber border border-solar-amber/30">
                    X‑CLASS FLARE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Today's live data card */}
      {activeTab === "today" && (
        <div className="space-y-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(todayScenario)}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all w-full",
              selected?.id === "today"
                ? "border-aurora-green bg-aurora-green/10 ring-2 ring-aurora-green/30"
                : "border-deep-indigo bg-void-navy/50 hover:border-faint-star/30 hover:bg-void-navy",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            aria-pressed={selected?.id === "today"}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="w-8 h-8 rounded-full bg-aurora-green/20 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-aurora-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-starlight">
                  Today's Live Conditions
                </p>
                <p className="text-xs text-faint-star mt-0.5">
                  Real‑time NOAA / NASA data — current Kp:{" "}
                  {liveData.kp?.toFixed(1) ?? "?"}
                </p>
              </div>
            </div>
            <p className="text-xs text-faint-star leading-relaxed">
              Make a decision based on actual current space weather conditions.
              Good for practicing with real data, though most days are quiet.
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
