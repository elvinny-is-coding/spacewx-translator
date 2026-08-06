// components/technical-brief.tsx
"use client";

import { memo, useState, Fragment } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import { classifyFlare } from "@/lib/flare-utils";
import { kpToGScale } from "@/config/constants";

interface TechnicalBriefProps {
  data: SpaceWeatherData;
}

function getSolarWindCategory(speed: number | null): {
  label: string;
  color: string;
} {
  if (speed === null) return { label: "—", color: "text-faint-star" };
  if (speed < 400) return { label: "Normal", color: "text-aurora-green" };
  if (speed < 500) return { label: "Elevated", color: "text-aurora-violet" };
  if (speed < 600) return { label: "High", color: "text-solar-amber" };
  return { label: "Extreme", color: "text-red-500" };
}

function getBzCategory(bz: number | null): { label: string; color: string } {
  if (bz === null) return { label: "—", color: "text-faint-star" };
  if (bz > 5) return { label: "Northward", color: "text-aurora-green" };
  if (bz > -5) return { label: "Neutral", color: "text-faint-star" };
  if (bz > -10) return { label: "Southward", color: "text-aurora-violet" };
  return { label: "Strongly Southward", color: "text-solar-amber" };
}

function notableFlareList(data: SpaceWeatherData): string {
  if (!data.flares.length) return "None";

  const classifications = data.flares
    .map((f) => classifyFlare(f.classType))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const notable = classifications
    .filter((c) => c.isNotable)
    .map((c) => c.fullClass);

  return notable.length > 0 ? notable.join(", ") : "None (background only)";
}

function hasProtonStorm(alerts: SpaceWeatherData["alerts"]): boolean {
  return alerts.some((a) => a.message.toLowerCase().includes("proton"));
}

function getMetricDescription(label: string): string {
  switch (label) {
    case "Kp Index":
      return "Planetary K‑index, a 3‑hourly global measure of geomagnetic activity. Ranges 0 (quiet) to 9 (extreme storm).";
    case "G‑scale (Geomagnetic)":
      return "NOAA's Geomagnetic Storm scale. G0 = none, G1 = minor, up to G5 = extreme. Derived from the Kp index.";
    case "R‑scale (Radio Blackout)":
      return "NOAA's Radio Blackout scale. R1–R5 based on solar X‑ray flare intensity. Affects HF radio on the sunlit side.";
    case "S‑scale (Radiation)":
      return "NOAA's Solar Radiation Storm scale. S1–S5 driven by energetic proton flux. Poses risks to satellites, aviation, and astronauts.";
    case "Solar Wind Speed":
      return "Speed of the solar wind plasma. Normal: <400 km/s. High speeds (>600 km/s) are more geoeffective.";
    case "Solar Wind Bz":
      return "North‑south component of the interplanetary magnetic field. Negative (southward) Bz allows energy into Earth's magnetosphere.";
    case "Notable Flares (24h)":
      return "Significant solar flares in the past 24 hours (X‑class and M5+). These can cause radio blackouts and radiation storms.";
    case "Background Flares":
      return "Minor C‑class and smaller M‑class flares. Common even during quiet periods; no significant operational impact.";
    case "Radiation Storm":
      return "Presence of an active solar radiation storm (S‑scale ≥1). Detected via >10 MeV proton flux in NOAA alerts.";
    case "Active Alerts":
      return "Total number of active NOAA space weather alerts. Elevated counts often indicate multiple overlapping events.";
    default:
      return "";
  }
}

