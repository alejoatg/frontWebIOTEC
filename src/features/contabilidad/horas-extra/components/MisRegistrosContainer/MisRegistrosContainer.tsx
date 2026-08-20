"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canSeeOvertimeMoney } from "@/features/dashboard/constants/nav";
import { fetchMyEntries, type OvertimeEntryRow } from "../../api/overtimeApi";
import {
  OVERTIME_STATUS_OPTIONS,
  overtimeStatusLabel,
} from "../../lib/overtimeStatus";
import { formatClockTime } from "../../lib/timeFormat";
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
  const { user } = useAuth();
  const canSeeMoney = canSeeOvertimeMoney(user?.role);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OvertimeEntryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<OvertimeEntryRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyEntries({
        year,
        month,
        status: status || undefined,
        page,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [year, month, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-CO");
  }

  return (
    <div>
      <p className={styles.hint}>
        Consulta los registros de tiempo suplementario que usted digitó o cargó.
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
        }}
      />

      <div className={styles.toolbar}>
        <label>
          Estado{" "}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {OVERTIME_STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {overtimeStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={load}>
          Actualizar
        </Button>
      </div>

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
                  <th>TSD</th>
                  <th>TSN</th>
                  <th>Estado</th>
                  {canSeeMoney && <th>Total</th>}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={canSeeMoney ? 11 : 10}>
                      No hay registros digitados por usted en este periodo
                    </td>
                  </tr>
                ) : (
                  items.map((e) => (
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
                      <td>{formatDate(e.workDate)}</td>
                      <td>{formatClockTime(e.startTime) || "—"}</td>
                      <td>{formatClockTime(e.endTime) || "—"}</td>
                      <td>{fmtHours(e.hoursTsd)}</td>
                      <td>{fmtHours(e.hoursTsn)}</td>
                      <td>
                        <span className={`${styles.badge} ${statusClass(e.status)}`}>
                          {overtimeStatusLabel(e.status)}
                        </span>
                      </td>
                      {canSeeMoney && (
                        <td>{Number(e.amountTotal ?? 0).toLocaleString("es-CO")}</td>
                      )}
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
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setVoidTarget(e)}
                            >
                              Anular
                            </Button>
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
