"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components";
import {
  fetchBatches,
  fetchEntries,
  rejectEntry,
  type OvertimeBatch,
  type OvertimeEntryRow,
} from "../../api/overtimeApi";
import { SPREADSHEET_COLUMNS } from "../../lib/entrySpreadsheet";
import CorrectEntryModal from "../CorrectEntryModal/CorrectEntryModal";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import PlanillaRowActions from "../PlanillaRowActions/PlanillaRowActions";
import styles from "./RegistrosPlanillaContainer.module.scss";
import shared from "../../styles/shared.module.scss";

const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "REJECTED", "SUPERSEDED"];

interface Filters {
  workDateFrom: string;
  workDateTo: string;
  documentNumber: string;
  batchId: string;
  fileName: string;
  zoneName: string;
}

const EMPTY_FILTERS: Filters = {
  workDateFrom: "",
  workDateTo: "",
  documentNumber: "",
  batchId: "",
  fileName: "",
  zoneName: "",
};

function statusClass(status: string) {
  switch (status) {
    case "PENDING":
      return shared.badgePending;
    case "APPROVED":
      return shared.badgeApproved;
    case "REJECTED":
      return shared.badgeRejected;
    default:
      return shared.badgeSuperseded;
  }
}

export default function RegistrosPlanillaContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [batches, setBatches] = useState<OvertimeBatch[]>([]);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OvertimeEntryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const loadBatches = useCallback(async () => {
    try {
      setBatches(await fetchBatches(year, month));
    } catch {
      setBatches([]);
    }
  }, [year, month]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries({
        year,
        month,
        status: status || undefined,
        batchId: appliedFilters.batchId || undefined,
        documentNumber: appliedFilters.documentNumber || undefined,
        workDateFrom: appliedFilters.workDateFrom || undefined,
        workDateTo: appliedFilters.workDateTo || undefined,
        zoneName: appliedFilters.zoneName || undefined,
        fileName: appliedFilters.fileName || undefined,
        includeSuperseded: status === "SUPERSEDED",
        page,
        pageSize: 100,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [year, month, status, appliedFilters, page]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setAppliedFilters(filters);
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function handlePlanillaChange(batchId: string) {
    const batch = batches.find((b) => b.id === batchId);
    setFilters((prev) => ({
      ...prev,
      batchId,
      fileName: batch?.originalFilename ?? prev.fileName,
    }));
  }

  function handleArchivoChange(fileName: string) {
    const batch = batches.find((b) => b.originalFilename === fileName);
    setFilters((prev) => ({
      ...prev,
      fileName,
      batchId: batch?.id ?? "",
    }));
  }

  async function handleReject() {
    if (!rejectId || !rejectNote.trim()) return;
    try {
      await rejectEntry(rejectId, rejectNote.trim());
      setRejectId(null);
      setRejectNote("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al rechazar");
    }
  }

  const uniqueFiles = [...new Set(batches.map((b) => b.originalFilename))];

  return (
    <div>
      <PeriodSelector
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
          setPage(1);
          setFilters(EMPTY_FILTERS);
          setAppliedFilters(EMPTY_FILTERS);
        }}
      />

      <div className={styles.filtersPanel}>
        <div className={styles.filtersGrid}>
          <label className={styles.filterField}>
            <span>Fecha desde</span>
            <input
              type="date"
              value={filters.workDateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, workDateFrom: e.target.value }))}
            />
          </label>
          <label className={styles.filterField}>
            <span>Fecha hasta</span>
            <input
              type="date"
              value={filters.workDateTo}
              onChange={(e) => setFilters((f) => ({ ...f, workDateTo: e.target.value }))}
            />
          </label>
          <label className={styles.filterField}>
            <span>Cédula</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Solo dígitos"
              value={filters.documentNumber}
              onChange={(e) => setFilters((f) => ({ ...f, documentNumber: e.target.value }))}
            />
          </label>
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
              onChange={(e) => setFilters((f) => ({ ...f, zoneName: e.target.value }))}
            />
          </label>
          <label className={styles.filterField}>
            <span>Estado</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "Vigentes (sin SUPERSEDED)"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.filtersActions}>
          <Button type="button" size="sm" onClick={applyFilters}>
            Filtrar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
            Limpiar
          </Button>
          <span className={styles.count}>{total} registro(s)</span>
          <Link href="/dashboard/contabilidad/horas-extra/registros">
            <Button type="button" variant="outline" size="sm">
              Vista resumida
            </Button>
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            Actualizar
          </Button>
        </div>
      </div>

      {loading && <div className={shared.loading}>Cargando planilla…</div>}
      {error && <div className={shared.error}>{error}</div>}

      {!loading && !error && (
        <>
          <div className={styles.spreadsheetWrapper}>
            <table className={styles.spreadsheet}>
              <thead>
                <tr>
                  {SPREADSHEET_COLUMNS.map((col) => (
                    <th key={col.id} title={col.header}>
                      {col.header}
                    </th>
                  ))}
                  <th className={styles.stickyActions}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={SPREADSHEET_COLUMNS.length + 1}>Sin registros</td>
                  </tr>
                ) : (
                  items.map((entry) => (
                    <tr key={entry.id}>
                      {SPREADSHEET_COLUMNS.map((col) => {
                        const raw = col.getValue(entry);
                        const display =
                          col.id === "status" ? (
                            <span className={`${shared.badge} ${statusClass(entry.status)}`}>
                              {entry.status}
                            </span>
                          ) : (
                            (raw ?? "")
                          );
                        return (
                          <td
                            key={col.id}
                            className={col.align === "right" ? styles.numCell : undefined}
                            title={typeof raw === "string" ? raw : undefined}
                          >
                            {display}
                          </td>
                        );
                      })}
                      <td className={styles.stickyActions}>
                        <PlanillaRowActions
                          entry={entry}
                          onReject={setRejectId}
                          onCorrect={setCorrectId}
                          onActionComplete={load}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={shared.pagination}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}

      <CorrectEntryModal
        entryId={correctId ?? ""}
        open={Boolean(correctId)}
        onClose={() => setCorrectId(null)}
        onSuccess={() => {
          setCorrectId(null);
          load();
        }}
      />

      {rejectId && (
        <div className={styles.rejectOverlay} role="dialog" aria-modal="true">
          <div className={styles.rejectDialog}>
            <h3>Rechazar registro</h3>
            <p>Observación contabilidad (obligatoria):</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
            />
            <div className={styles.rejectActions}>
              <Button type="button" size="sm" onClick={handleReject}>
                Confirmar rechazo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRejectId(null);
                  setRejectNote("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
