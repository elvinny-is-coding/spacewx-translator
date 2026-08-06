// lib/validation.ts

export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength).trim();
}

export function validateAudience(
  audience: unknown,
): audience is "general" | "educator" | "technical" {
  return (
    audience === "general" ||
    audience === "educator" ||
    audience === "technical"
  );
}

export function validateNumber(
  input: unknown,
  min = 0,
  max = Infinity,
): number | null {
  if (typeof input !== "number") return null;
  if (!Number.isFinite(input)) return null;
  if (input < min || input > max) return null;
  return input;
}

export function validateDate(input: unknown): Date | null {
  if (typeof input !== "string") return null;
  const date = new Date(input);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function validateEmail(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
}
