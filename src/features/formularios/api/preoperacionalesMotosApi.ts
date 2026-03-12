import { API_URL } from "@/lib/api";
import type {
  PreoperacionalMoto,
  PreoperacionalMotoFilter,
  PaginatedResponse,
} from "../types";

const BASE_PATH = `${API_URL}/api/formularios/preoperacionales-motos`;

export async function fetchPreoperacionalesMotos(
  filter: PreoperacionalMotoFilter
): Promise<PaginatedResponse<PreoperacionalMoto>> {
  const params = new URLSearchParams();

  params.append("fechaInicio", filter.fechaInicio);
  params.append("fechaFin", filter.fechaFin);

  if (filter.placa?.trim()) {
    params.append("placa", filter.placa.trim());
  }

  if (filter.cedulaConductor?.trim()) {
    params.append("cedulaConductor", filter.cedulaConductor.trim());
  }

  if (filter.page) {
    params.append("page", filter.page.toString());
  }

  if (filter.pageSize) {
    params.append("pageSize", filter.pageSize.toString());
  }

  const response = await fetch(`${BASE_PATH}?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al consultar preoperacionales");
  }

  return response.json();
}
