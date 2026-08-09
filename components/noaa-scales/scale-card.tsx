// components/noaa-scales/scale-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScaleColor, getScaleDescriptor, type ScaleDefinition } from "@/config/noaa-scales";

interface ScaleCardProps {
  scale: ScaleDefinition;
  currentLevel: number | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function ScaleCard({ scale, currentLevel, icon: Icon }: ScaleCardProps) {
  const color = getScaleColor(scale.type, currentLevel);
  const descriptor = getScaleDescriptor(scale.type, currentLevel);
  const effectiveLevel = currentLevel ?? 0;

  return (
    <Card className="border-none bg-deep-indigo">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-starlight">
            <Icon size={20} className="text-aurora-green" />
            {scale.name}
          </CardTitle>
          <Badge
            className="border-none px-3 py-1 text-sm font-mono"
            style={{
              backgroundColor: color,
              color: "#0B1120",
            }}
          >
            {`${scale.type}${effectiveLevel}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-faint-star">Current Status</span>
          <span
            className="text-sm font-medium"
            style={{ color }}
          >
            {descriptor}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-faint-star">Physical Measure</span>
          <span className="text-sm text-starlight">{scale.physicalMeasure}</span>
        </div>
        <p className="text-xs text-faint-star leading-relaxed">
          {scale.description}
        </p>
      </CardContent>
    </Card>
  );
}
