export const MAX_REPORT_RANGE_DAYS = 60;

export interface DateRangeValue {
  fechaDesde: string;
  fechaHasta: string;
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

/** Primer y último día del mes en curso (ISO yyyy-mm-dd). */
export function getCurrentMonthRange(): DateRangeValue {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    fechaDesde: first.toISOString().split("T")[0],
    fechaHasta: last.toISOString().split("T")[0],
  };
}

export function getMaxEndDate(startDate: string, maxDays = MAX_REPORT_RANGE_DAYS): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  const maxEnd = new Date(start);
  maxEnd.setDate(maxEnd.getDate() + maxDays);
  const today = getTodayIsoDate();
  const maxIso = maxEnd.toISOString().split("T")[0];
  return maxIso < today ? maxIso : today;
}

export function validateDateRange(
  fechaDesde: string,
  fechaHasta: string,
  maxDays = MAX_REPORT_RANGE_DAYS,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fechaDesde) errors.fechaDesde = "La fecha inicio es obligatoria";
  if (!fechaHasta) errors.fechaHasta = "La fecha fin es obligatoria";
  if (fechaDesde && fechaHasta) {
    const start = new Date(fechaDesde);
    const end = new Date(fechaHasta);
    if (start > end) {
      errors.fechaHasta = "La fecha fin no puede ser anterior a la fecha inicio";
    } else {
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > maxDays) {
        errors.fechaHasta = `El rango máximo es de ${maxDays} días`;
      }
    }
  }
  return errors;
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}
