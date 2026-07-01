"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canReviewOvertime } from "@/features/dashboard/constants/nav";
import {
  approveEntry,
  downloadAuthenticatedFile,
  fetchEntries,
  pdfDayUrl,
  pdfMonthUrl,
  rejectEntry,
  type OvertimeEntry,
} from "../../api/overtimeApi";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";

const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "REJECTED", "SUPERSEDED"];

function statusClass(status: string) {
  switch (status) {
    case "PENDING":
      return styles.badgePending;
    case "APPROVED":
      return styles.badgeApproved;
    case "REJECTED":
      return styles.badgeRejected;
    default:
      return styles.badgeSuperseded;
  }
}

export default function RegistrosContainer() {
  const { user } = useAuth();
  const canReview = canReviewOvertime(user?.role);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OvertimeEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries({ year, month, status: status || undefined, page });
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [year, month, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id: string) {
    try {
      await approveEntry(id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleReject() {
    if (!rejectId || !rejectNote.trim()) return;
    try {
      await rejectEntry(rejectId, rejectNote.trim());
      setRejectId(null);
      setRejectNote("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-CO");
  }

  return (
    <div>
      <PeriodSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); setPage(1); }} />

      <div className={styles.toolbar}>
        <label>
          Estado{" "}
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "Todos"}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={load}>
          Actualizar
        </Button>
      </div>

      {loading && <div className={styles.loading}>Cargando registros…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Planilla</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Sin registros</td>
                  </tr>
                ) : (
                  items.map((e) => (
                    <tr key={e.id}>
                      <td>{e.entryCode}</td>
                      <td>
                        {e.employeeFullName}
                        <br />
                        <small>{e.employeeDocumentNumber}</small>
                      </td>
                      <td>{formatDate(e.workDate)}</td>
                      <td>
                        <span className={`${styles.badge} ${statusClass(e.status)}`}>
                          {e.status}
                        </span>
                      </td>
                      <td>{Number(e.amountTotal).toLocaleString("es-CO")}</td>
                      <td>{e.importBatch?.batchCode ?? "—"}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              downloadAuthenticatedFile(
                                pdfDayUrl(e.employeeId, e.workDate.slice(0, 10)),
                                `TS-${e.entryCode}.pdf`,
                              )
                            }
                          >
                            PDF día
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              downloadAuthenticatedFile(
                                pdfMonthUrl(e.employeeId, year, month),
                                `TS-mes-${e.employeeDocumentNumber}.pdf`,
                              )
                            }
                          >
                            PDF mes
                          </Button>
                          {canReview && e.status === "PENDING" && (
                            <>
                              <Button type="button" size="sm" onClick={() => handleApprove(e.id)}>
                                Aprobar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectId(e.id)}
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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

      {rejectId && (
        <div className={styles.alert} style={{ marginTop: "1rem" }}>
          <p>Observación contabilidad (obligatoria):</p>
          <textarea
            value={rejectNote}
            onChange={(ev) => setRejectNote(ev.target.value)}
            rows={3}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <div className={styles.actions}>
            <Button type="button" size="sm" onClick={handleReject}>
              Confirmar rechazo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRejectId(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
