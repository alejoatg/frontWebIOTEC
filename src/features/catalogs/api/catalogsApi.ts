import { API_URL } from "@/lib/api";
import type { CatalogItemOption, CatalogSummary } from "../types";

const BASE_PATH = `${API_URL}/api/catalogs`;

async function parseError(response: Response, fallback: string): Promise<never> {
  const error = await response.json().catch(() => ({}));
  throw new Error(
    typeof error.message === "string"
      ? error.message
      : Array.isArray(error.message)
        ? error.message[0]
        : fallback,
  );
}

export async function fetchCatalogs(includeInactive = false): Promise<CatalogSummary[]> {
  const params = includeInactive ? "?includeInactive=true" : "";
  const response = await fetch(`${BASE_PATH}${params}`, { credentials: "include" });
  if (!response.ok) {
    await parseError(response, "Error al consultar catálogos");
  }
  return response.json();
}

export async function fetchCatalog(code: string): Promise<CatalogSummary> {
  const response = await fetch(`${BASE_PATH}/${encodeURIComponent(code)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    await parseError(response, "Catálogo no encontrado");
  }
  return response.json();
}

export async function fetchCatalogItems(
  code: string,
  includeInactive = false,
): Promise<CatalogItemOption[]> {
  const params = includeInactive ? "?includeInactive=true&admin=true" : "";
  const response = await fetch(`${BASE_PATH}/${encodeURIComponent(code)}/items${params}`, {
    credentials: "include",
  });
  if (!response.ok) {
    await parseError(response, "Error al consultar ítems del catálogo");
  }
  return response.json();
}

export async function fetchCatalogItemsBatch(
  codes: string[],
): Promise<Record<string, CatalogItemOption[]>> {
  if (codes.length === 0) return {};
  const params = new URLSearchParams({ codes: codes.join(",") });
  const response = await fetch(`${BASE_PATH}/items/batch?${params}`, {
    credentials: "include",
  });
  if (!response.ok) {
    await parseError(response, "Error al consultar catálogos");
  }
  return response.json();
}

/** Convierte ítems API al formato { value, label } usado en selects. */
export function toSelectOptions(items: CatalogItemOption[]) {
  return items.map((item) => ({ value: item.key, label: item.value }));
}
