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
    label: "General Public",
    description:
      "Simple explanation of what's happening and whether you might see aurora.",
  },
  {
    value: "educator",
    label: "Educator",
    description: "Scientific cause and effect, great for classroom use.",
  },
  {
    value: "technical",
    label: "Technical",
    description:
      "Precise data for satellite operators, pilots, and radio engineers.",
  },
];

export default function AudienceToggle({
  selected,
  onChange,
}: AudienceToggleProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-lg text-starlight">Who are you?</h3>
        <p className="text-sm text-faint-star">
          Choose the audience below and the AI will tailor the space weather
          summary for you.
        </p>
      </div>

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
              className="data-[state=active]:bg-aurora-green data-[state=active]:text-void-navy text-faint-star text-sm"
            >
              {aud.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Show a brief description of the selected audience */}
      <p className="text-xs text-faint-star">
        {AUDIENCES.find((a) => a.value === selected)?.description}
      </p>
    </div>
  );
}
