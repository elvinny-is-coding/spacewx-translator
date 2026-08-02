"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";

interface SourceWarningBannerProps {
  warnings: string[];
}

export default function SourceWarningBanner({
  warnings,
}: SourceWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed || warnings.length === 0) return null;

  return (
    <Alert className="relative border-solar-amber/40 bg-solar-amber/10">
      <AlertTriangle className="h-4 w-4 text-solar-amber" />
      <AlertTitle className="text-sm font-medium text-solar-amber">
        Some data sources are currently unavailable
      </AlertTitle>
      <AlertDescription className="mt-1 text-xs text-faint-star">
        Display may be incomplete.{" "}
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-aurora-green hover:underline"
        >
          {expanded ? "Hide" : "Details"}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </AlertDescription>

      {expanded && (
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-faint-star">
          {warnings.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-faint-star hover:text-starlight transition-colors"
        aria-label="Dismiss warning"
      >
        <X size={14} />
      </button>
    </Alert>
  );
}