function TechnicalBrief({ data }: TechnicalBriefProps) {
  const windCategory = getSolarWindCategory(data.solarWind?.speed ?? null);
  const bzCategory = getBzCategory(data.solarWind?.bz ?? null);
  const gScaleDisplay =
    data.noaaScaleG !== null ? `G${data.noaaScaleG}` : kpToGScale(data.kp);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [tableExpanded, setTableExpanded] = useState(false);

  const rows = [
    {
      label: "Kp Index",
      value: data.kp !== null ? data.kp.toFixed(1) : "—",
      status:
        data.kp !== null
          ? data.kp < 4
            ? "Quiet"
            : data.kp < 5
              ? "Unsettled"
              : data.kp < 7
                ? "Minor Storm"
                : "Major Storm"
          : "—",
      statusClass: "text-starlight font-mono",
    },
    {
      label: "G‑scale (Geomagnetic)",
      value: gScaleDisplay,
      status:
        (data.noaaScaleG !== null && data.noaaScaleG >= 1) ||
        (data.kp !== null && data.kp >= 5)
          ? "Active"
          : "Quiet",
      statusClass: "text-starlight",
    },
    {
      label: "R‑scale (Radio Blackout)",
      value: data.noaaScaleR !== null ? `R${data.noaaScaleR}` : "—",
      status: data.noaaScaleR && data.noaaScaleR >= 1 ? "Active" : "None",
      statusClass:
        data.noaaScaleR && data.noaaScaleR >= 1
          ? "text-solar-amber font-mono"
          : "text-aurora-green font-mono",
    },
    {
      label: "S‑scale (Radiation)",
      value: data.noaaScaleS !== null ? `S${data.noaaScaleS}` : "—",
      status: data.noaaScaleS && data.noaaScaleS >= 1 ? "Active" : "None",
      statusClass:
        data.noaaScaleS && data.noaaScaleS >= 1
          ? "text-solar-amber font-mono"
          : "text-aurora-green font-mono",
    },
    {
      label: "Solar Wind Speed",
      value:
        data.solarWind?.speed != null ? `${data.solarWind.speed} km/s` : "—",
      status: windCategory.label,
      statusClass: `py-2 font-mono ${windCategory.color}`,
    },
    {
      label: "Solar Wind Bz",
      value:
        data.solarWind?.bz != null ? `${data.solarWind.bz.toFixed(1)} nT` : "—",
      status: bzCategory.label,
      statusClass: `py-2 font-mono ${bzCategory.color}`,
    },
    {
      label: "Notable Flares (24h)",
      value: notableFlareList(data),
      status:
        data.flares.filter((f) => f.classType.startsWith("X")).length > 0
          ? "Critical"
          : data.flares.filter((f) => f.classType.startsWith("M")).length > 0
            ? "Elevated"
            : "Normal",
      statusClass: "text-starlight",
    },
    {
      label: "Background Flares",
      value: String(
        data.flares.filter((f) => {
          const c = classifyFlare(f.classType);
          return !c || !c.isNotable;
        }).length,
      ),
      status: "—",
      statusClass: "text-faint-star",
    },
    {
      label: "Radiation Storm",
      value: hasProtonStorm(data.alerts) ? "Active" : "None",
      status: hasProtonStorm(data.alerts) ? "Monitor" : "Normal",
      statusClass: hasProtonStorm(data.alerts)
        ? "text-solar-amber font-mono"
        : "text-aurora-green font-mono",
    },
    {
      label: "Active Alerts",
      value: String(data.alerts.length),
      status: data.alerts.length > 5 ? "Elevated" : "Normal",
      statusClass:
        data.alerts.length > 5
          ? "text-solar-amber font-mono"
          : "text-aurora-green font-mono",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <div
        className={`relative ${!tableExpanded ? "cursor-pointer" : ""}`}
        onClick={() => !tableExpanded && setTableExpanded(true)}
      >
        {/* Table container with max height when collapsed */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            !tableExpanded ? "max-h-[180px]" : "max-h-[2000px]"
          }`}
        >
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-deep-indigo text-aurora-green text-left">
                <th className="py-2 pr-4 font-semibold uppercase tracking-wider">
                  Metric
                </th>
                <th className="py-2 font-semibold uppercase tracking-wider">
                  Value
                </th>
                <th className="py-2 font-semibold uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-indigo">
              {rows.map((row) => {
                const isExpanded = expandedMetric === row.label;
                const description = getMetricDescription(row.label);

                return (
                  <Fragment key={row.label}>
                    <tr
                      className={`cursor-pointer transition-colors hover:bg-void-navy/50 ${
                        isExpanded ? "bg-void-navy/30" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!tableExpanded) {
                          setTableExpanded(true);
                        } else {
                          setExpandedMetric(isExpanded ? null : row.label);
                        }
                      }}
                    >
                      <td className="py-2 pr-4 text-faint-star">{row.label}</td>
                      <td className="py-2 text-starlight font-mono">
                        {row.value}
                      </td>
                      <td className={row.statusClass}>{row.status}</td>
                    </tr>
                    {isExpanded && description && (
                      <tr className="bg-void-navy/20">
                        <td colSpan={3} className="px-4 pb-3 pt-0">
                          <p className="text-xs text-faint-star leading-relaxed">
                            {description}
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Blur overlay + expand hint */}
        {!tableExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pointer-events-none"
            style={{ height: "60px" }}
          >
            <div
              className="absolute inset-0 dark:block hidden"
              style={{
                background:
                  "linear-gradient(to top, rgba(19,27,51,0.95) 0%, rgba(19,27,51,0.7) 40%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0 block dark:hidden"
              style={{
                background:
                  "linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 40%, transparent 100%)",
              }}
            />
            <span className="relative text-xs text-aurora-green/80 dark:text-aurora-green/70 mb-1 z-10">
              Click to expand
            </span>
          </div>
        )}
      </div>

      {/* Collapse button when expanded */}
      {tableExpanded && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => setTableExpanded(false)}
            className="text-xs text-faint-star hover:text-starlight transition-colors"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(TechnicalBrief);
