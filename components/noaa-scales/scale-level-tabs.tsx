// components/noaa-scales/scale-level-tabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScaleDefinition } from "@/config/noaa-scales";

interface ScaleLevelTabsProps {
  scale: ScaleDefinition;
  currentLevel: number | null;
}

export default function ScaleLevelTabs({ scale, currentLevel }: ScaleLevelTabsProps) {
  // Treat null as level 0 (no active storm)
  const effectiveLevel = currentLevel ?? 0;
  return (
    <Tabs defaultValue={effectiveLevel.toString()} className="w-full">
      <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full bg-deep-indigo">
        {scale.levels.map((level) => (
          <TabsTrigger
            key={level.level}
            value={level.level.toString()}
            className="data-[state=active]:bg-void-navy data-[state=active]:text-starlight"
          >
            {level.level}
          </TabsTrigger>
        ))}
      </TabsList>
      {scale.levels.map((level) => (
        <TabsContent key={level.level} value={level.level.toString()} className="mt-4">
          <Card className="border-none bg-deep-indigo">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-starlight">
                    {scale.type}{level.level} - {level.descriptor}
                  </h4>
                  <p className="text-xs text-faint-star mt-1">
                    Frequency: {level.frequency}
                  </p>
                </div>
                <Badge
                  className="border-none px-3 py-1 text-sm font-mono"
                  style={{
                    backgroundColor: level.color,
                    color: "#0B1120",
                  }}
                >
                  {level.descriptor}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-starlight mb-2">General Effects</h5>
                  <p className="text-sm text-faint-star leading-relaxed">
                    {level.effects.general}
                  </p>
                </div>

                {level.effects.powerSystems && (
                  <div>
                    <h5 className="text-sm font-medium text-starlight mb-2">Power Systems</h5>
                    <p className="text-sm text-faint-star leading-relaxed">
                      {level.effects.powerSystems}
                    </p>
                  </div>
                )}

                {level.effects.spacecraft && (
                  <div>
                    <h5 className="text-sm font-medium text-starlight mb-2">Spacecraft Operations</h5>
                    <p className="text-sm text-faint-star leading-relaxed">
                      {level.effects.spacecraft}
                    </p>
                  </div>
                )}

                {level.effects.otherSystems && (
                  <div>
                    <h5 className="text-sm font-medium text-starlight mb-2">Other Systems</h5>
                    <p className="text-sm text-faint-star leading-relaxed">
                      {level.effects.otherSystems}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
