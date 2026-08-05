import type { TimelineEvent } from "@/types/timeline";
import type { SpaceWeatherSnapshot } from "@/types/snapshot";

// ── DONKI row shapes (from donki_events table) ──

interface DonkiRow {
  id: string;
  event_type: "FLR" | "CME" | "GST";
  event_time: string;
  raw: Record<string, any>;
}

// ── Helpers ──

function eventColor(type: TimelineEvent["type"]): string {
  switch (type) {
    case "flare":
      return "solar-amber";
    case "cme":
      return "aurora-violet";
    case "geomagnetic_storm":
      return "solar-amber";
    case "radiation_storm":
      return "solar-amber";
    case "alert":
      return "aurora-green";
    case "kp_spike":
      return "aurora-green";
    default:
      return "faint-star";
  }
}

// ── DONKI converters ──

export function convertDonkiRow(row: DonkiRow): TimelineEvent | null {
  const raw = row.raw ?? {};

  switch (row.event_type) {
    case "FLR": {
      const classType = raw.classType ?? "?";
      const sourceLocation = raw.sourceLocation
        ? ` from ${raw.sourceLocation}`
        : "";
      return {
        id: row.id,
        source: "donki",
        type: "flare",
        time: row.event_time,
        label: `Solar flare ${classType}`,
        description: `${classType} flare${sourceLocation}. Peak at ${raw.peakTime ?? raw.beginTime}.`,
        color: eventColor("flare"),
        raw,
      };
    }

    case "CME": {
      const speed = raw.speed ? `${raw.speed} km/s` : "speed unknown";
      const note = raw.note ? ` — ${raw.note}` : "";

      // Determine if Earth-directed
      const isEarthDirected =
        note.toLowerCase().includes("earth") ||
        note.toLowerCase().includes("geoeffective") ||
        (raw.halfAngle && raw.halfAngle > 120);

      // Determine severity
      let severity = "";
      if (raw.speed) {
        if (raw.speed > 1500) severity = "Extremely fast";
        else if (raw.speed > 1000) severity = "Very fast";
        else if (raw.speed > 700) severity = "Fast";
        else if (raw.speed > 400) severity = "Moderate";
        else severity = "Slow";
      }

      const directionText = isEarthDirected ? " (Earth-directed)" : "";
      const severityText = severity ? ` — ${severity}` : "";

      return {
        id: row.id,
        source: "donki",
        type: "cme",
        time: row.event_time,
        label: `Coronal Mass Ejection (${speed})`,
        description: `CME detected ${speed}${note}${directionText}${severityText}.${raw.isMostAccurate === false ? " (Preliminary analysis)" : ""}`,
        color: eventColor("cme"),
        raw,
      };
    }

    case "GST": {
      const kpMax = raw.kpMax !== undefined ? ` (peak Kp ${raw.kpMax})` : "";
      return {
        id: row.id,
        source: "donki",
        type: "geomagnetic_storm",
        time: row.event_time,
        label: `Geomagnetic Storm${kpMax}`,
        description: `Geomagnetic storm recorded${kpMax}. ${raw.link ? `More info: ${raw.link}` : ""}`,
        color: eventColor("geomagnetic_storm"),
        raw,
      };
    }

    default:
      return null;
  }
}

// ── Alert event extraction (from snapshots) ──

interface SnapshotAlert {
  id?: string;
  product_id?: string;
  productId?: string;
  issueTime?: string;
  issue_datetime?: string;
  message?: string;
}

