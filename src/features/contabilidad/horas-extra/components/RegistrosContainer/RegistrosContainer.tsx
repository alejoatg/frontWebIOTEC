"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components";
import { fetchEntries, type OvertimeEntryRow } from "../../api/overtimeApi";
import EntryActions from "../EntryActions/EntryActions";
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
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OvertimeEntryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <Link href="/dashboard/contabilidad/horas-extra/registros/planilla">
          <Button type="button" variant="outline" size="sm">
            Vista planilla (Excel)
          </Button>
        </Link>
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
                      <td>
                        <Link
                          href={`/dashboard/contabilidad/horas-extra/registros/${e.id}`}
                          style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
                        >
                          {e.entryCode}
                        </Link>
                      </td>
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
                        <EntryActions
                          entryId={e.id}
                          employeeId={e.employeeId}
                          employeeDocumentNumber={e.employeeDocumentNumber}
                          entryCode={e.entryCode}
                          workDate={e.workDate}
                          status={e.status}
                          periodYear={year}
                          periodMonth={month}
                          onActionComplete={load}
                          showDetailLink
                        />
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
    </div>
  );
}
