import type { FormReportConfig } from "../config/formReportTypes";
import {
  buildExportColumns,
  buildExportMatrix,
} from "./flattenRecordForExport";
import { exportFormRecordsToCsv, exportFormRecordsToExcel } from "./exportExcel";

export type ExportFormat = "xlsx" | "csv";

export function exportFormReportRows(
  config: FormReportConfig,
  rows: Record<string, unknown>[],
  format: ExportFormat,
): void {
  if (rows.length === 0) {
    throw new Error("No hay registros para exportar");
  }

  const columns = buildExportColumns(config, rows);
  const matrix = buildExportMatrix(rows, columns, config);
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = `${config.excelFileName}_${stamp}`;

  if (format === "csv") {
    exportFormRecordsToCsv(columns, matrix, `${baseName}.csv`);
  } else {
    exportFormRecordsToExcel(columns, matrix, `${baseName}.xlsx`);
  }
}
