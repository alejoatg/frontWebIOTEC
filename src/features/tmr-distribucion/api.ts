import { API_URL } from "@/lib/api";

const BASE = `${API_URL}/api/tmr-distribucion`;

export const TMR_EXCLUSIONS = [
  "Cumple TMR",
  "No cumple el TMR",
  "Casos Pendiente de logística especial (CPL)",
  "fuera del Horario laboral (FHL)",
  "Sobreasignación",
] as const;

export type TmrExclusion = (typeof TMR_EXCLUSIONS)[number];

export interface TmrRow {
  id: string;
  caseSerial: string;
  jobSerial: string;
  crew: string;
  municipality: string;
  nucleo: string;
  ubicacion: string;
  workType: string;
  circuitCode: string;
  startTime: string | null;
  assignedAt: string | null;
  enRouteAt: string | null;
  arrivedSiteAt: string | null;
  completedAt: string | null;
  startValidado: string | null;
  dia: string;
  tmrDuracion: number | null;
  tmrDuracionUten: number | null;
  rangoUten: string;
  rango2Uten: string;
  sobreAsignacion: boolean;
  exclusion: TmrExclusion | "";
  exclusionAuto: TmrExclusion | "";
  observacion: string;
  notaCeo: string;
}

export interface TmrSummary {
  totalDatos: number;
  uten: number;
  omitted: number;
  brigadas: number;
  r8Frio: number;
  r8Validado: number;
  rOverFrio: number;
  rOverValidado: number;
  cumple: number;
  noCumple: number;
  cpl: number;
  fhl: number;
  sobreasignacion: number;
  sobreFlag: number;
  byUbicacion: { ubicacion: string; r8: number; rOver: number }[];
  byNucleo: {
    nucleo: string;
    count: number;
    tmrAvg: number;
    cumple: number;
    noCumple: number;
    cpl: number;
    fhl: number;
    sobre: number;
  }[];
}

export interface TmrPreview {
  summary: TmrSummary;
  rows: TmrRow[];
}

export interface TmrOverride {
  exclusion?: string;
  observacion?: string;
  notaCeo?: string;
}

async function errorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const msg = (body as { message?: string | string[] }).message ?? `Error ${res.status}`;
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export async function previewTmr(file: File): Promise<TmrPreview> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/preview`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<TmrPreview>;
}

export async function downloadTmrExcel(file: File, overrides: Record<string, TmrOverride>): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("overrides", JSON.stringify(overrides));
  const res = await fetch(`${BASE}/excel`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const blob = await res.blob();
  const header = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(header);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = match?.[1] ?? "TMR_Conciliado.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
