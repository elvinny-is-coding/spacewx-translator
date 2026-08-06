// components/mission-chips.tsx
"use client";

import { cn } from "@/lib/utils";
import type { MissionType } from "@/types/mission-advisory";
import { Rocket, Radio, Plane, Camera, Wrench, Telescope } from "lucide-react";

const CHIPS: { value: MissionType; label: string; icon: React.ReactNode }[] = [
  { value: "CubeSat Launch", label: "CubeSat", icon: <Rocket size={14} /> },
  { value: "HF Operation", label: "HF Radio", icon: <Radio size={14} /> },
  { value: "Balloon Flight", label: "Balloon", icon: <Plane size={14} /> },
  { value: "Aurora Photography", label: "Aurora", icon: <Camera size={14} /> },
  {
    value: "Satellite Maintenance",
    label: "Sat Maint",
    icon: <Wrench size={14} />,
  },
  {
    value: "Telescope Observation",
    label: "Telescope",
    icon: <Telescope size={14} />,
  },
];

interface MissionChipsProps {
  selected: MissionType | null;
  onChange: (mission: MissionType) => void;
  disabled?: boolean;
}

export default function MissionChips({
  selected,
  onChange,
  disabled = false,
}: MissionChipsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Mission type selector"
    >
      {CHIPS.map((chip) => {
        const isActive = selected === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(chip.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border min-h-[36px]",
              isActive
                ? "bg-aurora-green text-void-navy border-aurora-green"
                : "bg-void-navy text-faint-star border-deep-indigo hover:text-starlight hover:border-faint-star",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            aria-pressed={isActive}
          >
            {chip.icon}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
