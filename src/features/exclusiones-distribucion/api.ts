import { API_URL } from "@/lib/api";

const BASE = `${API_URL}/api/exclusiones`;

export interface WorkflowCase {
  caso: string;
  responsable: string;
  circuitos: string[];
  codigos: string[];
  causa: string;
  clasificacion: string;
  ordenPublico: boolean;
  fechaInicio: string | null;
  fechaFin: string | null;
  asociados: string[];
  veredas: string[];
}

export interface WorkflowContratista {
  nombre: string;
  pendientes: number;
  ordenPublico: number;
}

export interface WorkflowPreview {
  totalRows: number;
  pendientes: number;
  contratistas: WorkflowContratista[];
  casos: WorkflowCase[];
}

export interface ExclusionOptions {
  strictAssociation: boolean;
  cleanNotes: boolean;
  template?: File | null;
}

function formData(file: File, options: ExclusionOptions, extra?: Record<string, string>) {
  const fd = new FormData();
  fd.append("file", file);
  if (options.template) fd.append("template", options.template);
  fd.append("strictAssociation", options.strictAssociation ? "true" : "false");
  fd.append("cleanNotes", options.cleanNotes ? "true" : "false");
  if (extra) {
    for (const [key, value] of Object.entries(extra)) fd.append(key, value);
  }
  return fd;
}

async function errorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const msg = (body as { message?: string | string[] }).message ?? `Error ${res.status}`;
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

function filenameFrom(res: Response, fallback: string): string {
  const header = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? fallback;
}

async function saveBlob(res: Response, fallback: string): Promise<string[]> {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filenameFrom(res, fallback);
  a.click();
  URL.revokeObjectURL(url);
  return (res.headers.get("X-Exclusion-Cases") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function previewExclusiones(
  file: File,
  options: ExclusionOptions,
): Promise<WorkflowPreview> {
  const res = await fetch(`${BASE}/preview`, {
    method: "POST",
    credentials: "include",
    body: formData(file, options),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<WorkflowPreview>;
}

export async function downloadOrdenPublico(
  file: File,
  options: ExclusionOptions,
  payload: {
    responsable: string;
    coordinador: string;
    municipios: string[];
    circuitos: string[];
    descripcion: string;
    excludeCaseIds: string[];
    soportes: File[];
  },
): Promise<string[]> {
  const fd = formData(file, options, {
    responsable: payload.responsable,
    coordinador: payload.coordinador,
    municipios: JSON.stringify(payload.municipios),
    circuitos: JSON.stringify(payload.circuitos),
    descripcion: payload.descripcion,
    excludeCaseIds: JSON.stringify(payload.excludeCaseIds),
  });
  for (const soporte of payload.soportes) fd.append("soportes", soporte);
  const res = await fetch(`${BASE}/orden-publico`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return saveBlob(res, "exclusion-orden-publico.xlsx");
}

export async function downloadIndividuales(
  file: File,
  options: ExclusionOptions,
  payload: {
    responsable: string;
    coordinador: string;
    excludeCaseIds: string[];
    batchSize: number;
    batchIndex: number;
  },
): Promise<{ cases: string[]; total: number }> {
  const res = await fetch(`${BASE}/individuales`, {
    method: "POST",
    credentials: "include",
    body: formData(file, options, {
      responsable: payload.responsable,
      coordinador: payload.coordinador,
      excludeCaseIds: JSON.stringify(payload.excludeCaseIds),
      batchSize: String(payload.batchSize),
      batchIndex: String(payload.batchIndex),
    }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const cases = await saveBlob(res, `exclusiones-individuales-lote-${payload.batchIndex + 1}.zip`);
  return { cases, total: Number(res.headers.get("X-Exclusion-Total") ?? cases.length) };
}

export async function downloadConsolidado(
  file: File,
  options: ExclusionOptions,
  payload: { responsable: string; coordinador: string; caseIds: string[] },
): Promise<void> {
  const res = await fetch(`${BASE}/consolidado`, {
    method: "POST",
    credentials: "include",
    body: formData(file, options, {
      responsable: payload.responsable,
      coordinador: payload.coordinador,
      caseIds: JSON.stringify(payload.caseIds),
    }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  await saveBlob(res, "ConsolidadoUTEN.xlsx");
}
