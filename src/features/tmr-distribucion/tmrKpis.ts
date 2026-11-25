import type { TmrRow } from "./api";

export type TmrAmbito = "rural" | "urbano" | "otro";

export interface TmrKpis {
  uten: number;
  r8Frio: number;
  r8Validado: number;
  cumple: number;
  noCumple: number;
  cpl: number;
  fhl: number;
  sobreasignacion: number;
  manual: number;
}

const EMPTY: TmrKpis = {
  uten: 0,
  r8Frio: 0,
  r8Validado: 0,
  cumple: 0,
  noCumple: 0,
  cpl: 0,
  fhl: 0,
  sobreasignacion: 0,
  manual: 0,
};

export function tmrAmbito(ubicacion: string): TmrAmbito {
  const key = ubicacion
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
  if (key.includes("RURAL")) return "rural";
  if (key.includes("URBAN")) return "urbano";
  return "otro";
}

export function kpisFromRows(rows: TmrRow[]): TmrKpis {
  const k = { ...EMPTY, uten: rows.length };
  for (const row of rows) {
    if (row.tmrDuracion != null && Number.isFinite(row.tmrDuracion) && row.tmrDuracion <= 8) {
      k.r8Frio += 1;
    }
    if (row.rango2Uten === "R<8 H") k.r8Validado += 1;
    if (row.exclusion === "Cumple TMR") k.cumple += 1;
    else if (row.exclusion === "No cumple el TMR") k.noCumple += 1;
    else if (row.exclusion === "Pendiente de logística especial") k.cpl += 1;
    else if (row.exclusion === "Fuera del horario laboral") k.fhl += 1;
    else if (row.exclusion === "Sobreasignación") k.sobreasignacion += 1;
    else if (row.exclusion === "Validación manual") k.manual += 1;
  }
  return k;
}

export function kpisByAmbito(rows: TmrRow[]) {
  const rural: TmrRow[] = [];
  const urbano: TmrRow[] = [];
  const otro: TmrRow[] = [];
  for (const row of rows) {
    const ambito = tmrAmbito(row.ubicacion);
    if (ambito === "rural") rural.push(row);
    else if (ambito === "urbano") urbano.push(row);
    else otro.push(row);
  }
  return {
    general: kpisFromRows(rows),
    rural: kpisFromRows(rural),
    urbano: kpisFromRows(urbano),
    otro: kpisFromRows(otro),
  };
}
