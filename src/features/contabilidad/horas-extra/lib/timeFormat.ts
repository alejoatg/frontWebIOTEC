/**
 * Formatea horas almacenadas en militar ("1700", "700", "17:00") a reloj "17:00".
 * Reutilizable en planilla, impresión PDF y vistas de detalle.
 */
export function formatClockTime(value: string | null | undefined): string {
  if (value == null) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  const padded = digits.padStart(4, "0").slice(-4);
  const hh = padded.slice(0, 2);
  const mm = padded.slice(2, 4);
  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) {
    return trimmed;
  }
  return `${hh}:${mm}`;
}
