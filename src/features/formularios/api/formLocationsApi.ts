import { API_URL } from "@/lib/api";
import type { FormLocationsResponse } from "../types/formLocations";

export async function fetchFormLocations(filter: {
  fechaDesde: string;
  fechaHasta: string;
  forms?: string[];
  q?: string;
}): Promise<FormLocationsResponse> {
  const params = new URLSearchParams();
  params.set("fechaDesde", filter.fechaDesde);
  params.set("fechaHasta", filter.fechaHasta);
  if (filter.forms?.length) params.set("forms", filter.forms.join(","));
  if (filter.q?.trim()) params.set("q", filter.q.trim());

  const response = await fetch(`${API_URL}/api/form-locations?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message || "Error al consultar ubicaciones",
    );
  }
  return (await response.json()) as FormLocationsResponse;
}
