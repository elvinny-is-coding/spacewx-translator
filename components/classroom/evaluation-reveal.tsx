// components/classroom/evaluation-reveal.tsx
"use client";

import { useState, useEffect } from "react";
import type {
  MissionRole,
  ScenarioFixture,
  Evaluation,
} from "@/types/classroom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  BookOpen,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface EvaluationRevealProps {
  role: MissionRole;
  scenario: ScenarioFixture;
  studentChoice: string;
  onReset: () => void;
}

export default function EvaluationReveal({
  role,
  scenario,
  studentChoice,
  onReset,
}: EvaluationRevealProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvaluation() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/classroom/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            scenarioId: scenario.id,
            choice: studentChoice,
          }),
        });

        if (!res.ok) throw new Error(`Failed (HTTP ${res.status})`);
        const json = await res.json();
        if (!cancelled) {
          setEvaluation(json.evaluation);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Unknown error");
          setIsLoading(false);
        }
      }
    }

    fetchEvaluation();
    return () => {
      cancelled = true;
    };
  }, [role, scenario, studentChoice]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 size={32} className="animate-spin text-aurora-green" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4 bg-void-navy" />
          <Skeleton className="h-4 w-1/2 bg-void-navy" />
          <Skeleton className="h-20 w-full bg-void-navy" />
        </div>
        <p className="text-sm text-faint-star text-center">
          Kairo is evaluating your decision…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-center py-6">
        <p className="text-sm text-solar-amber">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-deep-indigo text-faint-star hover:text-starlight"
        >
          <RefreshCw size={14} className="mr-1" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!evaluation) return null;

  const isMatch = evaluation.match;
  const verdictColors = {
    GO: "border-aurora-green/30 bg-aurora-green/5",
    "CONDITIONAL GO": "border-solar-amber/30 bg-solar-amber/5",
    "NO GO": "border-red-600/30 bg-red-600/5",
  };

  const verdictColor =
    verdictColors[
      evaluation.deterministicVerdict as keyof typeof verdictColors
    ] || "border-deep-indigo bg-void-navy/30";

  return (
    <div className="space-y-6">
      {/* Result header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {isMatch ? (
            <CheckCircle size={28} className="text-aurora-green" />
          ) : (
            <AlertTriangle size={28} className="text-solar-amber" />
          )}
          <h3 className="font-display text-xl text-starlight">
            {isMatch ? "Your Decision Matches" : "Your Decision Differs"}
          </h3>
        </div>
        <p className="text-sm text-faint-star">
          Kairo has evaluated your choice against the deterministic operational
          recommendation.
        </p>
      </div>

      {/* Side‑by‑side comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Student choice */}
        <Card className="border-deep-indigo bg-void-navy/30">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-faint-star uppercase tracking-wider">
              Your Choice
            </p>
            <p className="text-sm font-medium text-starlight">
              {studentChoice}
            </p>
            <p className="text-xs text-faint-star">As {role}</p>
          </CardContent>
        </Card>

        {/* Deterministic verdict */}
        <Card className={verdictColor}>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-faint-star uppercase tracking-wider">
              Operational Recommendation
            </p>
            <p className="text-sm font-medium text-starlight">
              {evaluation.deterministicVerdict}
            </p>
            <p className="text-xs text-faint-star">
              Based on NOAA scale analysis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI evaluation narrative */}
      <Card className="border-none bg-deep-indigo">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-aurora-green" />
            <h4 className="text-sm font-semibold text-starlight">
              Kairo's Analysis
            </h4>
          </div>
          <p className="text-sm text-faint-star leading-relaxed">
            {evaluation.narrative}
          </p>
        </CardContent>
      </Card>

      {/* Historical outcome (if available) */}
      {evaluation.historicalOutcome && (
        <Card className="border-deep-indigo bg-void-navy/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-aurora-green" />
              <h4 className="text-sm font-semibold text-starlight">
                What Actually Happened
              </h4>
            </div>
            <p className="text-sm text-faint-star leading-relaxed">
              {evaluation.historicalOutcome}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reset button */}
      <div className="flex justify-center">
        <Button
          onClick={onReset}
          className="bg-aurora-green text-void-navy hover:bg-aurora-green/90"
        >
          <RefreshCw size={14} className="mr-1" />
          Try Another Scenario
        </Button>
      </div>
    </div>
  );
}
