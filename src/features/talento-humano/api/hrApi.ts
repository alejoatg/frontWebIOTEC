import { API_URL } from "@/lib/api";
import type {
  AreaItem,
  CreateEmployeePayload,
  EmployeeListItem,
  JobPositionItem,
  ManagementUnitItem,
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

async function parseError(response: Response, fallback: string): Promise<never> {
  const error = await response.json().catch(() => ({}));
  const message = error.message;
  throw new Error(
    typeof message === "string"
      ? message
      : Array.isArray(message)
        ? String(message[0])
        : fallback,
  );
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

export async function createEmployee(
  data: CreateEmployeePayload,
): Promise<EmployeeListItem & Record<string, unknown>> {
  const response = await fetch(`${API_URL}/api/employees`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    await parseError(response, "Error al crear el trabajador");
  }
  return response.json();
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

export function fetchManagementUnits(
  includeInactive = false,
): Promise<ManagementUnitItem[]> {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return fetchJson(`/api/hr/management-units${qs}`);
}
