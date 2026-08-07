// types/polar-brief.ts

export interface RoutePreset {
  id: string;
  origin: string;
  destination: string;
  label: string;
  description: string;
}

export const ROUTE_PRESETS: RoutePreset[] = [
  {
    id: "na-eu",
    origin: "North America",
    destination: "Europe",
    label: "North America → Europe",
    description:
      "Transatlantic polar route from eastern North America to Europe",
  },
  {
    id: "na-asia",
    origin: "North America",
    destination: "East Asia",
    label: "North America → East Asia",
    description: "Polar route across the Arctic to Japan, Korea, and China",
  },
  {
    id: "eu-asia",
    origin: "Europe",
    destination: "East Asia",
    label: "Europe → East Asia",
    description: "Northern polar route across Russia to East Asia",
  },
  {
    id: "aus-sa",
    origin: "Australia",
    destination: "South America",
    label: "Australia → South America",
    description: "Southern polar route across Antarctica",
  },
  {
    id: "na-me",
    origin: "North America",
    destination: "Middle East",
    label: "North America → Middle East",
    description: "Near‑polar route across the North Atlantic and Europe",
  },
];

export interface PolarRouteBrief {
  selectedRoute: RoutePreset;
  status: "OPEN" | "CONDITIONAL" | "AVOID";
  hazardType: string;
  validWindow: string | null;
  alternatives: string[];
  summary: string;
  generatedAt: string;
}
