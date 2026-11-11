import { API_URL } from "@/lib/api";

const BASE = `${API_URL}/api/tmr-distribucion`;

export const TMR_EXCLUSIONS = [
  "Cumple TMR",
  "No cumple el TMR",
  "Pendiente de logística especial",
  "Fuera del horario laboral",
  "Sobreasignación",
] as const;

export type TmrExclusion = (typeof TMR_EXCLUSIONS)[number];

export interface TmrRow {
  id: string;
  caseSerial: string;
  ticketSerial: string;
  jobSerial: string;
  crew: string;
  municipality: string;
  nucleo: string;
  ubicacion: string;
  workType: string;
  circuitCode: string;
  location: string;
  cause: string;
  deviceCause: string;
  weatherCause: string;
  caseDescription: string;
  ticketDescription: string;
  createdAt: string | null;
  startTime: string | null;
  assignedAt: string | null;
  acknowledgedAt: string | null;
  arrivedShopAt: string | null;
  enRouteAt: string | null;
  arrivedSiteAt: string | null;
  completedAt: string | null;
  startValidado: string | null;
  startValidadoFuente: "start" | "enRoute" | "";
  dia: string;
  tmrGen: number | null;
  tmrAsig: number | null;
  tmrAlist: number | null;
  tmrDesp: number | null;
  tmrSer: number | null;
  tmrDuracion: number | null;
  tmrDuracionUten: number | null;
  rangoUten: string;
  rango2Uten: string;
  sobreAsignacion: boolean;
  afterCutoff: boolean;
  nextDayEnRoute: boolean;
  lateOk: boolean;
  exclusion: TmrExclusion | "";
  exclusionAuto: TmrExclusion | "";
  observacion: string;
  notaCeo: string;
  jobComment: string;
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

export async function previewTmr(): Promise<TmrPreview> {
  const res = await fetch(`${BASE}/preview`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<TmrPreview>;
}

export async function downloadTmrExcel(overrides: Record<string, TmrOverride>): Promise<void> {
  const res = await fetch(`${BASE}/excel`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
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
