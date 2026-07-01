"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canReviewOvertime } from "@/features/dashboard/constants/nav";
import {
  closePeriod,
  downloadAuthenticatedFile,
  fetchConsolidations,
  fetchPeriod,
  pdfMonthUrl,
  type Consolidation,
  type OvertimePeriodDetail,
} from "../../api/overtimeApi";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";

export default function ConsolidadoContainer() {
  const { user } = useAuth();
  const canClose = canReviewOvertime(user?.role);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [period, setPeriod] = useState<OvertimePeriodDetail | null>(null);
  const [items, setItems] = useState<Consolidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [p, c] = await Promise.all([
        fetchPeriod(year, month),
        fetchConsolidations(year, month),
      ]);
      setPeriod(p);
      setItems(c);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Error al cargar" });
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClose() {
    if (!confirm("¿Cerrar el mes? Solo entran registros APPROVED. Esta acción no se puede deshacer.")) {
      return;
    }
    setClosing(true);
    setMessage(null);
    try {
      const r = await closePeriod(year, month);
      setMessage({
        type: "success",
        text: `Periodo ${r.periodCode} cerrado. ${r.consolidationsCreated} consolidados, ${r.pendingEntriesExcluded} pendientes excluidos.`,
      });
      await load();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Error al cerrar" });
    } finally {
      setClosing(false);
    }
  }

  return (
    <div>
      <PeriodSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      {period?.status === "OPEN" && canClose && (
        <div className={styles.toolbar}>
          <Button type="button" size="sm" disabled={closing} onClick={handleClose}>
            Cerrar mes
          </Button>
          {period.entryCounts && (
            <span style={{ fontSize: "0.875rem" }}>
              Pendientes: {period.entryCounts.PENDING ?? 0} · Aprobados:{" "}
              {period.entryCounts.APPROVED ?? 0}
            </span>
          )}
        </div>
      )}

      {message && (
        <div
          className={`${styles.alert} ${message.type === "error" ? styles.alertError : styles.alertSuccess}`}
        >
          {message.text}
        </div>
      )}

      {loading && <div className={styles.loading}>Cargando consolidado…</div>}

      {!loading && period?.status === "OPEN" && items.length === 0 && (
        <div className={`${styles.alert} ${styles.alertInfo}`}>
          El periodo aún está abierto. Cierre el mes para generar el consolidado por empleado.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Cédula</th>
                <th>Registros</th>
                <th>Total mes</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.employeeFullName}</td>
                  <td>{c.employeeDocumentNumber}</td>
                  <td>{c.approvedEntryCount}</td>
                  <td>{Number(c.totalAmountTotal).toLocaleString("es-CO")}</td>
                  <td>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadAuthenticatedFile(
                          pdfMonthUrl(c.employeeId, year, month),
                          `consolidado-${c.employeeDocumentNumber}.pdf`,
                        )
                      }
                    >
                      PDF mes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
