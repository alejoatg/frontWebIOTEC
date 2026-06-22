import { API_URL } from "./api";

/** Extrae la clave S3 `submissions/...` desde una URL pública del bucket. */
export function extractSubmissionKey(url: string): string | null {
  if (!url?.startsWith("http")) return null;

  try {
    const parsed = new URL(url);
    let path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

    const submissionsIdx = path.indexOf("submissions/");
    if (submissionsIdx >= 0) {
      path = path.slice(submissionsIdx);
    }

    if (path.startsWith("submissions/")) {
      return path;
    }
  } catch {
    // ignorar
  }

  return null;
}

/**
 * URL del endpoint de streaming autenticado en la API.
 * El navegador debe usar `fetch(..., { credentials: "include" })` para enviar la sesión.
 */
export function resolveMediaStreamUrl(url: string): string {
  const key = extractSubmissionKey(url);
  if (key) {
    return `${API_URL}/api/files/stream?key=${encodeURIComponent(key)}`;
  }
  return url;
}

/**
 * @deprecated Usar `resolveMediaStreamUrl` + `MediaImage` (fetch con credentials).
 * La ruta `/media` no recibe cookies de sesión de la API en despliegues cross-origin.
 */
export function resolveMediaUrl(url: string): string {
  const key = extractSubmissionKey(url);
  if (key) {
    return `/media?key=${encodeURIComponent(key)}`;
  }
  return url;
}

/** Aplica resolveMediaStreamUrl a strings o arrays de URLs. */
export function resolveMediaUrls(value: unknown): unknown {
  if (typeof value === "string") {
    return value.startsWith("http") ? resolveMediaStreamUrl(value) : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" && item.startsWith("http")
        ? resolveMediaStreamUrl(item)
        : item,
    );
  }
  return value;
}
