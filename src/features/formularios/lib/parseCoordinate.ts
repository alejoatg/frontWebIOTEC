/**
 * Normaliza lat/lng que pueden venir como number, string o Decimal serializado.
 */
export function parseCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const n = Number(value.trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }

  // Prisma Decimal / Decimal.js a veces llega como objeto con toString numérico
  if (typeof value === "object") {
    const obj = value as { toString?: () => string; toNumber?: () => number };
    if (typeof obj.toNumber === "function") {
      const n = obj.toNumber();
      return Number.isFinite(n) ? n : null;
    }
    if (typeof obj.toString === "function") {
      const s = obj.toString();
      if (s && s !== "[object Object]") {
        const n = Number(s.replace(",", "."));
        return Number.isFinite(n) ? n : null;
      }
    }
  }

  return null;
}

export function hasValidCoordinates(lat: unknown, lng: unknown): boolean {
  const a = parseCoordinate(lat);
  const b = parseCoordinate(lng);
  if (a == null || b == null) return false;
  if (a === 0 && b === 0) return false;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return false;
  return true;
}
