import { API_URL } from "@/lib/api";
import type { UserListItem, UserRole } from "./types";

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  const msg = (body as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg) return msg;
  return fallback;
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserListItem> {
  const response = await fetch(`${API_URL}/api/users/${id}/role`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo cambiar el rol"));
  }
  return response.json();
}

export async function fetchAnalystDigitizerIds(userId: string): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/overtime/analyst/assignments/${userId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo cargar el grupo"));
  }
  const data = (await response.json()) as { digitizerIds?: string[] };
  return data.digitizerIds ?? [];
}

export async function saveAnalystDigitizers(userId: string, digitizerIds: string[]) {
  const response = await fetch(`${API_URL}/api/overtime/analyst/assignments/${userId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ digitizerIds }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo guardar el grupo"));
  }
}
