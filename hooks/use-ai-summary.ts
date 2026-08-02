"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { Audience } from "@/types/audience";

interface SummaryState {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAiSummary(
  data: SpaceWeatherData | null,
  audience: Audience,
) {
  const [state, setState] = useState<SummaryState>({
    summary: null,
    isLoading: false,
    error: null,
  });
  const [requestVersion, setRequestVersion] = useState(0);

  const currentAudienceRef = useRef(audience);

  const retry = useCallback(() => {
    setRequestVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!data) return;

    currentAudienceRef.current = audience;

    let cancelled = false;

    async function fetchSummary() {
      setState({ summary: null, isLoading: true, error: null });

      try {
        const res = await fetch("/api/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, audience }),
        });

        if (!res.ok) {
          throw new Error(`Failed to generate summary (HTTP ${res.status})`);
        }

        const json = await res.json();

        if (!cancelled && currentAudienceRef.current === audience) {
          setState({ summary: json.summary, isLoading: false, error: null });
        }
      } catch (err: unknown) {
        if (!cancelled && currentAudienceRef.current === audience) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setState({ summary: null, isLoading: false, error: message });
        }
      }
    }

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [data, audience, requestVersion]);

  return { ...state, retry };
}
