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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Opciones de digitación: hora en punto o media hora. */
export const HALF_HOUR_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? 0 : 30;
  return `${pad2(h)}:${pad2(m)}`;
});

export function isHalfHourClock(value: string | null | undefined): boolean {
  const clock = formatClockTime(value);
  return HALF_HOUR_OPTIONS.includes(clock);
}

/** Ajusta a la media hora más cercana (para borradores antiguos). */
export function toHalfHourClock(value: string | null | undefined): string {
  const clock = formatClockTime(value);
  const match = clock.match(/^(\d{2}):(\d{2})$/);
  if (!match) return "";
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (m === 0 || m === 30) return clock;
  if (m < 15) return `${pad2(h)}:00`;
  if (m < 45) return `${pad2(h)}:30`;
  return `${pad2((h + 1) % 24)}:00`;
}
