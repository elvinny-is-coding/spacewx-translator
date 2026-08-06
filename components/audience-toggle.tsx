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
}[] = [
  { value: "general", label: "Public" },
  { value: "educator", label: "Educator" },
  { value: "technical", label: "Operations" },
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
    >
      <TabsList className="grid w-full grid-cols-3 bg-deep-indigo">
        {AUDIENCES.map((aud) => (
          <TabsTrigger
            key={aud.value}
            value={aud.value}
            className="data-[state=active]:bg-aurora-green data-[state=active]:text-void-navy text-faint-star text-xs sm:text-sm"
          >
            {aud.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
