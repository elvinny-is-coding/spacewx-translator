// components/hf-advisor.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { BandRecommendation, BandStatus } from "@/types/hf-advisory";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { computeDeterministicBands } from "@/lib/spacewx/hf-deterministic";
import { Radio, Loader2, HelpCircle, ArrowRight, Info } from "lucide-react";

interface HfAdvisorProps {
  data: SpaceWeatherData;
}

const REGIONS = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Middle East",
  "Central Asia",
  "East Asia / Pacific",
  "Southeast Asia",
  "Oceania",
  "North Atlantic",
  "South Atlantic",
  "Indian Ocean",
];

const CACHE_TTL_MS = 15 * 60 * 1000;
const DEBOUNCE_MS = 600;

function statusColor(status: BandStatus): string {
  switch (status) {
    case "good":
      return "bg-aurora-green/20 text-aurora-green border-aurora-green/30";
    case "fair":
      return "bg-solar-amber/20 text-solar-amber border-solar-amber/30";
    case "poor":
      return "bg-solar-amber/30 text-solar-amber border-solar-amber/50";
    case "blackout":
      return "bg-red-600/20 text-red-400 border-red-600/30";
    default:
      return "bg-faint-star/20 text-faint-star border-faint-star/30";
  }
}

function statusLabel(status: BandStatus): string {
  switch (status) {
    case "good":
      return "Good";
    case "fair":
      return "Fair";
    case "poor":
      return "Poor";
    case "blackout":
      return "Blackout";
    default:
      return "Unknown";
  }
}

function getCacheKey(qth: string, target: string): string {
  return `hf-advisor-${qth}-${target}`;
}

interface CacheEntry {
  bands: BandRecommendation[];
  summary: string;
  timestamp: number;
}

function loadFromCache(qth: string, target: string): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(getCacheKey(qth, target));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(getCacheKey(qth, target));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function saveToCache(
  qth: string,
  target: string,
  bands: BandRecommendation[],
  summary: string,
) {
  try {
    sessionStorage.setItem(
      getCacheKey(qth, target),
      JSON.stringify({ bands, summary, timestamp: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export default function HfAdvisor({ data }: HfAdvisorProps) {
  const [qth, setQth] = useState("Southeast Asia");
  const [target, setTarget] = useState("North America");
  const [bands, setBands] = useState<BandRecommendation[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBandData = useCallback(
    async (signal: AbortSignal, currentQth: string, currentTarget: string) => {
      setError(null);
      setIsLoading(true);
      setIsDebouncing(false);

      try {
        const res = await fetch("/api/hf-advisory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qth: currentQth,
            target: currentTarget,
            data,
          }),
          signal,
        });

        if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
        const json = await res.json();
        setBands(json.bands);
        setSummary(json.summary);
        saveToCache(currentQth, currentTarget, json.bands, json.summary || "");
      } catch {
        if (signal.aborted) return;

        const rScale = data.noaaScaleR ?? 0;
        const kp = data.kp ?? 0;
        const fallback = computeDeterministicBands(rScale, kp);
        setBands(fallback);
        setSummary(
          "AI advisory unavailable — showing rule‑based estimates from NOAA scales.",
        );
        setError(null);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [data],
  );

  useEffect(() => {
    const cached = loadFromCache(qth, target);
    if (cached) {
      setBands(cached.bands);
      setSummary(cached.summary);
    } else {
      setBands(null);
      setSummary(null);
    }
  }, [qth, target]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsDebouncing(true);

    debounceRef.current = setTimeout(() => {
      abortControllerRef.current = new AbortController();
      fetchBandData(abortControllerRef.current.signal, qth, target);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [qth, target, fetchBandData]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-aurora-green" />
            <h4 className="text-base font-semibold text-starlight">
              HF Band Propagation
            </h4>
          </div>
          <p className="text-sm text-faint-star leading-relaxed">
            Select your region and a target region. The tool evaluates current
            NOAA R‑scale and Kp conditions and shows band‑by‑band propagation
            quality from 10 m to 160 m. Results update automatically.
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="qth"
                className="text-sm text-faint-star font-medium"
              >
                Your Region
              </Label>
              <Select
                value={qth}
                onValueChange={(value) => setQth(value ?? "")}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="qth"
                  className="bg-void-navy border-deep-indigo text-starlight text-sm h-10"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-indigo border-void-navy text-starlight">
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="target"
                className="text-sm text-faint-star font-medium"
              >
                Target Region
              </Label>
              <Select
                value={target}
                onValueChange={(value) => setTarget(value ?? "")}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="target"
                  className="bg-void-navy border-deep-indigo text-starlight text-sm h-10"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-indigo border-void-navy text-starlight">
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(isDebouncing || isLoading) && (
            <div className="flex items-center gap-2 text-xs text-faint-star py-2">
              <Loader2 size={14} className="animate-spin" />
              <span>
                {isDebouncing
                  ? "Updating..."
                  : "Analyzing propagation conditions..."}
              </span>
            </div>
          )}

          {!isLoading && error && (
            <div className="text-sm text-solar-amber text-center py-2">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isDebouncing && !error && !bands && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <Radio size={40} className="text-faint-star/30" />
              <p className="text-sm text-faint-star max-w-[300px] leading-relaxed">
                Select your regions above to see current HF propagation
                conditions.
              </p>
            </div>
          )}

          {!isLoading &&
            !isDebouncing &&
            !error &&
            bands &&
            bands.length > 0 && (
              <div className="space-y-4">
                {/* Route display */}
                <div className="flex items-center gap-2 px-3 py-2 bg-void-navy/30 rounded-lg border border-deep-indigo/50">
                  <span className="text-sm font-medium text-starlight">
                    {qth}
                  </span>
                  <ArrowRight size={16} className="text-faint-star" />
                  <span className="text-sm font-medium text-starlight">
                    {target}
                  </span>
                </div>

                {/* Summary */}
                {summary && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-aurora-green/10 rounded-lg border border-aurora-green/20">
                    <Info
                      size={16}
                      className="text-aurora-green mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-faint-star leading-relaxed">
                      {summary}
                    </p>
                  </div>
                )}

                {/* Individual band cards */}
                <div className="space-y-2">
                  {bands.map((b) => (
                    <div
                      key={b.range}
                      className={`rounded-lg border p-4 transition-all hover:shadow-lg ${statusColor(b.status)}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-starlight">
                            {b.range}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(b.status)}`}
                          >
                            {statusLabel(b.status)}
                          </span>
                        </div>
                        {b.driver && (
                          <Tooltip>
                            <TooltipTrigger className="text-faint-star/60 hover:text-faint-star transition-colors">
                              <HelpCircle size={14} />
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-deep-indigo border-void-navy text-starlight text-xs p-3 max-w-xs"
                            >
                              <div className="font-semibold mb-1">Driver</div>
                              {b.driver}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-sm text-faint-star leading-relaxed">
                        {b.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </TooltipProvider>
  );
}
