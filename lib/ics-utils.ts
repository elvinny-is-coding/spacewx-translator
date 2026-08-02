import type { ForecastPoint } from "@/types/spacewx";
import {
  getGeomagneticLatitude,
  AURORA_OVAL_BASE_LATITUDE,
  AURORA_OVAL_DEGREES_PER_KP,
} from "@/lib/aurora-utils";

/** Helper to format a Date as YYYYMMDDTHHmmssZ (UTC) */
function toICSDateTime(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Escape characters that have special meaning in ICS TEXT values
 * (commas, semicolons, backslashes) per RFC 5545. Newlines are handled
 * separately via literal "\n" sequences already used below.
 */
function escapeICSText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/**
 * Generate an iCalendar (.ics) string for upcoming aurora viewing windows
 * at a specific geographic location.
 *
 * Visibility heuristic, per NOAA's stated Kp-oval relationship (the oval
 * moves ~2° of geomagnetic latitude equatorward per unit of Kp, starting
 * around 66° at Kp=0):
 *   equatorwardBoundary = AURORA_OVAL_BASE_LATITUDE − AURORA_OVAL_DEGREES_PER_KP × Kp
 *   → minRequiredKp = (AURORA_OVAL_BASE_LATITUDE − geomagneticLat) / AURORA_OVAL_DEGREES_PER_KP
 *
 * These constants are shared with the oval-overlay map feature in
 * lib/aurora-utils.ts so there is exactly one place to correct the model
 * if it's ever revised.
 *
 * Only forecast points with Kp ≥ minRequiredKp are included.
 *
 * @param forecast   7‑day Kp forecast points (must have time and kp).
 * @param lat        Geographic latitude of the selected location.
 * @param lng        Geographic longitude of the selected location.
 * @param locationName Optional label for the location (e.g., "My location").
 * @returns           A valid .ics calendar string, or null if no events.
 */
export function generateAuroraCalendar(
  forecast: ForecastPoint[] | null,
  lat: number,
  lng: number,
  locationName?: string,
): string | null {
  if (!forecast || forecast.length === 0) return null;

  const geomagLat = getGeomagneticLatitude(lat, lng);
  const minRequiredKp =
    (AURORA_OVAL_BASE_LATITUDE - geomagLat) / AURORA_OVAL_DEGREES_PER_KP;

  const events = forecast
    .filter((point) => point.kp >= minRequiredKp)
    .map((point) => {
      const start = new Date(point.time);
      const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // 3‑hour window

      const summary = escapeICSText(`Aurora possible (Kp ${point.kp})`);
      const description = escapeICSText(
        [
          `Expected Kp index: ${point.kp}`,
          `Location: ${locationName ?? `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`}`,
          `Geomagnetic latitude: ${geomagLat.toFixed(1)}°`,
          "",
          "This window may offer aurora visibility at your chosen location.",
          "Check local cloud cover and light conditions for best viewing.",
          "Note: this is a simplified estimate based on an idealized auroral",
          "oval model. Actual visibility can vary — treat this as a general",
          "guideline, not a guarantee.",
          "",
          "Powered by Space Weather Translator – NOAA / NASA data.",
        ].join("\\n"),
      );

      const uid = `aurora-${toICSDateTime(start)}-${lat.toFixed(4)}-${lng.toFixed(4)}@spacewxtranslator.app`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART:${toICSDateTime(start)}`,
        `DTEND:${toICSDateTime(end)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      ].join("\r\n");
    });

  if (events.length === 0) return null;

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Space Weather Translator//aurora-calendar//EN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return calendar;
}
