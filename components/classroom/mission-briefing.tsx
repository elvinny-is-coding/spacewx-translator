// components/classroom/mission-briefing.tsx
"use client";

import type { ScenarioFixture, MissionRole } from "@/types/classroom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  CloudLightning,
  Activity,
  AlertTriangle,
  CalendarDays,
  Info,
} from "lucide-react";

interface MissionBriefingProps {
  scenario: ScenarioFixture;
  role: MissionRole;
}

const ROLE_SUBTITLES: Record<MissionRole, string> = {
  "Satellite Operator":
    "You are responsible for satellite operations during this event.",
  "Polar Flight Dispatcher":
    "You must decide whether to route flights via the polar corridor or divert.",
  "Mission Planner":
    "You determine if conditions are safe for a scheduled launch or deployment.",
  "Ham Radio Operator":
    "You decide whether to operate during this contest given the current propagation.",
  "ISS EVA Planner":
    "You must decide if a scheduled spacewalk should proceed or be delayed.",
};

export default function MissionBriefing({
  scenario,
  role,
}: MissionBriefingProps) {
  const s = scenario.snapshot;
  const hasXFlare = s.flares.some((f) =>
    f.classType.toUpperCase().startsWith("X"),
  );
  const isExtreme = scenario.deterministicVerdict === "NO GO";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-display text-lg text-starlight">
          Mission Briefing
        </h3>
        <p className="text-sm text-faint-star">
          Review the space weather data below. You are the{" "}
          <span className="font-medium text-starlight">{role}</span>.{" "}
          {ROLE_SUBTITLES[role]}
        </p>
      </div>

      {/* Scenario header */}
      <div
        className={`rounded-xl border p-4 ${
          isExtreme
            ? "border-red-600/30 bg-red-600/5"
            : hasXFlare
              ? "border-solar-amber/30 bg-solar-amber/5"
              : "border-deep-indigo bg-void-navy/30"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isExtreme ? (
              <AlertTriangle size={18} className="text-red-400" />
            ) : hasXFlare ? (
              <Zap size={18} className="text-solar-amber" />
            ) : (
              <Activity size={18} className="text-aurora-green" />
            )}
            <h4 className="text-sm font-semibold text-starlight">
              {scenario.title}
            </h4>
          </div>
          <div className="flex items-center gap-1 text-xs text-faint-star">
            <CalendarDays size={12} />
            {scenario.date}
          </div>
        </div>
        <p className="text-xs text-faint-star leading-relaxed">
          {scenario.description}
        </p>
      </div>

      {/* Space weather metrics */}
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-starlight flex items-center gap-2">
            <Info size={14} className="text-aurora-green" />
            Current Space Weather Conditions
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Kp */}
            <div className="bg-void-navy/50 rounded-lg p-3 text-center">
              <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
                Kp Index
              </p>
              <p className="text-xl font-mono font-bold text-starlight">
                {s.kp !== null ? s.kp.toFixed(1) : "—"}
              </p>
              {s.kp !== null && (
                <Badge
                  className="mt-1 border-none px-2 py-0 text-[10px]"
                  style={{
                    backgroundColor:
                      s.kp >= 7
                        ? "#dc2626"
                        : s.kp >= 5
                          ? "#f59e0b"
                          : s.kp >= 4
                            ? "#b18cff"
                            : "#3ecf8e",
                    color: "#0B1120",
                  }}
                >
                  {s.kp >= 7
                    ? "Storm"
                    : s.kp >= 5
                      ? "Active"
                      : s.kp >= 4
                        ? "Unsettled"
                        : "Quiet"}
                </Badge>
              )}
            </div>

            {/* G-scale */}
            <div className="bg-void-navy/50 rounded-lg p-3 text-center">
              <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
                G‑scale
              </p>
              <p className="text-xl font-mono font-bold text-starlight">
                {s.noaaScaleG !== null ? `G${s.noaaScaleG}` : "—"}
              </p>
              <p className="text-[10px] text-faint-star mt-1">Geomagnetic</p>
            </div>

            {/* R-scale */}
            <div className="bg-void-navy/50 rounded-lg p-3 text-center">
              <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
                R‑scale
              </p>
              <p className="text-xl font-mono font-bold text-starlight">
                {s.noaaScaleR !== null ? `R${s.noaaScaleR}` : "—"}
              </p>
              <p className="text-[10px] text-faint-star mt-1">Radio Blackout</p>
            </div>

            {/* S-scale */}
            <div className="bg-void-navy/50 rounded-lg p-3 text-center">
              <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
                S‑scale
              </p>
              <p className="text-xl font-mono font-bold text-starlight">
                {s.noaaScaleS !== null ? `S${s.noaaScaleS}` : "—"}
              </p>
              <p className="text-[10px] text-faint-star mt-1">Radiation</p>
            </div>

            {/* Solar Wind */}
            <div className="bg-void-navy/50 rounded-lg p-3 text-center">
              <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
                Solar Wind
              </p>
              <p className="text-lg font-mono font-bold text-starlight">
                {s.solarWindSpeed !== null ? `${s.solarWindSpeed} km/s` : "—"}
              </p>
              <p className="text-[10px] text-faint-star mt-1">
                Bz: {s.solarWindBz !== null ? `${s.solarWindBz} nT` : "—"}
              </p>
            </div>

            {/* Notable events */}
            <div className="bg-void-navy/50 rounded-lg p-3 text-center">
              <p className="text-xs text-faint-star uppercase tracking-wider mb-1">
                Notable Events
              </p>
              <p className="text-sm text-starlight">
                {s.flares.length > 0
                  ? s.flares.map((f) => f.classType).join(", ")
                  : "None"}
              </p>
              <p className="text-[10px] text-faint-star mt-1">
                {s.cmes.length > 0
                  ? `${s.cmes.length} CME${s.cmes.length > 1 ? "s" : ""}`
                  : "No CMEs"}
              </p>
            </div>
          </div>

          {/* CME details if present */}
          {s.cmes.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-xs font-medium text-starlight">
                Coronal Mass Ejections
              </p>
              {s.cmes.map((cme, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-faint-star"
                >
                  <CloudLightning size={12} className="text-aurora-violet" />
                  <span>
                    {cme.speed !== null ? `${cme.speed} km/s` : "Speed unknown"}
                    {cme.note ? ` — ${cme.note}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
