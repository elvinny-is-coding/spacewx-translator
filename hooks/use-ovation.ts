"use client";

import { useState, useEffect, useRef } from "react";
import type { OvationGrid } from "@/types/ovation";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedGrid: OvationGrid | null = null;
let lastFetchTime = 0;

interface UseOvationReturn {
  grid: OvationGrid | null;
  isLoading: boolean;
  error: string | null;
}

export function useOvation(): UseOvationReturn {
  const [grid, setGrid] = useState<OvationGrid | null>(cachedGrid);
  const [isLoading, setIsLoading] = useState(!cachedGrid);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (cachedGrid && Date.now() - lastFetchTime < CACHE_TTL_MS) {
      setGrid(cachedGrid);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    abortRef.current = new AbortController();

    async function fetchOvation() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ovation", {
          signal: abortRef.current?.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch OVATION data (HTTP ${res.status})`);
        }

        const json = await res.json();

        if (!json.grid || !Array.isArray(json.grid)) {
          throw new Error("Invalid OVATION data format");
        }

        const ovationGrid: OvationGrid = {
          cols: 360,
          rows: 181,
          grid: json.grid,
          forecastTime: json.forecastTime ?? "",
        };

        if (!cancelled) {
          cachedGrid = ovationGrid;
          lastFetchTime = Date.now();
          setGrid(ovationGrid);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
          setIsLoading(false);
        }
      }
    }

    fetchOvation();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  return { grid, isLoading, error };
}
