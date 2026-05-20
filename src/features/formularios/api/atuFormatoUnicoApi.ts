import { API_URL } from "@/lib/api";
import type {
  AtuFormatoUnicoRecord,
  AtuFormatoUnicoFilter,
  PaginatedResponse,
} from "../types";

const BASE_PATH = `${API_URL}/api/atu-formato-unico`;

export async function fetchAtuFormatoUnico(
  filter: AtuFormatoUnicoFilter
): Promise<PaginatedResponse<AtuFormatoUnicoRecord>> {
  const params = new URLSearchParams();

  if (filter.fechaDesde) params.append("fechaDesde", filter.fechaDesde);
  if (filter.fechaHasta) params.append("fechaHasta", filter.fechaHasta);
  if (filter.municipio?.trim()) params.append("municipio", filter.municipio.trim());
  if (filter.brigada?.trim()) params.append("brigada", filter.brigada.trim());
  if (filter.tipoInspeccion?.trim()) params.append("tipoInspeccion", filter.tipoInspeccion.trim());
  if (filter.ordenTrabajo?.trim()) params.append("ordenTrabajo", filter.ordenTrabajo.trim());
  if (filter.page) params.append("page", filter.page.toString());
  if (filter.pageSize) params.append("pageSize", (filter.pageSize ?? 50).toString());

  const response = await fetch(`${BASE_PATH}?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al consultar registros ATU");
  }

  return response.json();
}

export async function fetchAtuFormatoUnicoById(
  id: string
): Promise<AtuFormatoUnicoRecord & Record<string, unknown>> {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error("Registro no encontrado");
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al cargar el registro");
  }

  return response.json();
}
