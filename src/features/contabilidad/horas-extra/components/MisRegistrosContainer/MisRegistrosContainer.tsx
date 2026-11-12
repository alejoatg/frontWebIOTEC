"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components";
import {
  downloadAuthenticatedFile,
  fetchMineFacets,
  fetchMyEntries,
  myEntriesExportExcelUrl,
  type OvertimeEntryRow,
} from "../../api/overtimeApi";
import { hoursFromEntry } from "../../lib/hourTypesDisplay";
import { overtimeStatusLabel } from "../../lib/overtimeStatus";
import { formatDateOnly } from "../../lib/dateFormat";
import { formatClockTime } from "../../lib/timeFormat";
import CorrectEntryModal from "../CorrectEntryModal/CorrectEntryModal";
import OvertimeListFilters, {
  EMPTY_OVERTIME_LIST_FILTERS,
  overtimeListFilterQuery,
  type OvertimeListFilterValues,
} from "../OvertimeListFilters/OvertimeListFilters";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import VoidEntryModal from "../VoidEntryModal/VoidEntryModal";
import styles from "../../styles/shared.module.scss";

function statusClass(status: string) {
  switch (status) {
    case "PENDING":
      return styles.badgePending;
    case "APPROVED":
      return styles.badgeApproved;
    case "REJECTED":
      return styles.badgeRejected;
    case "VOIDED":
      return styles.badgeVoided;
    default:
      return styles.badgeSuperseded;
  }
}

function fmtHours(n: number | null | undefined) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function MisRegistrosContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState<OvertimeListFilterValues>(EMPTY_OVERTIME_LIST_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<OvertimeListFilterValues>(
    EMPTY_OVERTIME_LIST_FILTERS,
  );
  const [processes, setProcesses] = useState<string[]>([]);
  const [batches, setBatches] = useState<
    Array<{ id: string; batchCode: string; originalFilename: string | null }>
  >([]);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OvertimeEntryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<OvertimeEntryRow | null>(null);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyEntries({
        year,
        month,
        ...overtimeListFilterQuery(appliedFilters, status),
        page,
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
    void load();
  }, [load]);

  useEffect(() => {
    fetchMineFacets(year, month)
      .then((data) => {
        setProcesses(data.processes ?? []);
        setBatches(data.batches ?? []);
      })
      .catch(() => {
        setProcesses([]);
        setBatches([]);
      });
  }, [year, month]);

  function applyFilters() {
    setAppliedFilters(filters);
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_OVERTIME_LIST_FILTERS);
    setAppliedFilters(EMPTY_OVERTIME_LIST_FILTERS);
    setStatus("");
    setPage(1);
  }

  return (
    <div>
      <p className={styles.hint}>
        Consulta los registros de tiempo suplementario que usted digitó o cargó.
        El Excel trae todos los datos digitados y el estado, como la planilla.
        Solo puede anular los que estén pendientes de revisión y el periodo esté
        abierto.
      </p>

      <PeriodSelector
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
          setPage(1);
          setFilters(EMPTY_OVERTIME_LIST_FILTERS);
          setAppliedFilters(EMPTY_OVERTIME_LIST_FILTERS);
        }}
      />

      <OvertimeListFilters
        filters={filters}
        onChange={setFilters}
        status={status}
        onStatusChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        processes={processes}
        batches={batches}
        onApply={applyFilters}
        onClear={clearFilters}
        onRefresh={load}
        total={total}
        extraActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting || loading}
            onClick={async () => {
              setExporting(true);
              setError(null);
              try {
                await downloadAuthenticatedFile(
                  myEntriesExportExcelUrl({
                    year,
                    month,
                    ...overtimeListFilterQuery(appliedFilters, status),
                  }),
                  `mis-registros-${year}-${String(month).padStart(2, "0")}.xlsx`,
                );
              } catch (e) {
                setError(e instanceof Error ? e.message : "Error al exportar");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? "Generando Excel…" : "Exportar Excel"}
          </Button>
        }
      />

      {loading && <div className={styles.loading}>Cargando mis registros…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Fecha</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Total horas</th>
                  <th>Tipos de hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      No hay registros digitados por usted en este periodo
                    </td>
                  </tr>
                ) : (
                  items.map((e) => {
                    const { total, types } = hoursFromEntry(e);
                    return (
                    <tr key={e.id}>
                      <td>
                        <Link
                          href={`/dashboard/contabilidad/horas-extra/registros/${e.id}`}
                          style={{
                            color: "#2563eb",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          {e.entryCode}
                        </Link>
                      </td>
                      <td>{e.employeeDocumentNumber}</td>
                      <td>{e.employeeFullName}</td>
                      <td>{formatDateOnly(e.workDate)}</td>
                      <td>{formatClockTime(e.startTime) || "—"}</td>
                      <td>{formatClockTime(e.endTime) || "—"}</td>
                      <td>{fmtHours(total)}</td>
                      <td>{types}</td>
                      <td>
                        <span className={`${styles.badge} ${statusClass(e.status)}`}>
                          {overtimeStatusLabel(e.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/dashboard/contabilidad/horas-extra/registros/${e.id}`}
                          >
                            <Button type="button" variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                          {e.status === "PENDING" && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCorrectId(e.id)}
                              >
                                Corregir
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setVoidTarget(e)}
                              >
                                Anular
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
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
        open={!!correctId}
        onClose={() => setCorrectId(null)}
        onSuccess={() => {
          setCorrectId(null);
          void load();
        }}
      />
      <VoidEntryModal
        open={!!voidTarget}
        entryId={voidTarget?.id ?? null}
        entryCode={voidTarget?.entryCode}
        onClose={() => setVoidTarget(null)}
        onSuccess={load}
      />
    </div>
  );
}
