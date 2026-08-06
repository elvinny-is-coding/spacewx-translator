"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Audience } from "@/types/audience";

interface AudienceToggleProps {
  selected: Audience;
  onChange: (audience: Audience) => void;
}

const AUDIENCES: {
  value: Audience;
  label: string;
  description: string;
}[] = [
  {
    value: "general",
    label: "Public",
    description: "Plain language explanations for everyone",
  },
  {
    value: "educator",
    label: "Educator",
    description: "Classroom‑ready explanations with learning points",
  },
  {
    value: "technical",
    label: "Operations",
    description: "Operational brief for satellite operators and engineers",
  },
];

export default function AudienceToggle({
  selected,
  onChange,
}: AudienceToggleProps) {
  return (
    <Tabs
      value={selected}
      onValueChange={(val) => onChange(val as Audience)}
      className="w-full"
      aria-label="Select audience mode"
    >
      <TabsList
        className="grid w-full grid-cols-3 bg-deep-indigo"
        role="radiogroup"
      >
        {AUDIENCES.map((aud) => (
          <TabsTrigger
            key={aud.value}
            value={aud.value}
            className="data-[state=active]:bg-aurora-green data-[state=active]:text-void-navy text-faint-star text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-aurora-green/50"
            aria-label={`${aud.label}: ${aud.description}`}
            role="radio"
            aria-checked={selected === aud.value}
          >
            {aud.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
