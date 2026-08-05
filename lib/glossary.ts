// lib/glossary.ts
export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const SPACE_WEATHER_GLOSSARY: GlossaryEntry[] = [
  {
    term: "Kp index",
    definition:
      "A 3-hourly global measure of geomagnetic activity ranging from 0 (quiet) to 9 (extreme storm). Calculated from magnetometer data at 13 mid-latitude stations. Higher values indicate stronger disturbances of Earth's magnetic field and increased aurora activity.",
  },
  {
    term: "Kp",
    definition:
      "Short for 'Kp index'. Ranges 0–9; values ≥5 indicate a geomagnetic storm (G1 or higher). Updated every 3 hours by NOAA SWPC.",
  },
  {
    term: "G‑scale",
    definition:
      "NOAA's Geomagnetic Storm scale (G0–G5). G1=Kp5 (minor), G2=Kp6 (moderate), G3=Kp7 (strong), G4=Kp8 (severe), G5=Kp9 (extreme). Used to communicate storm severity to the public.",
  },
  {
    term: "R‑scale",
    definition:
      "NOAA's Radio Blackout scale (R0–R5). Based on X-ray flare intensity affecting Earth's sunlit side. R1 (minor) to R5 (extreme). R2+ can cause HF radio blackouts and GPS degradation.",
  },
  {
    term: "S‑scale",
    definition:
      "NOAA's Solar Radiation Storm scale (S0–S5). Based on >10 MeV proton flux. S1 (minor) to S5 (extreme). S2+ poses risks to astronauts and high-altitude flights; S4+ can cause satellite computer upsets.",
  },
  {
    term: "Bz",
    definition:
      "The north‑south component of the interplanetary magnetic field (IMF) in nT. Negative (southward) Bz allows solar wind energy to efficiently enter Earth's magnetosphere, often causing stronger geomagnetic activity and aurora. Values below -10 nT are particularly significant.",
  },
  {
    term: "solar wind",
    definition:
      "The continuous stream of charged particles (plasma) flowing from the Sun at 300–800 km/s. Speed and magnetic field orientation (Bz) determine how much energy enters Earth's magnetosphere. High speeds (>600 km/s) with southward Bz are most geoeffective.",
  },
  {
    term: "CME",
    definition:
      "Coronal Mass Ejection – a massive burst of solar plasma and magnetic field released from the solar corona. Can cause geomagnetic storms 1–3 days later if Earth-directed. Speed >1000 km/s CMEs are particularly impactful.",
  },
  {
    term: "coronal mass ejection",
    definition: "See CME.",
  },
  {
    term: "X‑class flare",
    definition:
      "The strongest category of solar flares (X1–X10+). Each unit represents a 10x increase in X-ray flux from the baseline. X-class flares can cause planet‑wide HF radio blackouts, lasting radiation storms, and long-term satellite effects.",
  },
  {
    term: "M‑class flare",
    definition:
      "Medium‑sized solar flares (M1–M9); 10 times weaker than X-class but still capable of causing brief radio blackouts at high latitudes and minor radiation storms. M5+ are considered significant.",
  },
  {
    term: "solar flare",
    definition:
      "A sudden, intense burst of radiation from the Sun's atmosphere, often near sunspots. Classified by peak X-ray flux: C-class (weak), M-class (moderate), X-class (strong). Each letter represents a 10‑fold increase in intensity.",
  },
  {
    term: "geomagnetic storm",
    definition:
      "A temporary disturbance of Earth's magnetosphere caused by solar wind shock waves or CME impacts. Can produce aurora at lower latitudes, induce currents in power grids, affect satellite operations, and degrade HF radio communications.",
  },
  {
    term: "radiation storm",
    definition:
      "A storm of energetic protons accelerated by solar flares or CME shock waves. Measured by >10 MeV proton flux. Can pose radiation risks to astronauts, high‑altitude flights, and satellite electronics. S2+ requires aviation precautions.",
  },
  {
    term: "aurora",
    definition:
      "Natural light displays (Northern/Southern Lights) caused by charged particles from the solar wind interacting with Earth's upper atmosphere. Typically visible within 20–30 degrees of the magnetic poles during quiet conditions, extending farther south during geomagnetic storms.",
  },
  {
    term: "GNSS",
    definition:
      "Global Navigation Satellite System (GPS, Galileo, GLONASS, BeiDou). Space weather can degrade signal accuracy through ionospheric disturbances, particularly during geomagnetic storms and solar flares.",
  },
  {
    term: "HF radio",
    definition:
      "High‑Frequency radio (3–30 MHz), used by aviation, maritime, and amateur operators. Relies on ionospheric reflection; solar flares can cause blackouts on the sunlit side, while geomagnetic storms can affect propagation at high latitudes.",
  },
  {
    term: "magnetosphere",
    definition:
      "The region of space around Earth controlled by our planet's magnetic field. Extends ~60,000 km on the sunward side, forming a protective bubble that shields us from most solar wind and cosmic rays. Compressed by solar wind, extended on the nightside.",
  },
  {
    term: "proton flux",
    definition:
      "The number of high‑energy protons passing through a given area per unit time. Measured in particles/(cm²·sr·s). >10 MeV proton flux >10 pfu indicates an S1 radiation storm; >100 pfu indicates S2.",
  },
  {
    term: "southward IMF",
    definition:
      "When the interplanetary magnetic field points southward (negative Bz), it can reconnect with Earth's northward‑pointing magnetic field, opening a 'door' for solar wind energy to enter the magnetosphere. This is the primary driver of geomagnetic storms and auroral activity.",
  },
];
