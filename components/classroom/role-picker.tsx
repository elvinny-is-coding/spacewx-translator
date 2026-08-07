// components/classroom/role-picker.tsx
"use client";

import { cn } from "@/lib/utils";
import type { MissionRole } from "@/types/classroom";
import { Satellite, Plane, Rocket, Radio, User } from "lucide-react";

interface RolePickerProps {
  selected: MissionRole | null;
  onChange: (role: MissionRole) => void;
  disabled?: boolean;
}

const ROLES: {
  id: MissionRole;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "Satellite Operator",
    label: "Satellite Operator",
    icon: <Satellite size={20} />,
    description:
      "Decide whether to proceed with normal operations, enter safe mode, or delay a maneuver.",
  },
  {
    id: "Polar Flight Dispatcher",
    label: "Polar Flight Dispatcher",
    icon: <Plane size={20} />,
    description:
      "Choose whether to route flights via the polar corridor or divert southward.",
  },
  {
    id: "Mission Planner",
    label: "Mission Planner",
    icon: <Rocket size={20} />,
    description:
      "Determine if conditions are safe for a scheduled launch or deployment.",
  },
  {
    id: "Ham Radio Operator",
    label: "Ham Radio Operator",
    icon: <Radio size={20} />,
    description:
      "Decide whether to operate during a contest given current HF propagation.",
  },
  {
    id: "ISS EVA Planner",
    label: "ISS EVA Planner",
    icon: <User size={20} />,
    description:
      "Decide if a scheduled spacewalk should proceed based on radiation and comms.",
  },
];

export default function RolePicker({
  selected,
  onChange,
  disabled = false,
}: RolePickerProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-display text-lg text-starlight">
          Choose Your Role
        </h3>
        <p className="text-sm text-faint-star">
          Pick an operational role. Each role faces a different decision based
          on the same space weather scenario.
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        role="group"
        aria-label="Mission role selector"
      >
        {ROLES.map((role) => {
          const isActive = selected === role.id;
          return (
            <button
              key={role.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(role.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                isActive
                  ? "border-aurora-green bg-aurora-green/10 ring-2 ring-aurora-green/30"
                  : "border-deep-indigo bg-void-navy/50 hover:border-faint-star/30 hover:bg-void-navy",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              aria-pressed={isActive}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isActive
                    ? "bg-aurora-green/20 text-aurora-green"
                    : "bg-deep-indigo text-faint-star",
                )}
              >
                {role.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-starlight">
                  {role.label}
                </p>
                <p className="text-xs text-faint-star mt-0.5">
                  {role.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
