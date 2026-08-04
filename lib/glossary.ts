// lib/glossary.ts
export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const SPACE_WEATHER_GLOSSARY: GlossaryEntry[] = [
  {
    term: "Kp index",
    definition:
      "A global measure of geomagnetic activity ranging from 0 (quiet) to 9 (extreme storm). Higher values mean stronger disturbances of Earth's magnetic field.",
  },
  {
    term: "Kp",
    definition:
      "Short for 'Kp index'. Ranges 0–9; values ≥5 indicate a geomagnetic storm.",
  },
  {
    term: "G‑scale",
    definition:
      "NOAA's Geomagnetic Storm scale. Ranges G1 (minor) to G5 (extreme). Determined by the Kp index.",
  },
  {
    term: "R‑scale",
    definition:
      "NOAA's Radio Blackout scale. Ranges R1 (minor) to R5 (extreme). Related to X‑ray flare intensity.",
  },
  {
    term: "S‑scale",
    definition:
      "NOAA's Solar Radiation Storm scale. Ranges S1 (minor) to S5 (extreme). Driven by energetic proton flux.",
  },
  {
    term: "Bz",
    definition:
      "The north‑south component of the interplanetary magnetic field (IMF). A negative (southward) Bz allows solar wind energy to enter Earth's magnetosphere, often causing stronger geomagnetic activity.",
  },
  {
    term: "solar wind",
    definition:
      "The continuous stream of charged particles (plasma) flowing from the Sun. Speed and magnetic field strength affect space weather near Earth.",
  },
  {
    term: "CME",
    definition:
      "Coronal Mass Ejection – a massive burst of solar plasma and magnetic field released from the Sun. Can cause geomagnetic storms 1–3 days later if Earth‑directed.",
  },
  {
    term: "coronal mass ejection",
    definition: "See CME.",
  },
  {
    term: "X‑class flare",
    definition:
      "The strongest category of solar flares. X‑class flares can cause planet‑wide radio blackouts and long‑lasting radiation storms.",
  },
  {
    term: "M‑class flare",
    definition:
      "Medium‑sized solar flares; 10 times weaker than X‑class but still capable of causing brief radio blackouts at high latitudes.",
  },
  {
    term: "solar flare",
    definition:
      "A sudden, intense burst of radiation from the Sun's surface, often near sunspots. Flares are classified as C, M, or X (each letter represents a 10‑fold increase in peak X‑ray flux).",
  },
  {
    term: "geomagnetic storm",
    definition:
      "A temporary disturbance of Earth's magnetosphere caused by a solar wind shock wave or CME. Can produce aurora at lower latitudes and affect satellites and power grids.",
  },
  {
    term: "radiation storm",
    definition:
      "A storm of energetic protons accelerated by solar flares or CMEs. Can pose a risk to astronauts, high‑altitude flights, and satellite electronics.",
  },
  {
    term: "aurora",
    definition:
      "Natural light displays in polar skies caused by charged particles from the Sun interacting with Earth's atmosphere. Also known as the Northern or Southern Lights.",
  },
  {
    term: "GNSS",
    definition:
      "Global Navigation Satellite System (e.g., GPS, Galileo). Space weather can degrade signal accuracy.",
  },
  {
    term: "HF radio",
    definition:
      "High‑Frequency radio (3–30 MHz), used by aviation, maritime, and amateur operators. Affected by solar flares and geomagnetic storms.",
  },
  {
    term: "magnetosphere",
    definition:
      "The region of space around Earth controlled by our planet's magnetic field. It shields us from most solar wind and cosmic rays.",
  },
  {
    term: "proton flux",
    definition:
      "The number of high‑energy protons passing through a given area. Elevated levels indicate a solar radiation storm.",
  },
  {
    term: "southward IMF",
    definition:
      "When the interplanetary magnetic field points southward (negative Bz), it can connect with Earth's northward‑pointing magnetic field, allowing energy to flow into the magnetosphere and intensify geomagnetic activity.",
  },
];
