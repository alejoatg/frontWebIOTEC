/**
 * Formatea fechas de solo día (workDate, rangos) sin desfase por zona horaria.
 * La API guarda `@db.Date` como medianoche UTC; `toLocaleDateString` local
 * en Colombia (UTC−5) mostraría el día anterior.
 */
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const sliced = iso.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(sliced) ? sliced : iso;
  }
  return d.toLocaleDateString("es-CO", { timeZone: "UTC" });
}

/** `YYYY-MM-DD` en UTC para inputs type="date" y rutas. */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const sliced = iso.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(sliced) ? sliced : "";
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Año calendario UTC de un ISO date-only / DateTime de fecha labor. */
export function dateOnlyYear(iso: string): number {
  return new Date(iso).getUTCFullYear();
}

/** Mes calendario UTC (1–12) de un ISO date-only / DateTime de fecha labor. */
export function dateOnlyMonth(iso: string): number {
  return new Date(iso).getUTCMonth() + 1;
}
