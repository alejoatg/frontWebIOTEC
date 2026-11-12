import type { TmrRow, TmrSobreRelacion } from "./api";

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

export function formatSobreRelacion(rel: TmrSobreRelacion | null | undefined): string {
  if (!rel) return "";
  const start = formatClock(rel.startTime);
  const tmr = formatSpan(rel.tmrDuracion);
  return `job ${rel.jobSerial}${rel.caseSerial ? ` caso ${rel.caseSerial}` : ""}, Start ${start} (+${rel.minutosDespues} min), TMR ${tmr}`;
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

export const TMR_WATCH_H = 5;
export const TMR_ALERT_H = 8;

function wallMinutesIso(iso: string | null): number | null {
  const d = wallDate(iso);
  if (!d) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function tmrIncumplido(row: TmrRow): boolean {
  return (
    (row.tmrDuracion != null && row.tmrDuracion > TMR_ALERT_H) ||
    (row.tmrDuracionUten != null && row.tmrDuracionUten > TMR_ALERT_H) ||
    row.rango2Uten === "R>8 H" ||
    row.exclusion === "No cumple el TMR" ||
    row.exclusionAuto === "No cumple el TMR"
  );
}

/** Motivo probable de exclusión cuando el TMR CEO o UTEN supera 8 h. */
export function possibleExclusionReason(row: TmrRow): string | null {
  if (!tmrIncumplido(row)) return null;
  const startMin = wallMinutesIso(row.startTime);
  const enRouteMin = wallMinutesIso(row.enRouteAt);
  const beforeOpen = startMin != null && startMin < 7 * 60;
  const enRouteInJornada =
    enRouteMin != null && (row.nextDayEnRoute || enRouteMin >= 7 * 60);
  const corte = row.lateOk ? "21:00" : "16:00";

  if (row.afterCutoff && row.nextDayEnRoute) {
    return `Fuera del horario laboral: Start después de ${corte} y En ruta al día siguiente. El TMR CEO cuenta la espera; UTEN usa el Start validado.`;
  }
  if (beforeOpen && enRouteInJornada) {
    return "Fuera del horario laboral: Start antes de las 7:00 y En ruta ya en jornada. El TMR CEO se infla con la espera de madrugada.";
  }
  const sobre = row.sobreAsignacion || row.causas?.includes("Sobreasignación");
  const cpl = row.nextDayEnRoute || row.causas?.includes("Pendiente de logística especial");
  const rel = formatSobreRelacion(row.sobreRelacion);
  if (sobre && cpl) {
    return `Sobreasignación (principal)${rel ? `: ${rel}` : ": otra orden de la misma brigada en 30 min"} y el TMR supera 8 h. También aplica logística especial: En ruta es otro día.`;
  }
  if (cpl) {
    return "Pendiente de logística especial: En ruta es otro día. El TMR CEO incluye la espera nocturna.";
  }
  if (sobre) {
    return `Sobreasignación${rel ? `: ${rel}` : ": otra orden de la misma brigada en 30 min"} y el TMR supera 8 h.`;
  }
  return "TMR incumplido (más de 8 h) sin causal automático de horario, madrugada ni logística. Revisar desplazamiento, servicio o asignación.";
}

export type DayTone = "idle" | "ok" | "watch" | "alert";

export interface JornadaDayStat {
  key: string;
  count: number;
  tmrMedio: number | null;
  rOver: number;
  tone: DayTone;
}

export function monthKeyFromDay(day: string): string {
  return day.slice(0, 7);
}

export function crewMonths(rows: TmrRow[], crew: string): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.crew !== crew) continue;
    const day = executionDayKey(row);
    if (day) set.add(monthKeyFromDay(day));
  }
  return [...set].sort();
}

