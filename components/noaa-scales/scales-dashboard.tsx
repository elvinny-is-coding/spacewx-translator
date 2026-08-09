// components/noaa-scales/scales-dashboard.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScaleCard from "./scale-card";
import ScaleLevelTabs from "./scale-level-tabs";
import ScaleImpactList from "./scale-impact-list";
import { NOAA_SCALES } from "@/config/noaa-scales";
import { Zap, Radio, Shield } from "lucide-react";
import type { SpaceWeatherData } from "@/types/spacewx";

interface ScalesDashboardProps {
  data: SpaceWeatherData;
}

const SCALE_ICONS = {
  G: Zap,
  R: Radio,
  S: Shield,
};

export default function ScalesDashboard({ data }: ScalesDashboardProps) {
  const [activeScale, setActiveScale] = useState<"G" | "R" | "S">("G");

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScaleCard
          scale={NOAA_SCALES.G}
          currentLevel={data.noaaScaleG}
          icon={SCALE_ICONS.G}
        />
        <ScaleCard
          scale={NOAA_SCALES.R}
          currentLevel={data.noaaScaleR}
          icon={SCALE_ICONS.R}
        />
        <ScaleCard
          scale={NOAA_SCALES.S}
          currentLevel={data.noaaScaleS}
          icon={SCALE_ICONS.S}
        />
      </div>

      {/* Detailed Scale Information */}
      <Tabs
        value={activeScale}
        onValueChange={(value) => setActiveScale(value as "G" | "R" | "S")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full bg-deep-indigo max-w-md mx-auto">
          <TabsTrigger
            value="G"
            className="data-[state=active]:bg-void-navy data-[state=active]:text-starlight"
          >
            G-Scale
          </TabsTrigger>
          <TabsTrigger
            value="R"
            className="data-[state=active]:bg-void-navy data-[state=active]:text-starlight"
          >
            R-Scale
          </TabsTrigger>
          <TabsTrigger
            value="S"
            className="data-[state=active]:bg-void-navy data-[state=active]:text-starlight"
          >
            S-Scale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="G" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScaleLevelTabs
              scale={NOAA_SCALES.G}
              currentLevel={data.noaaScaleG}
            />
            <ScaleImpactList
              scale={NOAA_SCALES.G}
              currentLevel={data.noaaScaleG}
            />
          </div>
        </TabsContent>

        <TabsContent value="R" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScaleLevelTabs
              scale={NOAA_SCALES.R}
              currentLevel={data.noaaScaleR}
            />
            <ScaleImpactList
              scale={NOAA_SCALES.R}
              currentLevel={data.noaaScaleR}
            />
          </div>
        </TabsContent>

        <TabsContent value="S" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScaleLevelTabs
              scale={NOAA_SCALES.S}
              currentLevel={data.noaaScaleS}
            />
            <ScaleImpactList
              scale={NOAA_SCALES.S}
              currentLevel={data.noaaScaleS}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
