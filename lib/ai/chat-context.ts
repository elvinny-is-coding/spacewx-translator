import type { SpaceWeatherData } from "@/types/spacewx";
import type { TimelineEvent } from "@/types/timeline";

// ── Notable‑event helpers (same logic used in the cron route) ──

function isNotableFlare(classType: string): boolean {
  const match = classType.match(/^([CXM])(\d+\.?\d*)$/i);
  if (!match) return false;
  const letter = match[1].toUpperCase();
  const number = parseFloat(match[2]);
  return letter === "X" || (letter === "M" && number >= 5);
}

function isNotableCME(speed: number | null, note: string | null): boolean {
  if (speed !== null && speed > 800) return true;
  if (note && note.toLowerCase().includes("earth")) return true;
  return false;
}

// ── Alert context summary ──

function buildAlertContext(alerts: SpaceWeatherData["alerts"]): string {
  if (!alerts.length) return "No active alerts.";

  const hasProton = alerts.some((a) =>
    a.message.toLowerCase().includes("proton"),
  );
  const hasElectron = alerts.some((a) =>
    a.message.toLowerCase().includes("electron"),
  );
  const hasGeomagnetic = alerts.some((a) =>
    a.message.toLowerCase().includes("geomagnetic"),
  );

  const parts: string[] = [];
  if (hasProton) parts.push("Proton/radiation storm in progress");
  if (hasElectron) parts.push("Electron flux alert active");
  if (hasGeomagnetic) parts.push("Geomagnetic storm warning");
  if (parts.length === 0) parts.push(`${alerts.length} active alerts`);

  return parts.join(". ");
}

// ── Main context builder ──

export function buildChatContext(
  data: SpaceWeatherData,
  recentEvents?: TimelineEvent[],
): string {
  const lines: string[] = [];

  // Current snapshot
  lines.push("Current space weather:");
  if (data.kp !== null) lines.push(`Kp: ${data.kp.toFixed(1)}`);
  if (data.noaaScaleG !== null) lines.push(`G-scale: G${data.noaaScaleG}`);
  if (data.solarWind?.speed != null || data.solarWind?.bz != null) {
    const speed = data.solarWind?.speed
      ? `${data.solarWind.speed} km/s`
      : "speed unknown";
    const bz = data.solarWind?.bz != null ? `Bz ${data.solarWind.bz} nT` : "";
    lines.push(`Solar wind: ${speed}${bz ? ", " + bz : ""}`);
  }

  // Flares
  const notableFlares: string[] = [];
  let backgroundFlareCount = 0;
  for (const f of data.flares) {
    if (isNotableFlare(f.classType)) {
      notableFlares.push(`${f.classType} at ${f.beginTime}`);
    } else {
      backgroundFlareCount++;
    }
  }
  if (notableFlares.length > 0) {
    lines.push(`Notable flares: ${notableFlares.join(", ")}`);
  }
  lines.push(`Background flares: ${backgroundFlareCount} (C/M<5)`);

  // CMEs
  const notableCMEs: string[] = [];
  let backgroundCMECount = 0;
  for (const c of data.cmes) {
    if (isNotableCME(c.speed, c.note)) {
      const desc = `CME ${c.speed ? `${c.speed} km/s` : ""}${c.note ? ` (${c.note})` : ""} at ${c.startTime}`;
      notableCMEs.push(desc);
    } else {
      backgroundCMECount++;
    }
  }
  if (notableCMEs.length > 0) {
    lines.push(`Notable CMEs: ${notableCMEs.join(", ")}`);
  }
  lines.push(`Background CMEs: ${backgroundCMECount}`);

  lines.push(`Alert context: ${buildAlertContext(data.alerts)}`);

  // Recent events (top 5 notable)
  if (recentEvents && recentEvents.length > 0) {
    lines.push("");
    lines.push("Recent notable events (last 7 days):");
    const top = recentEvents
      .filter((e) =>
        ["flare", "cme", "geomagnetic_storm", "radiation_storm"].includes(
          e.type,
        ),
      )
      .slice(0, 5);
    for (const e of top) {
      const time = new Date(e.time).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      lines.push(`- ${e.type}: ${e.label} (${time})`);
    }
  }

  return lines.join("\n");
}