function mean(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function dayTone(count: number, tmrMedio: number | null, rOver: number): DayTone {
  if (!count) return "idle";
  if ((tmrMedio != null && tmrMedio > TMR_ALERT_H) || rOver >= 2) return "alert";
  if (rOver > 0 || (tmrMedio != null && tmrMedio > TMR_WATCH_H)) return "watch";
  return "ok";
}

export function crewDayStats(rows: TmrRow[], crew: string, month: string): Record<string, JornadaDayStat> {
  const byDay = new Map<string, TmrRow[]>();
  for (const row of rows) {
    if (row.crew !== crew) continue;
    const day = executionDayKey(row);
    if (!day || monthKeyFromDay(day) !== month) continue;
    const list = byDay.get(day);
    if (list) list.push(row);
    else byDay.set(day, [row]);
  }
  const out: Record<string, JornadaDayStat> = {};
  for (const [key, list] of byDay) {
    const tmrMedio = mean(list.map((row) => row.tmrDuracionUten));
    const rOver = list.filter((row) => row.rango2Uten === "R>8 H").length;
    out[key] = {
      key,
      count: list.length,
      tmrMedio,
      rOver,
      tone: dayTone(list.length, tmrMedio, rOver),
    };
  }
  return out;
}

export function nextDayKey(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  const date = new Date(Date.UTC(y, m - 1, d + 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function daysSpannedByOrder(row: TmrRow): string[] {
  const start = dayKeyFromIso(row.startTime);
  const end =
    dayKeyFromIso(row.completedAt) || dayKeyFromIso(row.enRouteAt) || dayKeyFromIso(row.arrivedSiteAt) || start;
  if (!start) return end ? [end] : [];
  if (!end || end === start) return [start];
  const days: string[] = [];
  let cur = start;
  while (cur <= end && days.length < 4) {
    days.push(cur);
    cur = nextDayKey(cur);
  }
  return days;
}

const DAY_STAMPS = [
  "startTime",
  "assignedAt",
  "acknowledgedAt",
  "arrivedShopAt",
  "enRouteAt",
  "arrivedSiteAt",
  "completedAt",
  "closedAt",
] as const;

function earliestIso(values: Array<string | null | undefined>): string | null {
  const dates = values
    .map((iso) => (iso ? wallDate(iso) : null))
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => a.getTime() - b.getTime());
  return dates[0] ? dates[0].toISOString() : null;
}

function latestIso(values: Array<string | null | undefined>): string | null {
  const dates = values
    .map((iso) => (iso ? wallDate(iso) : null))
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0] ? dates[0].toISOString() : null;
}

export function orderTouchesDay(row: TmrRow, day: string): boolean {
  if (executionDayKey(row) === day) return true;
  return DAY_STAMPS.some((key) => dayKeyFromIso(row[key]) === day);
}

export interface JornadaDiaResumen {
  key: string;
  label: string;
  inicio: string | null;
  fin: string | null;
  ordenes: TmrRow[];
}

export function jornadaBounds(ordenes: TmrRow[], day?: string): { inicio: string | null; fin: string | null } {
  const onDay = (iso: string | null | undefined) => !day || dayKeyFromIso(iso ?? null) === day;
  const desp = ordenes.map((row) => (onDay(row.enRouteAt) ? row.enRouteAt : null));
  const inicios = desp.some(Boolean) ? desp : ordenes.map((row) => (onDay(row.startTime) ? row.startTime : null));
  const cierres = ordenes.map((row) => {
    if (onDay(row.closedAt)) return row.closedAt;
    if (onDay(row.completedAt)) return row.completedAt;
    return null;
  });
  return {
    inicio: earliestIso(inicios),
    fin: latestIso(cierres),
  };
}

export function jornadaContexto(rows: TmrRow[], order: TmrRow): JornadaDiaResumen[] {
  if (!order.crew) return [];
  return daysSpannedByOrder(order).map((key) => {
    const ordenes = rows
      .filter((row) => row.crew === order.crew && orderTouchesDay(row, key))
      .sort((a, b) => {
        const ta = wallDate(a.startTime || a.enRouteAt)?.getTime() ?? 0;
        const tb = wallDate(b.startTime || b.enRouteAt)?.getTime() ?? 0;
        return ta - tb;
      });
    const { inicio, fin } = jornadaBounds(ordenes, key);
    return {
      key,
      label: formatDayLabel(key),
      inicio,
      fin,
      ordenes,
    };
  });
}

export function muestraJornadaNoCumple(row: TmrRow): boolean {
  return row.exclusion === "No cumple el TMR" || row.exclusionAuto === "No cumple el TMR";
}

export function jornadaTotals(items: TmrRow[]) {
  const { inicio, fin } = jornadaBounds(items);
  return {
    count: items.length,
    inicio,
    fin,
    trabajo: hoursBetween(inicio, fin),
    tmrUten: items.reduce((sum, row) => sum + (row.tmrDuracionUten ?? 0), 0),
    sobre: items.filter((row) => row.sobreAsignacion).length,
  };
}
