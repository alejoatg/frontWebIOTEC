import { API_URL } from "@/lib/api";
import type { FormReportConfig } from "../config/formReportTypes";
import type { FormReportListResponse } from "../config/formReportTypes";
import type { PaginatedResponse } from "../types";

export async function fetchFormReportList(
  config: FormReportConfig,
  filter: Record<string, unknown>,
): Promise<FormReportListResponse> {
  const params = config.buildQueryParams(filter);
  const response = await fetch(`${API_URL}${config.apiBasePath}?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { message?: string }).message || "Error al consultar registros");
  }
  const json = (await response.json()) as PaginatedResponse<Record<string, unknown>>;
  const data = config.mapListRow
    ? json.data.map((row) => config.mapListRow!(row as Record<string, unknown>))
    : json.data;
  return { ...json, data };
}

export async function fetchFormReportById(
  config: FormReportConfig,
  id: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_URL}${config.apiBasePath}/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("Registro no encontrado");
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { message?: string }).message || "Error al cargar el registro");
  }
  const record = (await response.json()) as Record<string, unknown>;
  return config.mapDetailRecord ? config.mapDetailRecord(record) : record;
}

/** Descarga todas las páginas del listado actual (máx. 20 páginas × pageSize). */
export async function fetchAllFormReportPages(
  config: FormReportConfig,
  filter: Record<string, unknown>,
  maxPages = 20,
): Promise<Record<string, unknown>[]> {
  const pageSize = Number(filter.pageSize ?? 50);
  const all: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const result = await fetchFormReportList(config, { ...filter, page, pageSize });
    all.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  }
  return all;
}
