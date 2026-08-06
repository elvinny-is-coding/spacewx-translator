// components/technical-brief.tsx
"use client";

import { memo } from "react";
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

function TechnicalBrief({ data }: TechnicalBriefProps) {
  const windCategory = getSolarWindCategory(data.solarWind?.speed ?? null);
  const bzCategory = getBzCategory(data.solarWind?.bz ?? null);
  const gScaleDisplay =
    data.noaaScaleG !== null ? `G${data.noaaScaleG}` : kpToGScale(data.kp);

  return (
    <div className="overflow-x-auto">
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
          <tr>
            <td className="py-2 pr-4 text-faint-star">Kp Index</td>
            <td className="py-2 text-starlight font-mono">
              {data.kp !== null ? data.kp.toFixed(1) : "—"}
            </td>
            <td className="py-2 text-starlight font-mono">
              {data.kp !== null
                ? data.kp < 4
                  ? "Quiet"
                  : data.kp < 5
                    ? "Unsettled"
                    : data.kp < 7
                      ? "Minor Storm"
                      : "Major Storm"
                : "—"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">G‑scale (Geomagnetic)</td>
            <td className="py-2 text-starlight font-mono">{gScaleDisplay}</td>
            <td className="py-2 text-starlight">
              {data.noaaScaleG !== null && data.noaaScaleG >= 1
                ? "Active"
                : data.kp !== null && data.kp >= 5
                  ? "Active"
                  : "Quiet"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">
              R‑scale (Radio Blackout)
            </td>
            <td className="py-2 text-starlight font-mono">
              {data.noaaScaleR !== null ? `R${data.noaaScaleR}` : "—"}
            </td>
            <td
              className={`py-2 font-mono ${
                data.noaaScaleR && data.noaaScaleR >= 1
                  ? "text-solar-amber"
                  : "text-aurora-green"
              }`}
            >
              {data.noaaScaleR && data.noaaScaleR >= 1 ? "Active" : "None"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">S‑scale (Radiation)</td>
            <td className="py-2 text-starlight font-mono">
              {data.noaaScaleS !== null ? `S${data.noaaScaleS}` : "—"}
            </td>
            <td
              className={`py-2 font-mono ${
                data.noaaScaleS && data.noaaScaleS >= 1
                  ? "text-solar-amber"
                  : "text-aurora-green"
              }`}
            >
              {data.noaaScaleS && data.noaaScaleS >= 1 ? "Active" : "None"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Solar Wind Speed</td>
            <td className="py-2 text-starlight font-mono">
              {data.solarWind?.speed != null
                ? `${data.solarWind.speed} km/s`
                : "—"}
            </td>
            <td className={`py-2 font-mono ${windCategory.color}`}>
              {windCategory.label}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Solar Wind Bz</td>
            <td className="py-2 text-starlight font-mono">
              {data.solarWind?.bz != null
                ? `${data.solarWind.bz.toFixed(1)} nT`
                : "—"}
            </td>
            <td className={`py-2 font-mono ${bzCategory.color}`}>
              {bzCategory.label}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Notable Flares (24h)</td>
            <td className="py-2 text-starlight">{notableFlareList(data)}</td>
            <td className="py-2 text-starlight">
              {data.flares.filter((f) => f.classType.startsWith("X")).length > 0
                ? "Critical"
                : data.flares.filter((f) => f.classType.startsWith("M"))
                      .length > 0
                  ? "Elevated"
                  : "Normal"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Background Flares</td>
            <td className="py-2 text-starlight font-mono">
              {
                data.flares.filter((f) => {
                  const c = classifyFlare(f.classType);
                  return !c || !c.isNotable;
                }).length
              }
            </td>
            <td className="py-2 text-faint-star">—</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Radiation Storm</td>
            <td className="py-2 text-starlight font-mono">
              {hasProtonStorm(data.alerts) ? "Active" : "None"}
            </td>
            <td
              className={`py-2 font-mono ${
                hasProtonStorm(data.alerts)
                  ? "text-solar-amber"
                  : "text-aurora-green"
              }`}
            >
              {hasProtonStorm(data.alerts) ? "Monitor" : "Normal"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Active Alerts</td>
            <td className="py-2 text-starlight font-mono">
              {data.alerts.length}
            </td>
            <td
              className={`py-2 font-mono ${
                data.alerts.length > 5
                  ? "text-solar-amber"
                  : "text-aurora-green"
              }`}
            >
              {data.alerts.length > 5 ? "Elevated" : "Normal"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default memo(TechnicalBrief);
