import type { TmrRow } from "./api";
import { lookupMunicipio, lookupNucleo, type GeoCenter } from "./geo-catalog";
import { DESP_LARGA_H, EJEC_LARGA_H, rowsForMonth } from "./mensual";

export type MapLevel = "municipio" | "nucleo";
export type MapMetric = "desp" | "ejec" | "tmr" | "jobs";

export interface MapJobLite {
  id: string;
  caseSerial: string;
  jobSerial: string;
  crew: string;
  startTime: string | null;
  tmrDesp: number | null;
}

export interface MapPoint {
  key: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  jobs: number;
  despMedio: number | null;
  ejecMedio: number | null;
  tmrUtenMedio: number | null;
  despLargos: number;
  ejecLargas: number;
  source: "catalogo" | "derivado";
  rows: MapJobLite[];
}

function mean(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function groupKey(row: TmrRow, level: MapLevel): string {
  return (level === "nucleo" ? row.nucleo : row.municipality).trim() || "(sin dato)";
}

function resolveCenter(name: string, level: MapLevel, rows: TmrRow[]): { center: GeoCenter; source: MapPoint["source"] } | null {
  if (level === "nucleo") {
    const known = lookupNucleo(name);
    if (known) return { center: known, source: "catalogo" };
    const pts = rows
      .map((row) => lookupMunicipio(row.municipality))
      .filter((item): item is GeoCenter => Boolean(item));
    if (!pts.length) return null;
    return {
      source: "derivado",
      center: {
        name,
        lat: pts.reduce((sum, item) => sum + item.lat, 0) / pts.length,
        lng: pts.reduce((sum, item) => sum + item.lng, 0) / pts.length,
      },
    };
  }
  const known = lookupMunicipio(name);
  return known ? { center: known, source: "catalogo" } : null;
}

export function buildMapPoints(rows: TmrRow[], month: string, level: MapLevel): {
  points: MapPoint[];
  unmatched: string[];
} {
  const list = rowsForMonth(rows, month);
  const groups = new Map<string, TmrRow[]>();
  for (const row of list) {
    const key = groupKey(row, level);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  const points: MapPoint[] = [];
  const unmatched: string[] = [];
  for (const [name, group] of groups) {
    const resolved = resolveCenter(name, level, group);
    if (!resolved) {
      unmatched.push(name);
      continue;
    }
    const nucleo = level === "nucleo" ? lookupNucleo(name) : null;
    points.push({
      key: name,
      name,
      subtitle: nucleo?.label || group[0]?.municipality || "",
      lat: resolved.center.lat,
      lng: resolved.center.lng,
      jobs: group.length,
      despMedio: mean(group.map((row) => row.tmrDesp)),
      ejecMedio: mean(group.map((row) => row.tmrSer)),
      tmrUtenMedio: mean(group.map((row) => row.tmrDuracionUten)),
      despLargos: group.filter((row) => row.tmrDesp != null && row.tmrDesp > DESP_LARGA_H).length,
      ejecLargas: group.filter((row) => row.tmrSer != null && row.tmrSer > EJEC_LARGA_H).length,
      source: resolved.source,
      rows: [...group]
        .sort((a, b) => (b.tmrDesp ?? -1) - (a.tmrDesp ?? -1))
        .slice(0, 10)
        .map((row) => ({
          id: row.id,
          caseSerial: row.caseSerial,
          jobSerial: row.jobSerial,
          crew: row.crew,
          startTime: row.startTime,
          tmrDesp: row.tmrDesp,
        })),
    });
  }

  points.sort((a, b) => (b.despMedio ?? -1) - (a.despMedio ?? -1) || b.jobs - a.jobs);
  unmatched.sort((a, b) => a.localeCompare(b, "es"));
  return { points, unmatched };
}

export function metricValue(point: MapPoint, metric: MapMetric): number | null {
  if (metric === "jobs") return point.jobs;
  if (metric === "ejec") return point.ejecMedio;
  if (metric === "tmr") return point.tmrUtenMedio;
  return point.despMedio;
}

export function heatColor(value: number | null, metric: MapMetric): string {
  if (value == null) return "#94a3b8";
  if (metric === "jobs") {
    if (value <= 50) return "#0f766e";
    if (value <= 150) return "#65a30d";
    if (value <= 300) return "#ca8a04";
    if (value <= 600) return "#ea580c";
    return "#b91c1c";
  }
  if (value <= 0.75) return "#0f766e";
  if (value <= 1.5) return "#65a30d";
  if (value <= 2) return "#ca8a04";
  if (value <= 3) return "#ea580c";
  return "#b91c1c";
}

export function circleRadius(point: MapPoint): number {
  return Math.min(36, 10 + Math.sqrt(point.jobs) * 1.6);
}
