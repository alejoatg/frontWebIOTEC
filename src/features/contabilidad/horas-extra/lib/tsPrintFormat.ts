import type { TsDayPrintData, TsDayPrintRow } from "../api/overtimeApi";
import { formatClockTime } from "./timeFormat";

function fmtHours(n: number): string {
  if (!n) return "";
  return Number.isInteger(n) ? String(n) : n.toLocaleString("es-CO", { maximumFractionDigits: 4 });
}

function emptyRows(count: number): TsDayPrintRow[] {
  return Array.from({ length: count }, () => ({
    workDate: "",
    consigna: "",
    commissionMunicipality: "",
    startTime: "",
    endTime: "",
    hoursDisponibilidad: 0,
    hoursTsd: 0,
    hoursTsn: 0,
    hoursHedd: 0,
    hoursHend: 0,
    hoursRd: 0,
    hoursRn: 0,
  }));
}

export function buildPrintRows(data: TsDayPrintData, minRows = 8): TsDayPrintRow[] {
  const rows = data.rows.map((row) => ({
    ...row,
    startTime: formatClockTime(row.startTime),
    endTime: formatClockTime(row.endTime),
  }));
  while (rows.length < minRows) rows.push(...emptyRows(1));
  return rows;
}

export function formatPrintDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO");
}

export { fmtHours, formatClockTime };
