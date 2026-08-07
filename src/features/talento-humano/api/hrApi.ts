import { API_URL } from "@/lib/api";
import type {
  AreaItem,
  EmployeeListItem,
  JobPositionItem,
  WorkProcessItem,
  ZoneItem,
} from "../types";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include" });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("No autorizado. Inicia sesión nuevamente.");
    }
    if (response.status === 403) {
      throw new Error("No tienes permisos para ver esta información.");
    }
    throw new Error("Error al cargar los datos.");
  }
  return response.json() as Promise<T>;
}

export function fetchEmployees(options?: {
  search?: string;
  includeInactive?: boolean;
}): Promise<EmployeeListItem[]> {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set("search", options.search.trim());
  if (options?.includeInactive) params.set("includeInactive", "true");
  const qs = params.toString();
  return fetchJson(`/api/employees${qs ? `?${qs}` : ""}`);
}

export function fetchJobPositions(includeInactive = false): Promise<JobPositionItem[]> {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return fetchJson(`/api/hr/job-positions${qs}`);
}

export function fetchAreas(includeInactive = false): Promise<AreaItem[]> {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return fetchJson(`/api/hr/areas${qs}`);
}

export function fetchZones(includeInactive = false): Promise<ZoneItem[]> {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return fetchJson(`/api/hr/zones${qs}`);
}

export function fetchWorkProcesses(includeInactive = false): Promise<WorkProcessItem[]> {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return fetchJson(`/api/hr/work-processes${qs}`);
}
