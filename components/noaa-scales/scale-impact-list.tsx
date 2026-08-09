// components/noaa-scales/scale-impact-list.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScaleLevel, type ScaleDefinition } from "@/config/noaa-scales";
import { Zap, AlertTriangle, Radio, Satellite, Navigation, Shield } from "lucide-react";

interface ScaleImpactListProps {
  scale: ScaleDefinition;
  currentLevel: number | null;
}

export default function ScaleImpactList({ scale, currentLevel }: ScaleImpactListProps) {
  const level = getScaleLevel(scale.type, currentLevel);

  const impacts = [
    {
      icon: AlertTriangle,
      label: "General",
      description: level.effects.general,
    },
    ...(level.effects.powerSystems
      ? [
          {
            icon: Zap,
            label: "Power Systems",
            description: level.effects.powerSystems,
          },
        ]
      : []),
    ...(level.effects.spacecraft
      ? [
          {
            icon: Satellite,
            label: "Spacecraft",
            description: level.effects.spacecraft,
          },
        ]
      : []),
    ...(level.effects.otherSystems
      ? [
          {
            icon: Radio,
            label: "Other Systems",
            description: level.effects.otherSystems,
          },
        ]
      : []),
  ];

  return (
    <Card className="border-none bg-deep-indigo">
      <CardHeader>
        <CardTitle className="text-starlight">Current System Impacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {impacts.map((impact) => {
          const Icon = impact.icon;
          return (
            <div key={impact.label} className="flex gap-3 p-3 rounded-lg bg-void-navy/50">
              <Icon size={18} className="text-aurora-green shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-medium text-starlight mb-1">
                  {impact.label}
                </h5>
                <p className="text-xs text-faint-star leading-relaxed">
                  {impact.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
