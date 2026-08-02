"use client";

import { useState, useEffect, useRef } from "react";
import type { OvationGrid } from "@/types/ovation";
import { reshapeOvationGrid } from "@/lib/aurora-utils";

const OVATION_URL =
  "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In‑memory cache shared across all instances on the same page
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
    // If cache is still valid, use it
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
        const res = await fetch(OVATION_URL, {
          signal: abortRef.current?.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch OVATION data (HTTP ${res.status})`);
        }

        const json = await res.json();

        if (!json.coordinates || !Array.isArray(json.coordinates)) {
          throw new Error("Invalid OVATION data format");
        }

        const reshaped = reshapeOvationGrid(json);

        if (!cancelled) {
          cachedGrid = reshaped;
          lastFetchTime = Date.now();
          setGrid(reshaped);
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
