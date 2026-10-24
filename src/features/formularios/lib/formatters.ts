export function formatDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatBrigada(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

export function formatTipoInspeccion(value: string | null | undefined): string {
  if (!value) return "—";
  if (value === "Inspeccion") return "Inspección";
  if (value === "Termografia") return "Termografía";
  return value.replace(/_/g, " ");
}

export function labelForReportField(
  config: { listColumns: { key: string; label: string }[] },
  key: string,
): string {
  return config.listColumns.find((col) => col.key === key)?.label ?? humanizeFieldKey(key);
}

export function formatForReportField(
  config: { listColumns: { key: string; label: string; format?: string }[] },
  key: string,
  value: unknown,
): string {
  const format = config.listColumns.find((col) => col.key === key)?.format;
  if (value === undefined || value === null || value === "") return "—";
  const text = String(value);
  if (format === "shortDate") return formatShortDate(text);
  if (format === "datetime") return formatDateTime(text);
  return formatCellValue(value);
}

export function humanizeFieldKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function formatCellValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
