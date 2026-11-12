"use client";

import type { ReactNode } from "react";
import { Button } from "@/components";
import {
  OVERTIME_STATUS_OPTIONS,
  overtimeStatusLabel,
} from "../../lib/overtimeStatus";
import EmployeeFilterField from "../EmployeeFilterField/EmployeeFilterField";
import styles from "../../styles/shared.module.scss";

export interface OvertimeListFilterValues {
  processName: string;
  submittedById: string;
  workDateFrom: string;
  workDateTo: string;
  documentNumber: string;
  batchId: string;
  fileName: string;
  zoneName: string;
}

export const EMPTY_OVERTIME_LIST_FILTERS: OvertimeListFilterValues = {
  processName: "",
  submittedById: "",
  workDateFrom: "",
  workDateTo: "",
  documentNumber: "",
  batchId: "",
  fileName: "",
  zoneName: "",
};

export function overtimeListFilterQuery(
  applied: OvertimeListFilterValues,
  status: string,
) {
  return {
    status: status || undefined,
    documentNumber: applied.documentNumber.trim() || undefined,
    workDateFrom: applied.workDateFrom || undefined,
    workDateTo: applied.workDateTo || undefined,
    batchId: applied.batchId || undefined,
    zoneName: applied.zoneName.trim() || undefined,
    processName: applied.processName || undefined,
    fileName: applied.fileName || undefined,
    includeSuperseded: status === "SUPERSEDED",
  };
}

export interface OvertimeListFilterBatch {
  id: string;
  batchCode: string;
  originalFilename: string | null;
}

interface Props {
  filters: OvertimeListFilterValues;
  onChange: (next: OvertimeListFilterValues) => void;
  status: string;
  onStatusChange: (status: string) => void;
  processes: string[];
  batches: OvertimeListFilterBatch[];
  digitizers?: Array<{ id: string; name: string }>;
  showDigitizer?: boolean;
  onApply: () => void;
  onClear: () => void;
  onRefresh: () => void;
  total?: number;
  extraActions?: ReactNode;
}

export default function OvertimeListFilters({
  filters,
  onChange,
  status,
  onStatusChange,
  processes,
  batches,
  digitizers = [],
  showDigitizer = false,
  onApply,
  onClear,
  onRefresh,
  total,
  extraActions,
}: Props) {
  const uniqueFiles = [
    ...new Set(
      batches
        .map((b) => b.originalFilename)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  function patch(partial: Partial<OvertimeListFilterValues>) {
    onChange({ ...filters, ...partial });
  }

  function handlePlanillaChange(batchId: string) {
    const batch = batches.find((b) => b.id === batchId);
    patch({
      batchId,
      fileName: batch?.originalFilename ?? filters.fileName,
    });
  }

  function handleArchivoChange(fileName: string) {
    const batch = batches.find((b) => b.originalFilename === fileName);
    patch({
      fileName,
      batchId: batch?.id ?? "",
    });
  }

  return (
    <form
      className={styles.filtersPanel}
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div className={styles.filtersGrid}>
        <label className={styles.filterField}>
          <span>Proceso</span>
          <select
            value={filters.processName}
            onChange={(e) => patch({ processName: e.target.value })}
          >
            <option value="">Todos</option>
            {processes.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {showDigitizer && (
          <label className={styles.filterField}>
            <span>Quien digita</span>
            <select
              value={filters.submittedById}
              onChange={(e) => patch({ submittedById: e.target.value })}
            >
              <option value="">Todos</option>
              {digitizers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.filterField}>
          <span>Desde</span>
          <input
            type="date"
            value={filters.workDateFrom}
            onChange={(e) => patch({ workDateFrom: e.target.value })}
          />
        </label>
        <label className={styles.filterField}>
          <span>Hasta</span>
          <input
            type="date"
            value={filters.workDateTo}
            onChange={(e) => patch({ workDateTo: e.target.value })}
          />
        </label>
        <div className={styles.filterField}>
          <label htmlFor="overtime-filter-document">Cédula</label>
          <EmployeeFilterField
            value={filters.documentNumber}
            onChange={(v) => patch({ documentNumber: v })}
            placeholder="Cédula o nombre"
          />
        </div>
        <label className={styles.filterField}>
          <span>Planilla</span>
          <select
            value={filters.batchId}
            onChange={(e) => handlePlanillaChange(e.target.value)}
          >
            <option value="">Todas</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchCode}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span>Archivo</span>
          <select
            value={filters.fileName}
            onChange={(e) => handleArchivoChange(e.target.value)}
          >
            <option value="">Todos</option>
            {uniqueFiles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span>Zona</span>
          <input
            type="text"
            placeholder="Ej. NORTE"
            value={filters.zoneName}
            onChange={(e) => patch({ zoneName: e.target.value })}
          />
        </label>
        <label className={styles.filterField}>
          <span>Estado</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {OVERTIME_STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? overtimeStatusLabel(s) : "Vigentes (sin corregidos)"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.filtersActions}>
        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Limpiar
        </Button>
        {typeof total === "number" && (
          <span className={styles.filterCount}>{total} registro(s)</span>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          Actualizar
        </Button>
        {extraActions}
      </div>
    </form>
  );
}
