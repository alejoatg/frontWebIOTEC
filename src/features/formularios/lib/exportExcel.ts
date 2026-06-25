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

function applyHyperlink(cell: XLSX.CellObject, url: string, display: string) {
  cell.v = display;
  cell.t = "s";
  cell.l = { Target: url, Tooltip: "Abrir enlace" };
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
      if (!cell.link || cell.text.includes("\n")) return;
      const ref = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
      const target = sheet[ref];
      if (!target) return;
      const label = cell.text.includes(": ")
        ? cell.text.slice(0, cell.text.indexOf(": "))
        : "Abrir enlace";
      applyHyperlink(target, cell.link, label);
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
