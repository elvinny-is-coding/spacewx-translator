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
      return {
        id: row.id,
        source: "donki",
        type: "cme",
        time: row.event_time,
        label: `Coronal Mass Ejection (${speed})`,
        description: `CME detected ${speed}${note}.${raw.isMostAccurate === false ? " (Preliminary analysis)" : ""}`,
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
        // Update lastSeen if this snapshot is later
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

    // Classify alert type
    let type: TimelineEvent["type"] = "alert";
    if (
      message.includes("Proton") ||
      message.includes("radiation") ||
      message.includes("10MeV") ||
      message.includes("100MeV")
    ) {
      type = "radiation_storm";
    } else if (
      message.includes("Geomagnetic") ||
      message.includes("Kp") ||
      message.includes("storm")
    ) {
      type = "geomagnetic_storm";
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

const KP_COLLAPSE_EPSILON = 0.6; // collapse consecutive Kp within this range

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
  let currentStart = valid[0].timestamp;
  let currentKp = valid[0].kp as number;
  let currentEnd = currentStart;

  for (let i = 1; i < valid.length; i++) {
    const kp = valid[i].kp as number;
    const ts = valid[i].timestamp;

    if (Math.abs(kp - currentKp) <= KP_COLLAPSE_EPSILON) {
      // Same Kp window, extend end time
      currentEnd = ts;
    } else {
      // Kp changed: emit previous event if Kp ≥ 4 (notable)
      if (currentKp >= 4) {
        events.push(createKpEvent(currentStart, currentEnd, currentKp));
      }
      currentStart = ts;
      currentKp = kp;
      currentEnd = ts;
    }
  }

  // Emit last event
  if (currentKp >= 4) {
    events.push(createKpEvent(currentStart, currentEnd, currentKp));
  }

  return events;
}

function createKpEvent(start: string, end: string, kp: number): TimelineEvent {
  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const durationHours = Math.round(durationMs / (1000 * 60 * 60));
  const durationText = durationHours > 0 ? ` (lasted ~${durationHours}h)` : "";

  return {
    id: `kp-${start}`,
    source: "supabase",
    type: "kp_spike",
    time: start,
    label: `Kp ${kp.toFixed(1)}${durationText}`,
    description: `Kp index reached ${kp.toFixed(1)} starting ${new Date(start).toLocaleString("en-US")}${durationText}.`,
    color: eventColor("kp_spike"),
    raw: { kp, start, end },
  };
}
