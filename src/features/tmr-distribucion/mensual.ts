import type { TmrRow } from "./api";
import { executionDayKey } from "./jornada";

export const DESP_LARGA_H = 2;
export const EJEC_LARGA_H = 3;

export interface CrewMonth {
  crew: string;
  actividades: number;
  diasConTrabajo: number;
  promedioPorDia: number;
  tmrUtenMedio: number | null;
  tmrFrioMedio: number | null;
  despMedio: number | null;
  ejecMedio: number | null;
  alistMedio: number | null;
  r8: number;
  rOver: number;
  cumple: number;
  noCumple: number;
  cpl: number;
  fhl: number;
  sobre: number;
  porDia: Record<string, TmrRow[]>;
  despLargos: TmrRow[];
  ejecLargas: TmrRow[];
}

function mean(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function monthKeyFromDay(day: string): string {
  return day.slice(0, 7);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 = lunes … 6 = domingo */
export function mondayIndex(month: string): number {
  const [y, m] = month.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  return (dow + 6) % 7;
}

export interface PlaceStat {
  name: string;
  jobs: number;
  despMedio: number | null;
  ejecMedio: number | null;
  despLargos: number;
  ejecLargas: number;
}

export interface MonthGeneral {
  actividades: number;
  despMedio: number | null;
  ejecMedio: number | null;
  alistMedio: number | null;
  tmrUtenMedio: number | null;
  despLargos: TmrRow[];
  ejecLargas: TmrRow[];
  nucleos: PlaceStat[];
  municipios: PlaceStat[];
}

export function rowsForMonth(rows: TmrRow[], month: string): TmrRow[] {
  return rows.filter((row) => {
    const day = executionDayKey(row);
    return Boolean(day && monthKeyFromDay(day) === month);
  });
}

function placeStats(rows: TmrRow[], nameOf: (row: TmrRow) => string): PlaceStat[] {
  const groups = new Map<string, TmrRow[]>();
  for (const row of rows) {
    const name = nameOf(row).trim() || "(sin dato)";
    const list = groups.get(name);
    if (list) list.push(row);
    else groups.set(name, [row]);
  }
  return [...groups.entries()]
    .map(([name, list]) => ({
      name,
      jobs: list.length,
      despMedio: mean(list.map((row) => row.tmrDesp)),
      ejecMedio: mean(list.map((row) => row.tmrSer)),
      despLargos: list.filter((row) => row.tmrDesp != null && row.tmrDesp > DESP_LARGA_H).length,
      ejecLargas: list.filter((row) => row.tmrSer != null && row.tmrSer > EJEC_LARGA_H).length,
    }))
    .sort((a, b) => (b.despMedio ?? -1) - (a.despMedio ?? -1) || b.jobs - a.jobs);
}

export function buildMonthGeneral(rows: TmrRow[], month: string): MonthGeneral {
  const list = rowsForMonth(rows, month);
  return {
    actividades: list.length,
    despMedio: mean(list.map((row) => row.tmrDesp)),
    ejecMedio: mean(list.map((row) => row.tmrSer)),
    alistMedio: mean(list.map((row) => row.tmrAlist)),
    tmrUtenMedio: mean(list.map((row) => row.tmrDuracionUten)),
    despLargos: [...list]
      .filter((row) => row.tmrDesp != null && row.tmrDesp > DESP_LARGA_H)
      .sort((a, b) => (b.tmrDesp ?? 0) - (a.tmrDesp ?? 0))
      .slice(0, 12),
    ejecLargas: [...list]
      .filter((row) => row.tmrSer != null && row.tmrSer > EJEC_LARGA_H)
      .sort((a, b) => (b.tmrSer ?? 0) - (a.tmrSer ?? 0))
      .slice(0, 12),
    nucleos: placeStats(list, (row) => row.nucleo),
    municipios: placeStats(list, (row) => row.municipality),
  };
}

export function availableMonths(rows: TmrRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const day = executionDayKey(row);
    if (day) set.add(monthKeyFromDay(day));
  }
  return [...set].sort();
}

export function buildCrewMonths(rows: TmrRow[], month: string): CrewMonth[] {
  const byCrew = new Map<string, TmrRow[]>();
  for (const row of rows) {
    if (!row.crew) continue;
    const day = executionDayKey(row);
    if (!day || monthKeyFromDay(day) !== month) continue;
    const list = byCrew.get(row.crew);
    if (list) list.push(row);
    else byCrew.set(row.crew, [row]);
  }

  return [...byCrew.entries()]
    .map(([crew, list]) => {
      const porDia: Record<string, TmrRow[]> = {};
      for (const row of list) {
        const day = executionDayKey(row);
        if (!porDia[day]) porDia[day] = [];
        porDia[day].push(row);
      }
      const diasConTrabajo = Object.keys(porDia).length;
      return {
        crew,
        actividades: list.length,
        diasConTrabajo,
        promedioPorDia: diasConTrabajo ? list.length / diasConTrabajo : 0,
        tmrUtenMedio: mean(list.map((row) => row.tmrDuracionUten)),
        tmrFrioMedio: mean(list.map((row) => row.tmrDuracion)),
        despMedio: mean(list.map((row) => row.tmrDesp)),
        ejecMedio: mean(list.map((row) => row.tmrSer)),
        alistMedio: mean(list.map((row) => row.tmrAlist)),
        r8: list.filter((row) => row.rango2Uten === "R<8 H").length,
        rOver: list.filter((row) => row.rango2Uten === "R>8 H").length,
        cumple: list.filter((row) => row.exclusion === "Cumple TMR").length,
        noCumple: list.filter((row) => row.exclusion === "No cumple el TMR").length,
        cpl: list.filter((row) => row.exclusion.includes("CPL")).length,
        fhl: list.filter((row) => row.exclusion.includes("FHL")).length,
        sobre: list.filter((row) => row.sobreAsignacion).length,
        porDia,
        despLargos: list
          .filter((row) => row.tmrDesp != null && row.tmrDesp > DESP_LARGA_H)
          .sort((a, b) => (b.tmrDesp ?? 0) - (a.tmrDesp ?? 0))
          .slice(0, 12),
        ejecLargas: list
          .filter((row) => row.tmrSer != null && row.tmrSer > EJEC_LARGA_H)
          .sort((a, b) => (b.tmrSer ?? 0) - (a.tmrSer ?? 0))
          .slice(0, 12),
      };
    })
    .sort((a, b) => b.actividades - a.actividades || a.crew.localeCompare(b.crew, "es"));
}

export function calendarCells(month: string): Array<{ day: number; key: string } | null> {
  const days = daysInMonth(month);
  const pad = mondayIndex(month);
  const cells: Array<{ day: number; key: string } | null> = Array.from({ length: pad }, () => null);
  for (let d = 1; d <= days; d++) {
    cells.push({ day: d, key: `${month}-${String(d).padStart(2, "0")}` });
  }
  return cells;
}

