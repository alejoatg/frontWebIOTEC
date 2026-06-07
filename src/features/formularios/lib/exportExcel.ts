import * as XLSX from "xlsx";

export interface ExcelColumn {
  key: string;
  label: string;
  accessor?: (row: Record<string, unknown>) => unknown;
}

function getCellValue(row: Record<string, unknown>, col: ExcelColumn): unknown {
  if (col.accessor) return col.accessor(row);
  return row[col.key];
}

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
