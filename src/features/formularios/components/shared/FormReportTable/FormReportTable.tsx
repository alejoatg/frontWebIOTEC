"use client";

import Link from "next/link";
import type { FormReportConfig } from "../../../config/formReportTypes";
import type { FormReportListResponse } from "../../../config/formReportTypes";
import {
  formatBrigada,
  formatCellValue,
  formatDateTime,
  formatShortDate,
  formatTipoInspeccion,
} from "../../../lib/formatters";
import { buildListColumns } from "../../../lib/buildFormReportDisplay";
import styles from "./FormReportTable.module.scss";

export interface FormReportTableProps {
  config: FormReportConfig;
  data: FormReportListResponse | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

function formatColumnValue(
  row: Record<string, unknown>,
  col: FormReportConfig["listColumns"][number],
): string {
  const raw = col.accessor ? col.accessor(row) : row[col.key];
  if (raw === undefined || raw === null || raw === "") return "—";
  switch (col.format) {
    case "datetime":
      return formatDateTime(String(raw));
    case "shortDate":
      return formatShortDate(String(raw));
    case "brigada":
      return formatBrigada(String(raw));
    case "tipoInspeccion":
      return formatTipoInspeccion(String(raw));
    default:
      return formatCellValue(raw);
  }
}

export default function FormReportTable({
  config,
  data,
  onPageChange,
  isLoading = false,
}: FormReportTableProps) {
  const columns = buildListColumns(config);

  if (!data) {
    return (
      <div className={styles.empty}>
        <p>Aplica los filtros y presiona Consultar para ver los registros.</p>
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No se encontraron registros con los filtros aplicados.</p>
      </div>
    );
  }

  const { pagination } = data;

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        Mostrando {(pagination.page - 1) * pagination.pageSize + 1} -{" "}
        {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{" "}
        {pagination.total} registros
        <span className={styles.columnHint}>
          {" "}
          · {columns.length} columnas de la plantilla
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colDetalle}>Detalle</th>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.map((row) => (
              <tr key={String(row.id)} className={styles.row}>
                <td className={styles.colDetalle}>
                  <Link
                    href={`/dashboard/formularios/${config.slug}/${row.id}`}
                    className={styles.linkDetalle}
                  >
                    Ver informe
                  </Link>
                </td>
                {columns.map((col) => (
                  <td key={col.key}>{formatColumnValue(row, col)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
