import { extractSubmissionKey } from "./mediaUrl";

/**
 * Ruta estable de la vista amplia de una evidencia.
 * Hoy requiere sesión web; en el futuro puede hacerse pública sin cambiar la URL.
 *
 * Ejemplos:
 * - `/ver/foto?key=submissions%2F...%2Ffoto.jpg`
 * - `/ver/foto?key=...&label=Firma`
 */
export function mediaViewPagePath(
  sourceUrlOrKey: string,
  options?: { label?: string },
): string | null {
  const key = sourceUrlOrKey.startsWith("submissions/")
    ? sourceUrlOrKey
    : extractSubmissionKey(sourceUrlOrKey);

  const params = new URLSearchParams();
  if (key) {
    params.set("key", key);
  } else if (sourceUrlOrKey.startsWith("http")) {
    // Fallback para URLs externas sin clave submissions/
    params.set("url", sourceUrlOrKey);
  } else {
    return null;
  }

  if (options?.label?.trim()) {
    params.set("label", options.label.trim());
  }

  return `/ver/foto?${params.toString()}`;
}

/** URL absoluta (origen actual) para Excel, correos o abrir en nueva pestaña. */
export function mediaViewPageUrl(
  sourceUrlOrKey: string,
  options?: { label?: string },
): string | null {
  const path = mediaViewPagePath(sourceUrlOrKey, options);
  if (!path) return null;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}
