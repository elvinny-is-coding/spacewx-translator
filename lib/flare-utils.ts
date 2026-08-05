// lib/flare-utils.ts

export interface FlareClassification {
  letter: "C" | "M" | "X";
  number: number;
  fullClass: string;
  isNotable: boolean;
  category: "background" | "minor" | "major" | "extreme";
}

export function classifyFlare(classType: string): FlareClassification | null {
  const match = classType.match(/^([CXM])(\d+\.?\d*)$/i);
  if (!match) return null;

  const letter = match[1].toUpperCase() as "C" | "M" | "X";
  const number = parseFloat(match[2]);
  const fullClass = `${letter}${number}`;

  // Determine notability (M5+ and X-class are notable)
  const isNotable = letter === "X" || (letter === "M" && number >= 5);

  // Determine category
  let category: FlareClassification["category"];
  if (letter === "X") {
    category = number >= 5 ? "extreme" : "major";
  } else if (letter === "M") {
    category = number >= 5 ? "major" : "minor";
  } else {
    category = "background";
  }

  return {
    letter,
    number,
    fullClass,
    isNotable,
    category,
  };
}

export function getFlareImpactDescription(
  classification: FlareClassification,
): string {
  switch (classification.category) {
    case "extreme":
      return "Widespread HF radio blackout on sunlit side, satellite drag, radiation risk";
    case "major":
      return "Limited HF radio blackout, satellite effects possible, polar radiation risk";
    case "minor":
      return "Minor HF radio blackout at high latitudes, minimal satellite effects";
    case "background":
      return "No significant impacts expected";
    default:
      return "Unknown impact";
  }
}
