"use client";

import type { PreoperacionalMoto, PaginatedResponse } from "../../types";
import styles from "./PreoperacionalesMotosTable.module.scss";

export interface PreoperacionalesMotosTableProps {
  data: PaginatedResponse<PreoperacionalMoto> | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

function formatDate(dateString: string | null): string {
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

function getStatusBadge(value: string | null): { text: string; variant: string } {
  if (!value) return { text: "—", variant: "neutral" };
  const lower = value.toLowerCase();
  if (lower === "si" || lower === "sí" || lower === "bueno" || lower === "ok") {
    return { text: value, variant: "success" };
  }
  if (lower === "no" || lower === "malo" || lower === "deficiente") {
    return { text: value, variant: "danger" };
  }
  return { text: value, variant: "neutral" };
}

export default function PreoperacionalesMotosTable({
  data,
  onPageChange,
  isLoading = false,
}: PreoperacionalesMotosTableProps) {
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
              <th>Placa</th>
              <th>Cédula</th>
              <th>Km</th>
              <th>Documentos</th>
              <th>Alumbrado</th>
              <th>Mecánico</th>
              <th>Frenos</th>
              <th>Seguridad</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((row) => {
              const docStatus = getStatusBadge(row.DOCUMENTOS_LICENCIA_DE_TRANSITO);
              const luzStatus = getStatusBadge(row.SISTEMA_DE_ALUMBRADO_LUCES_ALTAS);
              const mecStatus = getStatusBadge(row.ESTADO_TECNICO_MECANICO_ESTADO_GENERAL);
              const frenoStatus = getStatusBadge(row.FRENOS_FUNCIONAMIENTO_FRENO_DELANTERO);
              const segStatus = getStatusBadge(row.SISTEMA_SEGURIDAD_CASCO);

              return (
                <tr key={row._URI} className={styles.row}>
                  <td className={styles.cellDate}>
                    {formatDate(row.FECHA_REGISTRO)}
                  </td>
                  <td className={styles.cellPlaca}>
                    <span className={styles.placaBadge}>{row.PLACA || "—"}</span>
                  </td>
                  <td>{row.CEDULA_CONDUCTOR || "—"}</td>
                  <td className={styles.cellNum}>
                    {row.KILOMETRAJE_ACTUAL?.toLocaleString() || "—"}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[docStatus.variant]}`}>
                      {docStatus.text}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[luzStatus.variant]}`}>
                      {luzStatus.text}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[mecStatus.variant]}`}>
                      {mecStatus.text}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[frenoStatus.variant]}`}>
                      {frenoStatus.text}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[segStatus.variant]}`}>
                      {segStatus.text}
                    </span>
                  </td>
                </tr>
              );
            })}
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
