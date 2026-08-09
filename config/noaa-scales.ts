// NOAA Space Weather Scales Configuration
// Based on https://www.spaceweather.gov/noaa-space-weather-scales

export interface ScaleLevel {
  level: number;
  descriptor: string;
  color: string;
  frequency: string;
  effects: {
    general: string;
    powerSystems?: string;
    spacecraft?: string;
    otherSystems?: string;
  };
}

export interface ScaleDefinition {
  type: "G" | "R" | "S";
  name: string;
  description: string;
  physicalMeasure: string;
  levels: ScaleLevel[];
}

export const NOAA_SCALES: Record<"G" | "R" | "S", ScaleDefinition> = {
  G: {
    type: "G",
    name: "Geomagnetic Storm",
    description: "Disturbances in Earth's magnetic field caused by solar wind shocks",
    physicalMeasure: "Kp index",
    levels: [
      {
        level: 0,
        descriptor: "Normal",
        color: "#3ecf8e", // aurora-green
        frequency: "—",
        effects: {
          general: "No significant geomagnetic activity",
        },
      },
      {
        level: 1,
        descriptor: "Minor",
        color: "#b18cff", // aurora-violet
        frequency: "1700 per cycle",
        effects: {
          general: "Minor power grid fluctuations, minor impact on satellite operations",
          powerSystems: "Weak power grid fluctuations can occur",
          spacecraft: "Minor impact on satellite operations possible",
          otherSystems: "Migratory animals are affected at this and higher levels",
        },
      },
      {
        level: 2,
        descriptor: "Moderate",
        color: "#f59e0b", // solar-amber
        frequency: "600 per cycle",
        effects: {
          general: "Power systems at high-latitude may experience voltage alarms, satellite drag may increase",
          powerSystems: "High-latitude power systems may experience voltage alarms, long-duration storms may cause transformer damage",
          spacecraft: "Corrective actions to orientation may be required by drag, changes in drag affect orbit predictions",
          otherSystems: "HF radio propagation can fade at higher latitudes, aurora may be seen as low as New York and Idaho",
        },
      },
      {
        level: 3,
        descriptor: "Strong",
        color: "#f59e0b", // solar-amber
        frequency: "200 per cycle",
        effects: {
          general: "Voltage corrections required, false alarms triggered on protection devices, surface charging on satellites",
          powerSystems: "Voltage corrections may be required, false alarms triggered on some protection devices",
          spacecraft: "Surface charging may occur on satellite components, drag may increase on low-Earth-orbit satellites, corrections may be needed for orientation problems",
          otherSystems: "Intermittent satellite navigation and low-frequency radio navigation problems may occur, HF radio may be intermittent, aurora has been seen as low as Illinois and Oregon",
        },
      },
      {
        level: 4,
        descriptor: "Severe",
        color: "#dc2626", // red-500
        frequency: "100 per cycle",
        effects: {
          general: "Possible widespread voltage control problems, protective systems can mistakenly trip out key assets, surface charging and orientation problems",
          powerSystems: "Possible widespread voltage control problems and some protective systems will mistakenly trip out key assets from the power grid",
          spacecraft: "Surface charging and orientation problems may occur, increased drag on satellites may need corrections",
          otherSystems: "Induced currents cause electrical grid fluctuations, satellite navigation degraded for hours, HF radio may be impossible, aurora may be seen as low as Florida and southern Texas",
        },
      },
      {
        level: 5,
        descriptor: "Extreme",
        color: "#dc2626", // red-500
        frequency: "4 per cycle",
        effects: {
          general: "Widespread voltage control problems and protective system problems, pipeline currents can reach hundreds of amps, HF radio may be impossible",
          powerSystems: "Widespread voltage control problems and protective system problems can occur, some grid systems may experience complete collapse or blackouts",
          spacecraft: "Surface charging and orientation problems can occur, increased drag on satellites may need corrections, some satellites may be rendered useless",
          otherSystems: "Pipeline currents can reach hundreds of amps, HF radio propagation may be impossible in many areas for one to two days, satellite navigation may be degraded for days, low-frequency radio navigation can be out for hours, aurora has been seen as low as the equator",
        },
      },
    ],
  },
  R: {
    type: "R",
    name: "Radio Blackout",
    description: "Disturbances of the ionosphere caused by X-ray emissions from the Sun",
    physicalMeasure: "GOES X-ray peak flux (W/m²)",
    levels: [
      {
        level: 0,
        descriptor: "None",
        color: "#3ecf8e", // aurora-green
        frequency: "—",
        effects: {
          general: "No X-ray flares or background levels only",
        },
      },
      {
        level: 1,
        descriptor: "Minor",
        color: "#b18cff", // aurora-violet
        frequency: "2000 per cycle",
        effects: {
          general: "Minor degradation of HF radio communication on the sunlit side, occasional loss of radio contact",
          otherSystems: "Minor degradation of HF radio communication on the sunlit side, occasional loss of radio contact for mariners and en route aviators, low-frequency navigation signals degraded for brief intervals",
        },
      },
      {
        level: 2,
        descriptor: "Moderate",
        color: "#f59e0b", // solar-amber
        frequency: "350 per cycle",
        effects: {
          general: "Limited blackout of HF radio communication on the sunlit side, loss of radio contact for tens of minutes",
          otherSystems: "Limited blackout of HF radio communication signals on the sunlit side, loss of radio contact for mariners and en route aviators for tens of minutes, low-frequency navigation signals degraded for about an hour",
        },
      },
      {
        level: 3,
        descriptor: "Strong",
        color: "#f59e0b", // solar-amber
        frequency: "175 per cycle",
        effects: {
          general: "Wide area blackout of HF radio communication on the sunlit side, loss of radio contact for about an hour",
          otherSystems: "Wide area blackout of HF radio communication signals on the sunlit side, loss of radio contact for mariners and en route aviators for about an hour, low-frequency navigation signals degraded for about an hour",
        },
      },
      {
        level: 4,
        descriptor: "Severe",
        color: "#dc2626", // red-500
        frequency: "8 per cycle",
        effects: {
          general: "HF radio communication blackout on most of the sunlit side, loss of radio contact for one to two hours",
          otherSystems: "HF radio communication blackout on most of the sunlit side of Earth for one to two hours, HF radio contact lost during this time, low-frequency navigation signals experience outages on the sunlit side for one to two hours, minor disruption of satellite navigation possible on the sunlit side",
        },
      },
      {
        level: 5,
        descriptor: "Extreme",
        color: "#dc2626", // red-500
        frequency: "Fewer than 1 per cycle",
        effects: {
          general: "Complete HF radio blackout on the entire sunlit side, lasting for a number of hours, no HF radio contact with mariners and aviators",
          otherSystems: "Complete HF radio blackout on the entire sunlit side of Earth lasting for a number of hours, no HF radio contact with mariners and en route aviators in this sector, low-frequency navigation signals used by maritime and general aviation systems experience outages on the sunlit side for many hours, loss in positioning, increased satellite navigation errors for several hours on the sunlit side",
        },
      },
    ],
  },
  S: {
    type: "S",
    name: "Solar Radiation Storm",
    description: "Elevated levels of energetic protons that can damage satellites and pose radiation hazards",
    physicalMeasure: "≥10 MeV proton flux (pfu)",
    levels: [
      {
        level: 0,
        descriptor: "None",
        color: "#3ecf8e", // aurora-green
        frequency: "—",
        effects: {
          general: "No significant solar radiation",
        },
      },
      {
        level: 1,
        descriptor: "Minor",
        color: "#b18cff", // aurora-violet
        frequency: "50 per cycle",
        effects: {
          general: "Minor radiation hazard, possible minor impacts on satellite operations",
          otherSystems: "Minor impacts on HF radio in the polar regions, minor impacts on satellite operations possible",
        },
      },
      {
        level: 2,
        descriptor: "Moderate",
        color: "#f59e0b", // solar-amber
        frequency: "25 per cycle",
        effects: {
          general: "Radiation hazard for astronauts, possible satellite memory upsets",
          otherSystems: "Biological hazard for astronauts on EVA, passengers and crew in high-flying aircraft at high latitudes, single-event upsets possible in satellite electronics, minor effects on HF radio in the polar regions",
        },
      },
      {
        level: 3,
        descriptor: "Strong",
        color: "#f59e0b", // solar-amber
        frequency: "10 per cycle",
        effects: {
          general: "Radiation hazard for astronauts, increased satellite memory upsets, possible satellite sensor noise",
          otherSystems: "Biological hazard for astronauts on EVA, passengers and crew in high-flying aircraft at high latitudes, single-event upsets, noise in imaging systems, slight reduction in solar panel efficiency possible, HF radio degraded in polar regions",
        },
      },
      {
        level: 4,
        descriptor: "Severe",
        color: "#dc2626", // red-500
        frequency: "3 per cycle",
        effects: {
          general: "Unavoidable radiation hazard to astronauts, significant satellite memory upsets, satellite sensor damage possible",
          otherSystems: "Unavoidable radiation hazard to astronauts on EVA, passengers and crew in high-flying aircraft at high latitudes may be exposed to radiation risk, single-event upsets, noise in imaging systems, permanent damage to exposed solar panels, complete loss of some satellite functions possible, HF radio blackout in polar regions",
        },
      },
      {
        level: 5,
        descriptor: "Extreme",
        color: "#dc2626", // red-500
        frequency: "Fewer than 1 per cycle",
        effects: {
          general: "Unavoidable high radiation hazard to astronauts, significant satellite damage, complete satellite failure possible",
          otherSystems: "Unavoidable high radiation hazard to astronauts on EVA, passengers and crew in high-flying aircraft at high latitudes may be exposed to radiation risk, high radiation levels even at aircraft altitudes, single-event upsets, noise in imaging systems, permanent damage to exposed solar panels, complete loss of some satellite functions possible, HF radio blackout in polar regions, critical systems on satellites may experience memory upsets and computer problems",
        },
      },
    ],
  },
};

export function getScaleLevel(
  type: "G" | "R" | "S",
  level: number | null
): ScaleLevel {
  const effectiveLevel = level ?? 0;
  const scale = NOAA_SCALES[type];
  return scale.levels.find((l) => l.level === effectiveLevel) || scale.levels[0];
}

export function getScaleColor(type: "G" | "R" | "S", level: number | null): string {
  const scaleLevel = getScaleLevel(type, level);
  return scaleLevel.color;
}

export function getScaleDescriptor(
  type: "G" | "R" | "S",
  level: number | null
): string {
  const scaleLevel = getScaleLevel(type, level);
  return scaleLevel.descriptor;
}
