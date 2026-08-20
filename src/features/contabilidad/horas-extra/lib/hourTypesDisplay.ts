/**
 * Formatea horas por categoría para listas (preview, mis registros).
 * Ej.: "TSD 2 · TSN 1"
 */

const HOUR_TYPE_ORDER = [
  "RD",
  "RN",
  "TSD",
  "TSN",
  "HEDD",
  "HEND",
  "DISPONIBILIDAD",
] as const;

export type HourTypeCode = (typeof HOUR_TYPE_ORDER)[number];

export function sumHourTypes(
  hours: Partial<Record<HourTypeCode, number | null | undefined>> | null | undefined,
): number {
  if (!hours) return 0;
  return HOUR_TYPE_ORDER.reduce((acc, code) => {
    const n = Number(hours[code] ?? 0);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export function formatHourTypes(
  hours: Partial<Record<HourTypeCode, number | null | undefined>> | null | undefined,
): string {
  if (!hours) return "—";
  const parts: string[] = [];
  for (const code of HOUR_TYPE_ORDER) {
    const n = Number(hours[code] ?? 0);
    if (Number.isFinite(n) && n > 0) {
      const label = code === "DISPONIBILIDAD" ? "Disp." : code;
      parts.push(
        `${label} ${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`,
      );
    }
  }
  return parts.length ? parts.join(" · ") : "—";
}

/** Desde campos planos de un registro TS. */
export function hoursFromEntry(entry: {
  hoursRd?: number | null;
  hoursRn?: number | null;
  hoursTsd?: number | null;
  hoursTsn?: number | null;
  hoursHedd?: number | null;
  hoursHend?: number | null;
  hoursDisponibilidad?: number | null;
  hoursCategoriesTotal?: number | null;
}): { total: number; types: string } {
  const hours = {
    RD: entry.hoursRd,
    RN: entry.hoursRn,
    TSD: entry.hoursTsd,
    TSN: entry.hoursTsn,
    HEDD: entry.hoursHedd,
    HEND: entry.hoursHend,
    DISPONIBILIDAD: entry.hoursDisponibilidad,
  };
  const total =
    entry.hoursCategoriesTotal != null && Number.isFinite(Number(entry.hoursCategoriesTotal))
      ? Number(entry.hoursCategoriesTotal)
      : sumHourTypes(hours);
  return { total, types: formatHourTypes(hours) };
}
