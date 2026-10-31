import type { TmrRow } from "./api";
import { executionDayKey } from "./jornada";

export type RecidivaTipo = "unico" | "relacionados" | "reincidencia" | "reiterativa";

export interface RecidivaGrupo {
  key: string;
  circuitCode: string;
  location: string;
  jobs: number;
  eventos: number;
  casos: number;
  tickets: number;
  dias: number;
  tipo: RecidivaTipo;
  workTypes: { name: string; count: number }[];
  causes: { name: string; count: number }[];
  deviceCauses: { name: string; count: number }[];
  weatherCauses: { name: string; count: number }[];
  rows: TmrRow[];
}

function norm(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function eventId(row: TmrRow): string {
  return norm(row.ticketSerial) || norm(row.caseSerial) || norm(row.jobSerial) || row.id;
}

function tally(values: string[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const raw of values) {
    const name = raw.trim() || "(sin dato)";
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));
}

function classify(jobs: number, eventos: number, dias: number): RecidivaTipo {
  if (eventos <= 1) return jobs > 1 ? "relacionados" : "unico";
  if (eventos >= 3 && dias >= 2) return "reiterativa";
  if (eventos >= 2) return "reincidencia";
  return "relacionados";
}

export function buildReincidencias(rows: TmrRow[]): RecidivaGrupo[] {
  const groups = new Map<string, TmrRow[]>();
  for (const row of rows) {
    const circuit = norm(row.circuitCode) || "(sin circuito)";
    const location = norm(row.location) || "(sin location)";
    const key = `${circuit}||${location}`;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  return [...groups.entries()]
    .map(([key, list]) => {
      const eventos = new Set(list.map(eventId)).size;
      const casos = new Set(list.map((row) => norm(row.caseSerial)).filter(Boolean)).size;
      const tickets = new Set(list.map((row) => norm(row.ticketSerial)).filter(Boolean)).size;
      const dias = new Set(list.map(executionDayKey).filter(Boolean)).size;
      const [circuitCode, location] = key.split("||");
      return {
        key,
        circuitCode,
        location,
        jobs: list.length,
        eventos,
        casos: casos || eventos,
        tickets,
        dias,
        tipo: classify(list.length, eventos, dias),
        workTypes: tally(list.map((row) => row.workType)),
        causes: tally(list.map((row) => row.cause)),
        deviceCauses: tally(list.map((row) => row.deviceCause)),
        weatherCauses: tally(list.map((row) => row.weatherCause)),
        rows: [...list].sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")),
      };
    })
    .sort((a, b) => b.eventos - a.eventos || b.jobs - a.jobs || a.circuitCode.localeCompare(b.circuitCode, "es"));
}

export function recidivaResumen(groups: RecidivaGrupo[]) {
  return {
    elementos: groups.length,
    reincidencias: groups.filter((item) => item.tipo === "reincidencia" || item.tipo === "reiterativa").length,
    reiterativas: groups.filter((item) => item.tipo === "reiterativa").length,
    relacionados: groups.filter((item) => item.tipo === "relacionados").length,
    eventos: groups.reduce((sum, item) => sum + item.eventos, 0),
  };
}

export const RECIDIVA_LABEL: Record<RecidivaTipo, string> = {
  unico: "Una sola falla",
  relacionados: "Casos relacionados",
  reincidencia: "Reincidencia",
  reiterativa: "Reiterativa",
};
