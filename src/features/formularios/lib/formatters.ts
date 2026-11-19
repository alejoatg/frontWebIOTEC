const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const BOGOTA = "America/Bogota";

/**
 * Día calendario YYYY-MM-DD.
 * Un valor solo-fecha se respeta tal cual (no se interpreta como UTC).
 * Un instante ISO se convierte a hora de Colombia.
 */
export function bogotaCalendarDate(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const raw = String(value).trim();
  if (DATE_ONLY.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-CA", { timeZone: BOGOTA });
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

export interface BogotaDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** Instante (ISO con hora) en hora de Colombia. Un día suelto no cuenta. */
export function bogotaDateTimeParts(value: unknown): BogotaDateTimeParts | undefined {
  if (value == null || value === "") return undefined;
  const raw = String(value).trim();
  if (!ISO_INSTANT.test(raw)) return undefined;
  const date = new Date(raw.includes(" ") ? raw.replace(" ", "T") : raw);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOGOTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  let hour = pick("hour");
  if (hour === 24) hour = 0;
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour,
    minute: pick("minute"),
  };
}

export function formatDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  const date = new Date(s);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BOGOTA,
  });
}

/**
 * Fecha de diligenciamiento para reportes.
 * `fecha` se guardó con el día UTC (`startedAt` recortado). El día real es el de Colombia.
 */
export function fechaDiligenciamientoDisplay(row: Record<string, unknown>): string | undefined {
  return bogotaCalendarDate(row.startedAt) ?? (typeof row.fecha === "string" ? row.fecha : undefined);
}

export function formatShortDate(s: string | null | undefined): string {
  if (!s) return "—";
  const calendar = bogotaCalendarDate(s);
  if (!calendar) return "—";
  const match = calendar.match(DATE_ONLY);
  if (!match) return calendar;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("es-CO", {
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
