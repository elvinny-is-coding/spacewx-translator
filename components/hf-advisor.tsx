// components/hf-advisor.tsx
"use client";

import { useState } from "react";
import type { SpaceWeatherData } from "@/types/spacewx";
import type { BandRecommendation, BandStatus } from "@/types/hf-advisory";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Loader2, Send } from "lucide-react";

interface HfAdvisorProps {
  data: SpaceWeatherData;
}

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

export default function HfAdvisor({ data }: HfAdvisorProps) {
  const [qth, setQth] = useState("");
  const [target, setTarget] = useState("");
  const [bands, setBands] = useState<BandRecommendation[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qth.trim() || !target.trim() || isLoading) return;

    setBands(null);
    setSummary(null);
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/hf-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qth: qth.trim(), target: target.trim(), data }),
      });
      if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
      const json = await res.json();
      setBands(json.bands);
      setSummary(json.summary);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Radio size={16} className="text-aurora-green" />
        <h4 className="text-sm font-semibold text-starlight">
          HF Band Propagation
        </h4>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="qth" className="text-xs text-faint-star">
            Your Location (QTH)
          </Label>
          <Input
            id="qth"
            value={qth}
            onChange={(e) => setQth(e.target.value)}
            placeholder="e.g., New York, FN30, or Maidenhead"
            disabled={isLoading}
            className="bg-void-navy border-deep-indigo text-starlight placeholder:text-faint-star focus:border-aurora-green text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="target" className="text-xs text-faint-star">
            Target Region
          </Label>
          <Input
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g., Europe, Japan, South America"
            disabled={isLoading}
            className="bg-void-navy border-deep-indigo text-starlight placeholder:text-faint-star focus:border-aurora-green text-xs"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!qth.trim() || !target.trim() || isLoading}
          className="w-full bg-aurora-green text-void-navy hover:bg-aurora-green/90"
        >
          {isLoading ? (
            <Loader2 size={14} className="mr-1 animate-spin" />
          ) : (
            <Send size={14} className="mr-1" />
          )}
          Get Band Report
        </Button>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-void-navy" />
          <Skeleton className="h-4 w-3/4 bg-void-navy" />
          <Skeleton className="h-4 w-5/6 bg-void-navy" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="text-sm text-solar-amber text-center py-2">{error}</div>
      )}

      {/* Results */}
      {!isLoading && !error && bands && bands.length > 0 && (
        <div className="space-y-2">
          {/* Summary */}
          {summary && (
            <p className="text-xs text-faint-star leading-relaxed">{summary}</p>
          )}

          {/* Band grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {bands.map((b) => (
              <div
                key={b.range}
                className={`rounded-lg border px-2 py-1.5 text-center ${statusColor(b.status)}`}
                title={b.note}
              >
                <div className="text-xs font-mono font-semibold">{b.range}</div>
                <div className="text-[10px] leading-tight">
                  {statusLabel(b.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Band details */}
          <div className="space-y-1">
            {bands.map((b) => (
              <div
                key={`detail-${b.range}`}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-faint-star font-mono">{b.range}</span>
                <span className="text-faint-star truncate ml-2">{b.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
