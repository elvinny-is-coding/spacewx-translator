// components/technical-brief.tsx
"use client";

import type { SpaceWeatherData } from "@/types/spacewx";

interface TechnicalBriefProps {
  data: SpaceWeatherData;
}

function notableFlareList(data: SpaceWeatherData): string {
  if (!data.flares.length) return "None";
  const notable = data.flares
    .filter((f) => {
      const match = f.classType.match(/^([CXM])(\d+\.?\d*)$/i);
      if (!match) return false;
      const letter = match[1].toUpperCase();
      const number = parseFloat(match[2]);
      return letter === "X" || (letter === "M" && number >= 5);
    })
    .map((f) => f.classType);
  return notable.length > 0 ? notable.join(", ") : "None (background only)";
}

function hasProtonStorm(alerts: SpaceWeatherData["alerts"]): boolean {
  return alerts.some((a) => a.message.toLowerCase().includes("proton"));
}

export default function TechnicalBrief({ data }: TechnicalBriefProps) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-deep-indigo">
          <tr>
            <td className="py-2 pr-4 text-faint-star">Kp Index</td>
            <td className="py-2 text-starlight font-mono">
              {data.kp !== null ? data.kp.toFixed(1) : "—"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">G‑scale (Geomagnetic)</td>
            <td className="py-2 text-starlight font-mono">
              {data.noaaScaleG !== null ? `G${data.noaaScaleG}` : "—"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Solar Wind Speed</td>
            <td className="py-2 text-starlight font-mono">
              {data.solarWind?.speed != null
                ? `${data.solarWind.speed} km/s`
                : "—"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Solar Wind Bz</td>
            <td className="py-2 text-starlight font-mono">
              {data.solarWind?.bz != null
                ? `${data.solarWind.bz.toFixed(1)} nT`
                : "—"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Notable Flares (24h)</td>
            <td className="py-2 text-starlight">{notableFlareList(data)}</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Background Flares</td>
            <td className="py-2 text-starlight font-mono">
              {
                data.flares.filter((f) => {
                  const match = f.classType.match(/^([CXM])(\d+\.?\d*)$/i);
                  if (!match) return true; // unclassified counts as background
                  const letter = match[1].toUpperCase();
                  const number = parseFloat(match[2]);
                  return !(letter === "X" || (letter === "M" && number >= 5));
                }).length
              }
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Radiation Storm</td>
            <td className="py-2 text-starlight font-mono">
              {hasProtonStorm(data.alerts) ? "Active" : "None"}
            </td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-faint-star">Active Alerts</td>
            <td className="py-2 text-starlight font-mono">
              {data.alerts.length}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
