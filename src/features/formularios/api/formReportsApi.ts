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

/** Descarga todas las páginas del listado actual según los filtros aplicados. */
export async function fetchAllFormReportPages(
  config: FormReportConfig,
  filter: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const pageSize = Number(filter.pageSize ?? 50);
  const all: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await fetchFormReportList(config, { ...filter, page, pageSize });
    all.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  }
  return all;
}

const EXPORT_DETAIL_CONCURRENCY = 6;

/** Obtiene el detalle completo de cada registro (mismos datos que la pantalla de detalle). */
export async function fetchAllFormReportDetailsForExport(
  config: FormReportConfig,
  filter: Record<string, unknown>,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Record<string, unknown>[]> {
  const listRows = await fetchAllFormReportPages(config, filter);
  const ids = listRows
    .map((row) => (row.id != null ? String(row.id) : ""))
    .filter(Boolean);

  if (ids.length === 0) return [];

  const records: Record<string, unknown>[] = [];

  for (let i = 0; i < ids.length; i += EXPORT_DETAIL_CONCURRENCY) {
    const batch = ids.slice(i, i + EXPORT_DETAIL_CONCURRENCY);
    const batchRecords = await Promise.all(
      batch.map((id) => fetchFormReportById(config, id)),
    );
    records.push(...batchRecords);
    onProgress?.(Math.min(i + batch.length, ids.length), ids.length);
  }

  return records;
}
