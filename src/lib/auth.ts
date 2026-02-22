import { authEndpoints } from "./api";
import type { User } from "@/types/auth";

export interface AuthMeResponse {
  user: User | null;
}

/**
 * Obtiene el usuario actual (sesión en la API). Enviar credentials para enviar cookies.
 */
export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(authEndpoints.me, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as AuthMeResponse;
  return data.user ?? null;
}

/**
 * URL para iniciar login con Google (redirección al backend).
 */
export function getLoginUrl(): string {
  return authEndpoints.google;
}

/**
 * URL para cerrar sesión (redirección al backend; luego redirige al front).
 */
export function getLogoutUrl(): string {
  return authEndpoints.logout;
}
