import { API_URL } from "@/lib/api";

const BASE = `${API_URL}/api/exclusiones`;

export interface ExclusionGroupPreview {
  caseIds: string[];
  rowCount: number;
  multiCase: boolean;
  caseLabel: string;
  circuitos: string[];
  fechaInicio: string | null;
  fechaFin: string | null;
  clasificacion: string;
  causa: string;
  filename: string;
}

export interface ExclusionPreviewResult {
  totalRows: number;
  distinctCases: number;
  totalGroups: number;
  reportableGroups: number;
  multiCaseGroups: number;
  associationLinks: number;
  groups: ExclusionGroupPreview[];
}

function formData(
  file: File,
  options: { strictAssociation: boolean; cleanNotes: boolean; template?: File | null },
  extra?: Record<string, string>,
) {
  const fd = new FormData();
  fd.append("file", file);
  if (options.template) fd.append("template", options.template);
  fd.append("strictAssociation", options.strictAssociation ? "true" : "false");
  fd.append("cleanNotes", options.cleanNotes ? "true" : "false");
  if (extra) {
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  }
  return fd;
}

async function errorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const msg = (body as { message?: string | string[] }).message ?? `Error ${res.status}`;
  return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

export async function previewExclusiones(
  file: File,
  options: { strictAssociation: boolean; cleanNotes: boolean },
): Promise<ExclusionPreviewResult> {
  const res = await fetch(`${BASE}/preview`, {
    method: "POST",
    credentials: "include",
    body: formData(file, options),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<ExclusionPreviewResult>;
}

export async function downloadExclusionesZip(
  file: File,
  options: {
    strictAssociation: boolean;
    cleanNotes: boolean;
    template?: File | null;
    batchSize?: number;
    batchIndex?: number;
  },
): Promise<void> {
  const extra: Record<string, string> = {};
  if (options.batchSize && options.batchSize > 0) {
    extra.batchSize = String(options.batchSize);
    extra.batchIndex = String(options.batchIndex ?? 0);
  }
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    credentials: "include",
    body: formData(file, options, extra),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const lote = options.batchSize ? `-lote-${(options.batchIndex ?? 0) + 1}` : "";
  a.download = `exclusiones-distribucion${lote}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
