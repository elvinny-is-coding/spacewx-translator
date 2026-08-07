// app/classroom/page.tsx
"use client";

import { useState, useCallback } from "react";
import type { MissionRole, ScenarioFixture } from "@/types/classroom";
import RolePicker from "@/components/classroom/role-picker";
import ScenarioPicker from "@/components/classroom/scenario-picker";
import MissionBriefing from "@/components/classroom/mission-briefing";
import DecisionPanel from "@/components/classroom/decision-panel";
import EvaluationReveal from "@/components/classroom/evaluation-reveal";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "role" | "scenario" | "briefing" | "decision" | "evaluation";

export default function ClassroomPage() {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<MissionRole | null>(null);
  const [scenario, setScenario] = useState<ScenarioFixture | null>(null);
  const [choice, setChoice] = useState<string | null>(null);

  const handleRoleSelected = useCallback((r: MissionRole) => {
    setRole(r);
    setStep("scenario");
  }, []);

  const handleScenarioSelected = useCallback((s: ScenarioFixture) => {
    setScenario(s);
    setChoice(null);
    setStep("briefing");
  }, []);

  const handleDecision = useCallback((c: string) => {
    setChoice(c);
    setStep("evaluation");
  }, []);

  const handleReset = useCallback(() => {
    setStep("role");
    setRole(null);
    setScenario(null);
    setChoice(null);
  }, []);

  const handleBack = useCallback(() => {
    if (step === "scenario") {
      setStep("role");
      setRole(null);
    } else if (step === "briefing") {
      setStep("scenario");
      setScenario(null);
    } else if (step === "decision") {
      setStep("briefing");
      setChoice(null);
    }
  }, [step]);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page header — only on the role step */}
      {step === "role" && (
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-starlight">
            Mission Control Classroom
          </h2>
          <p className="text-sm text-faint-star">
            Step into an operational role, review real space weather data, and
            make a go/no‑go decision. Kairo will evaluate your choice and
            explain the reasoning.
          </p>
        </div>
      )}

      {/* Back button — not on the first or last step */}
      {step !== "role" && step !== "evaluation" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-faint-star hover:text-starlight"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back
        </Button>
      )}

      {/* Step: Role Picker */}
      {step === "role" && (
        <RolePicker selected={role} onChange={handleRoleSelected} />
      )}

      {/* Step: Scenario Picker */}
      {step === "scenario" && role && (
        <ScenarioPicker selected={scenario} onChange={handleScenarioSelected} />
      )}

      {/* Step: Mission Briefing */}
      {step === "briefing" && role && scenario && (
        <div className="space-y-6">
          <MissionBriefing role={role} scenario={scenario} />
          <div className="flex justify-center">
            <Button
              onClick={() => setStep("decision")}
              className="bg-aurora-green text-void-navy hover:bg-aurora-green/90"
            >
              Make Your Decision
            </Button>
          </div>
        </div>
      )}

      {/* Step: Decision Panel */}
      {step === "decision" && role && scenario && (
        <div className="space-y-6">
          <MissionBriefing role={role} scenario={scenario} />
          <DecisionPanel
            role={role}
            selectedChoice={choice}
            onChange={(c) => {
              setChoice(c);
            }}
          />
          <div className="flex justify-center">
            <Button
              onClick={() => choice && handleDecision(choice)}
              disabled={!choice}
              className="bg-aurora-green text-void-navy hover:bg-aurora-green/90"
            >
              Submit Decision
            </Button>
          </div>
        </div>
      )}

      {/* Step: Evaluation */}
      {step === "evaluation" && role && scenario && choice && (
        <EvaluationReveal
          role={role}
          scenario={scenario}
          studentChoice={choice}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