export function extractAlertEvents(
  snapshots: SpaceWeatherSnapshot[],
): TimelineEvent[] {
  // Collect all unique alerts by product_id, keeping first-seen time
  const seen = new Map<
    string,
    { alert: SnapshotAlert; firstSeen: string; lastSeen: string }
  >();

  for (const snap of snapshots) {
    const alerts: SnapshotAlert[] = (snap.raw_data as any)?.alerts ?? [];
    for (const alert of alerts) {
      const pid = alert.product_id || alert.productId || alert.id;
      if (!pid) continue;

      const issueTime = alert.issueTime || alert.issue_datetime || "";
      if (!issueTime) continue;

      const existing = seen.get(pid);
      if (!existing) {
        seen.set(pid, {
          alert,
          firstSeen: issueTime,
          lastSeen: snap.timestamp,
        });
      } else {
        if (snap.timestamp > existing.lastSeen) {
          existing.lastSeen = snap.timestamp;
        }
      }
    }
  }

  // Build timeline events from deduplicated alerts
  const events: TimelineEvent[] = [];
  for (const [, entry] of seen) {
    const a = entry.alert;
    const message = a.message ?? "";
    const snippet =
      message.length > 120 ? message.slice(0, 120) + "…" : message;

    // Improved alert type classification
    let type: TimelineEvent["type"] = "alert";

    // Check for radiation storms (S-scale)
    if (
      message.includes("Proton") ||
      message.includes("radiation") ||
      message.includes("10MeV") ||
      message.includes("100MeV") ||
      message.includes("S1") ||
      message.includes("S2") ||
      message.includes("S3") ||
      message.includes("S4") ||
      message.includes("S5")
    ) {
      type = "radiation_storm";
    }
    // Check for geomagnetic storms (G-scale)
    else if (
      message.includes("Geomagnetic") ||
      message.includes("Kp") ||
      message.includes("K-index") ||
      message.includes("G1") ||
      message.includes("G2") ||
      message.includes("G3") ||
      message.includes("G4") ||
      message.includes("G5") ||
      (message.includes("storm") && message.includes("magnetic"))
    ) {
      type = "geomagnetic_storm";
    }
    // Check for radio blackouts (R-scale)
    else if (
      message.includes("Radio") ||
      message.includes("R1") ||
      message.includes("R2") ||
      message.includes("R3") ||
      message.includes("R4") ||
      message.includes("R5") ||
      message.includes("blackout") ||
      message.includes("HF")
    ) {
      type = "alert"; // Keep as general alert but could add radio_blackout type later
    }

    events.push({
      id: `alert-${a.product_id || a.id || entry.firstSeen}`,
      source: "supabase",
      type,
      time: entry.firstSeen,
      label: `NOAA Alert: ${message.slice(0, 80)}`,
      description: `Issued ${new Date(entry.firstSeen).toLocaleString("en-US")}. ${snippet}`,
      color: eventColor(type),
      raw: a as Record<string, unknown>,
    });
  }

  return events;
}

// ── Kp spike extraction (from snapshots) ──

const KP_SPIKE_THRESHOLD = 4; // Only report Kp >= 4 as notable
const KP_COLLAPSE_EPSILON = 0.3; // Tighter collapse for more precise events
const KP_MIN_DURATION_MS = 30 * 60 * 1000; // Minimum 30 minutes to count as an event

export function extractKpSpikeEvents(
  snapshots: SpaceWeatherSnapshot[],
): TimelineEvent[] {
  if (snapshots.length === 0) return [];

  // Filter snapshots with valid Kp and sort by time ascending
  const valid = snapshots
    .filter((s) => s.kp !== null && s.kp !== undefined)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  if (valid.length === 0) return [];

  const events: TimelineEvent[] = [];
  let currentStart: string | null = null;
  let currentKp: number | null = null;
  let currentEnd: string | null = null;
  let maxKpInWindow = 0;

  for (let i = 0; i < valid.length; i++) {
    const kp = valid[i].kp as number;
    const ts = valid[i].timestamp;

    // Start of a potential event
    if (kp >= KP_SPIKE_THRESHOLD && currentStart === null) {
      currentStart = ts;
      currentKp = kp;
      currentEnd = ts;
      maxKpInWindow = kp;
    }
    // Continuing an event (Kp within collapse epsilon of the current window's reference Kp)
    else if (
      currentStart !== null &&
      currentKp !== null &&
      Math.abs(kp - currentKp) <= KP_COLLAPSE_EPSILON
    ) {
      currentEnd = ts;
      maxKpInWindow = Math.max(maxKpInWindow, kp);
    }
    // Kp changed significantly or dropped below threshold – emit event if duration met
    else {
      if (currentStart !== null && currentEnd !== null) {
        const durationMs =
          new Date(currentEnd).getTime() - new Date(currentStart).getTime();
        if (durationMs >= KP_MIN_DURATION_MS) {
          events.push(createKpEvent(currentStart, currentEnd, maxKpInWindow));
        }
      }
      // Reset or start new window
      currentStart = kp >= KP_SPIKE_THRESHOLD ? ts : null;
      currentKp = kp >= KP_SPIKE_THRESHOLD ? kp : null;
      currentEnd = currentStart;
      maxKpInWindow = kp;
    }
  }

  // Emit final event if still active
  if (currentStart !== null && currentEnd !== null) {
    const durationMs =
      new Date(currentEnd).getTime() - new Date(currentStart).getTime();
    if (durationMs >= KP_MIN_DURATION_MS) {
      events.push(createKpEvent(currentStart, currentEnd, maxKpInWindow));
    }
  }

  return events;
}

function createKpEvent(
  start: string,
  end: string,
  maxKp: number,
): TimelineEvent {
  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const durationHours = Math.round(durationMs / (1000 * 60 * 60));
  const durationText = durationHours > 0 ? ` (lasted ~${durationHours}h)` : "";

  return {
    id: `kp-${start}`,
    source: "supabase",
    type: "kp_spike",
    time: start,
    label: `Kp reached ${maxKp.toFixed(1)}${durationText}`,
    description: `Kp index peaked at ${maxKp.toFixed(1)} starting ${new Date(start).toLocaleString("en-US")}${durationText}.`,
    color: eventColor("kp_spike"),
    raw: { kp: maxKp, start, end },
  };
}
