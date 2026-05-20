"use client";

import Link from "next/link";
import type { AtuFormatoUnicoRecord, PaginatedResponse } from "../../types";
import styles from "./AtuFormatoUnicoTable.module.scss";

export interface AtuFormatoUnicoTableProps {
  data: PaginatedResponse<AtuFormatoUnicoRecord> | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AtuFormatoUnicoTable({
  data,
  onPageChange,
  isLoading = false,
}: AtuFormatoUnicoTableProps) {
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
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Orden trabajo</th>
              <th>Brigada</th>
              <th>Municipio</th>
              <th>Línea</th>
              <th>Nivel tensión</th>
              <th>Nº est.</th>
              <th>Nº apoyo</th>
              <th>Tipo inspección</th>
              <th>Estado est.</th>
              <th>Técnico</th>
              <th>Sincronizado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((row) => (
              <tr key={row.id} className={styles.row}>
                <td className={styles.cellDate}>{formatShortDate(row.fecha)}</td>
                <td>{row.ordenTrabajo || "—"}</td>
                <td>{row.brigada?.replace("_", " ") ?? "—"}</td>
                <td>{row.municipio ?? "—"}</td>
                <td title={row.linea} className={styles.lineaTrunc}>
                  {row.linea ?? "—"}
                </td>
                <td>{row.nivelTension ?? "—"}</td>
                <td className={styles.cellNum}>{row.numeroEstructura ?? "—"}</td>
                <td>{row.numeroApoyo ?? "—"}</td>
                <td>
                  {row.tipoInspeccion === "Inspeccion"
                    ? "Inspección"
                    : row.tipoInspeccion === "Termografia"
                      ? "Termografía"
                      : row.tipoInspeccion?.replace(/_/g, " ") ?? "—"}
                </td>
                <td>{row.estadoEstructura ?? "—"}</td>
                <td>{row.submittedBy?.name ?? "—"}</td>
                <td className={styles.cellDate}>{formatDate(row.syncedAt)}</td>
                <td>
                  <Link
                    href={`/dashboard/formularios/atu-formato-unico/${row.id}`}
                    className={styles.linkDetalle}
                  >
                    Ver
                  </Link>
                </td>
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
