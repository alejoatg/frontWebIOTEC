import { API_URL } from "@/lib/api";
import type {
  CreateFlujoProgramacionPayload,
  FlujoAtencion,
  FlujoListFilter,
  FlujoListResponse,
} from "./types";

const BASE = `${API_URL}/api/flujo-atencion`;

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}));
  const msg = (body as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg) return msg;
  return fallback;
}

function toParams(filter: FlujoListFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.fechaDesde) params.set("fechaDesde", filter.fechaDesde);
  if (filter.fechaHasta) params.set("fechaHasta", filter.fechaHasta);
  if (filter.search?.trim()) params.set("search", filter.search.trim());
  params.set("page", String(filter.page ?? 1));
  params.set("pageSize", String(filter.pageSize ?? 50));
  return params;
}

export async function fetchFlujos(filter: FlujoListFilter): Promise<FlujoListResponse> {
  const response = await fetch(`${BASE}?${toParams(filter).toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Error al consultar flujos"));
  }
  return response.json();
}

export async function fetchFlujo(id: string): Promise<FlujoAtencion> {
  const response = await fetch(`${BASE}/${id}`, { credentials: "include" });
  if (!response.ok) {
    if (response.status === 404) throw new Error("Flujo no encontrado");
    throw new Error(await readError(response, "Error al cargar el flujo"));
  }
  return response.json();
}

export async function createFlujoProgramacion(
  payload: CreateFlujoProgramacionPayload,
): Promise<FlujoAtencion> {
  const response = await fetch(`${BASE}/programaciones`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo crear la programación"));
  }
  return response.json();
}

export async function downloadFlujosExcel(filter: FlujoListFilter): Promise<void> {
  const params = toParams(filter);
  params.delete("page");
  params.delete("pageSize");
  const response = await fetch(`${BASE}/export?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo exportar el Excel"));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flujos-atencion.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
