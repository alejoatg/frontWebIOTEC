import * as XLSX from "xlsx";
import type { ExportCell, ExportColumn } from "./flattenRecordForExport";

export interface ExcelColumn {
  key: string;
  label: string;
  accessor?: (row: Record<string, unknown>) => unknown;
}

function getCellValue(row: Record<string, unknown>, col: ExcelColumn): unknown {
  if (col.accessor) return col.accessor(row);
  return row[col.key];
}

/** @deprecated Usar exportFormRecordsToExcel para exportación completa con enlaces. */
export function exportRowsToExcel(
  rows: Record<string, unknown>[],
  columns: ExcelColumn[],
  fileName: string,
): void {
  const header = columns.map((c) => c.label);
  const body = rows.map((row) =>
    columns.map((col) => {
      const v = getCellValue(row, col);
      if (v === undefined || v === null) return "";
      if (Array.isArray(v)) return v.join(", ");
      if (typeof v === "object") return JSON.stringify(v);
      return v;
    }),
  );
  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Registros");
  XLSX.writeFile(workbook, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

function excelFormulaString(value: string): string {
  return value.replace(/"/g, '""');
}

/** Texto de enlace con el estilo de hipervínculo de Excel (azul, subrayado). */
function applyClickable(cell: XLSX.CellObject, links: string[]) {
  const urls = links.map((url) => url.trim()).filter(Boolean);
  if (urls.length === 0) return;
  const label = urls.length === 1 ? "Clic para abrir" : `Clic para abrir (${urls.length} enlaces)`;
  cell.f = `HYPERLINK("${excelFormulaString(urls[0])}","${excelFormulaString(label)}")`;
  cell.v = label;
  cell.t = "s";
  cell.l = { Target: urls[0], Tooltip: "Abrir enlace" };
  delete cell.w;
  if (urls.length > 1) {
    cell.c = [{ a: "IOTEC", t: urls.map((url, index) => `${index + 1}. ${url}`).join("\n") }];
  }
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Serial de Excel para un día calendario, sin componente de hora. */
function excelDateSerial(isoDate: string): number | undefined {
  const match = isoDate.match(DATE_ONLY);
  if (!match) return undefined;
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return (utc - Date.UTC(1899, 11, 30)) / 86400000;
}

function applyDateOnly(cell: XLSX.CellObject, isoDate: string) {
  const serial = excelDateSerial(isoDate);
  if (serial == null) return;
  cell.t = "n";
  cell.v = serial;
  cell.z = "dd/mm/yyyy";
  delete cell.w;
}

/** Serial de Excel para fecha y hora de reloj, sin zona horaria. */
function excelDateTimeSerial(parts: { year: number; month: number; day: number; hour: number; minute: number }): number {
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return (utc - Date.UTC(1899, 11, 30)) / 86400000;
}

function applyDateTime(
  cell: XLSX.CellObject,
  parts: { year: number; month: number; day: number; hour: number; minute: number },
) {
  cell.t = "n";
  cell.v = excelDateTimeSerial(parts);
  cell.z = "dd/mm/yyyy hh:mm";
  delete cell.w;
}

export function exportFormRecordsToExcel(
  columns: ExportColumn[],
  matrix: ExportCell[][],
  fileName: string,
): void {
  const header = columns.map((c) => c.label);
  const body = matrix.map((rowCells) => rowCells.map((cell) => cell.text));
  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);

  matrix.forEach((rowCells, rowIndex) => {
    rowCells.forEach((cell, colIndex) => {
      const ref = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
      const target = sheet[ref];
      if (!target) return;
      if (cell.dateOnly) {
        applyDateOnly(target, cell.text);
        return;
      }
      if (cell.dateTime) {
        applyDateTime(target, cell.dateTime);
        return;
      }
      const links = cell.links?.length ? cell.links : cell.link ? [cell.link] : [];
      if (links.length > 0) {
        applyClickable(target, links);
      }
    });
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Registros");
  XLSX.writeFile(workbook, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportFormRecordsToCsv(
  columns: ExportColumn[],
  matrix: ExportCell[][],
  fileName: string,
): void {
  const lines = [
    columns.map((c) => escapeCsvValue(c.label)).join(","),
    ...matrix.map((row) =>
      row.map((cell) => escapeCsvValue(cell.text)).join(","),
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
