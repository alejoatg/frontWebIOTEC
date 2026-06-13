/**
 * Convierte URLs directas de S3 en rutas same-origin servidas por /media (proxy autenticado).
 * Funciona aunque el bucket sea privado.
 */
export function resolveMediaUrl(url: string): string {
  if (!url?.startsWith("http")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    let path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

    // Path-style: bucket/submissions/...
    const submissionsIdx = path.indexOf("submissions/");
    if (submissionsIdx >= 0) {
      path = path.slice(submissionsIdx);
    }

    if (path.startsWith("submissions/")) {
      return `/media?key=${encodeURIComponent(path)}`;
    }
  } catch {
    // mantener URL original
  }

  return url;
}

/** Aplica resolveMediaUrl a strings o arrays de URLs. */
export function resolveMediaUrls(value: unknown): unknown {
  if (typeof value === "string") {
    return value.startsWith("http") ? resolveMediaUrl(value) : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" && item.startsWith("http")
        ? resolveMediaUrl(item)
        : item,
    );
  }
  return value;
}
