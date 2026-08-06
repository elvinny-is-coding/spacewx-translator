import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { severityFromKp } from "@/config/constants";

interface StatusBarProps {
  lastUpdated: string;
  warnings: string[];
  kp: number | null;
}

export default function StatusBar({
  lastUpdated,
  warnings,
  kp,
}: StatusBarProps) {
  const { label, color } = severityFromKp(kp);

  const updatedDate = new Date(lastUpdated);
  const timeString = updatedDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img src="/logo-black.svg" alt="Aura logo" className="h-6 w-6" />
        <h1 className="font-display text-lg text-starlight tracking-wide">
          AURA
        </h1>
        <Badge
          className="border-none px-3 py-1 text-sm font-medium"
          style={{
            backgroundColor: `var(--color-${color})`,
            color: "#0B1120",
          }}
        >
          {label}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-sm text-faint-star">
        {warnings.length > 0 && (
          <span className="flex items-center gap-1" title={warnings.join(", ")}>
            <AlertTriangle size={16} className="text-solar-amber" />
            <span className="hidden sm:inline">Partial data</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={14} />
          Updated {timeString}
        </span>
      </div>
    </div>
  );
}
