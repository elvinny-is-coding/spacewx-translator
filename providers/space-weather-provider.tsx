// providers/space-weather-provider.tsx
"use client";

import { createContext, useContext } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";

const SpaceWeatherContext = createContext<SpaceWeatherData | null>(null);

export function SpaceWeatherProvider({
  data,
  children,
}: {
  data: SpaceWeatherData;
  children: React.ReactNode;
}) {
  return (
    <SpaceWeatherContext.Provider value={data}>
      {children}
    </SpaceWeatherContext.Provider>
  );
}

export function useSpaceWeather() {
  const ctx = useContext(SpaceWeatherContext);
  if (!ctx)
    throw new Error("useSpaceWeather must be used within SpaceWeatherProvider");
  return ctx;
}
