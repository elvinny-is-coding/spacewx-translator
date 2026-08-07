// components/classroom/decision-panel.tsx
"use client";

import { cn } from "@/lib/utils";
import type { MissionRole } from "@/types/classroom";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";

interface DecisionPanelProps {
  role: MissionRole;
  selectedChoice: string | null;
  onChange: (choice: string) => void;
  disabled?: boolean;
}

const ROLE_CHOICES: Record<
  MissionRole,
  { value: string; label: string; icon: React.ReactNode; description: string }[]
> = {
  "Satellite Operator": [
    {
      value: "GO",
      label: "Proceed — Normal Operations",
      icon: <CheckCircle size={20} className="text-aurora-green" />,
      description: "Continue normal operations. No protective actions needed.",
    },
    {
      value: "CONDITIONAL GO",
      label: "Conditional — Monitor & Limit",
      icon: <AlertTriangle size={20} className="text-solar-amber" />,
      description:
        "Proceed with caution. Limit non‑essential operations and monitor for escalation.",
    },
    {
      value: "NO GO",
      label: "Abort — Enter Safe Mode",
      icon: <XCircle size={20} className="text-red-400" />,
      description:
        "Enter safe mode or delay the maneuver. Conditions are too risky.",
    },
  ],
  "Polar Flight Dispatcher": [
    {
      value: "GO",
      label: "Route Polar Corridor",
      icon: <CheckCircle size={20} className="text-aurora-green" />,
      description: "Use the polar route. Saves fuel and time.",
    },
    {
      value: "CONDITIONAL GO",
      label: "Route with Caution",
      icon: <AlertTriangle size={20} className="text-solar-amber" />,
      description:
        "Use polar route but monitor HF conditions and radiation levels.",
    },
    {
      value: "NO GO",
      label: "Divert Southward",
      icon: <XCircle size={20} className="text-red-400" />,
      description:
        "Reroute via lower latitudes. More expensive but safer for HF and radiation.",
    },
  ],
  "Mission Planner": [
    {
      value: "GO",
      label: "Proceed with Launch",
      icon: <CheckCircle size={20} className="text-aurora-green" />,
      description: "Conditions are safe. Proceed as scheduled.",
    },
    {
      value: "CONDITIONAL GO",
      label: "Delay — Wait for Window",
      icon: <Clock size={20} className="text-solar-amber" />,
      description: "Hold for a better window within the next 24–48 hours.",
    },
    {
      value: "NO GO",
      label: "Scrub — Conditions Unsafe",
      icon: <XCircle size={20} className="text-red-400" />,
      description: "Do not launch. Conditions exceed safety thresholds.",
    },
  ],
  "Ham Radio Operator": [
    {
      value: "GO",
      label: "Operate Normally",
      icon: <CheckCircle size={20} className="text-aurora-green" />,
      description: "Full contest operation. Conditions support all bands.",
    },
    {
      value: "CONDITIONAL GO",
      label: "Operate Low Bands Only",
      icon: <AlertTriangle size={20} className="text-solar-amber" />,
      description: "Stick to 40m and below. Higher bands are likely degraded.",
    },
    {
      value: "NO GO",
      label: "Stand Down",
      icon: <XCircle size={20} className="text-red-400" />,
      description: "Conditions are too poor. Wait for improvement.",
    },
  ],
  "ISS EVA Planner": [
    {
      value: "GO",
      label: "Proceed with EVA",
      icon: <CheckCircle size={20} className="text-aurora-green" />,
      description:
        "Radiation levels are safe. Execute the scheduled spacewalk.",
    },
    {
      value: "CONDITIONAL GO",
      label: "Shorten the EVA",
      icon: <AlertTriangle size={20} className="text-solar-amber" />,
      description: "Reduce EVA duration to limit radiation exposure.",
    },
    {
      value: "NO GO",
      label: "Postpone EVA",
      icon: <XCircle size={20} className="text-red-400" />,
      description: "Radiation risk too high. Reschedule the spacewalk.",
    },
  ],
};

export default function DecisionPanel({
  role,
  selectedChoice,
  onChange,
  disabled = false,
}: DecisionPanelProps) {
  const choices = ROLE_CHOICES[role];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-display text-lg text-starlight">Your Decision</h3>
        <p className="text-sm text-faint-star">
          Based on the mission briefing, choose the operational action you would
          take as the {role}.
        </p>
      </div>

      <div
        className="space-y-3"
        role="radiogroup"
        aria-label="Decision options"
      >
        {choices.map((choice) => {
          const isActive = selectedChoice === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(choice.value)}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all w-full",
                isActive
                  ? "border-aurora-green bg-aurora-green/10 ring-2 ring-aurora-green/30"
                  : "border-deep-indigo bg-void-navy/50 hover:border-faint-star/30 hover:bg-void-navy",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              role="radio"
              aria-checked={isActive}
            >
              <div className="mt-0.5 shrink-0">{choice.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-starlight">
                  {choice.label}
                </p>
                <p className="text-xs text-faint-star mt-0.5">
                  {choice.description}
                </p>
              </div>
              {isActive && (
                <div className="mt-0.5 shrink-0">
                  <Shield size={18} className="text-aurora-green" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
