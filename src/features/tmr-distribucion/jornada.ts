import type { TmrRow } from "./api";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export interface JornadaDay {
  key: string;
  label: string;
  count: number;
}

export function wallDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dayKeyFromIso(iso: string | null): string {
  const d = wallDate(iso);
  if (!d) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Día de ejecución: En-Route, si no llegada a sitio, si no Start. */
export function executionDayKey(row: TmrRow): string {
  return dayKeyFromIso(row.enRouteAt) || dayKeyFromIso(row.arrivedSiteAt) || dayKeyFromIso(row.startTime);
}

export function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${DIAS[date.getUTCDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function formatClock(iso: string | null): string {
  const d = wallDate(iso);
  if (!d) return "—";
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function formatTs(iso: string | null): string {
  const d = wallDate(iso);
  if (!d) return "—";
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()} ${formatClock(iso)}`;
}

export function formatSpan(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) return "—";
  const abs = Math.abs(hours);
  if (abs < 1) return `${Math.round(abs * 60)} min`;
  const h = Math.floor(abs);
  const min = Math.round((abs - h) * 60);
  return min ? `${h} h ${min} min` : `${h} h`;
}

export function hoursBetween(start: string | null, end: string | null): number | null {
  const a = wallDate(start);
  const b = wallDate(end);
  if (!a || !b) return null;
  return (b.getTime() - a.getTime()) / 3_600_000;
}

export function crewsWithDays(rows: TmrRow[]): { crew: string; days: JornadaDay[] }[] {
  const byCrew = new Map<string, Map<string, number>>();
  for (const row of rows) {
    if (!row.crew) continue;
    const day = executionDayKey(row);
    if (!day) continue;
    const days = byCrew.get(row.crew) ?? new Map<string, number>();
    days.set(day, (days.get(day) ?? 0) + 1);
    byCrew.set(row.crew, days);
  }
  return [...byCrew.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "es"))
    .map(([crew, days]) => ({
      crew,
      days: [...days.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, count]) => ({ key, label: formatDayLabel(key), count })),
    }));
}

export function jornadaRows(rows: TmrRow[], crew: string, day: string): TmrRow[] {
  return rows
    .filter((row) => row.crew === crew && executionDayKey(row) === day)
    .sort((a, b) => {
      const ta = wallDate(a.enRouteAt || a.startTime)?.getTime() ?? 0;
      const tb = wallDate(b.enRouteAt || b.startTime)?.getTime() ?? 0;
      return ta - tb;
    });
}

export function jornadaTotals(items: TmrRow[]) {
  const first = items[0];
  const last = items[items.length - 1];
  return {
    count: items.length,
    trabajo: hoursBetween(first?.enRouteAt || first?.startTime || null, last?.completedAt || null),
    tmrUten: items.reduce((sum, row) => sum + (row.tmrDuracionUten ?? 0), 0),
    sobre: items.filter((row) => row.sobreAsignacion).length,
  };
}
