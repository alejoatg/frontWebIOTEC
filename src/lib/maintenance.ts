import { API_URL } from "@/lib/api";

export interface MaintenanceStatus {
  web: boolean;
  mobile: boolean;
  message: string;
  updatedAt?: string;
}

const DEFAULT_MESSAGE =
  "La aplicación está en mantenimiento. Contacta al administrador.";

export async function fetchMaintenanceStatus(): Promise<MaintenanceStatus | null> {
  try {
    const res = await fetch(`${API_URL}/api/maintenance/status`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      web: Boolean(data.web),
      mobile: Boolean(data.mobile),
      message:
        typeof data.message === "string" && data.message.trim()
          ? data.message
          : DEFAULT_MESSAGE,
      updatedAt: data.updatedAt,
    };
  } catch {
    return null;
  }
}
