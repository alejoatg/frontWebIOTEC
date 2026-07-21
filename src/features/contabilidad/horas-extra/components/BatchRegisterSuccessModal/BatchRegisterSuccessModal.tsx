"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components";
import {
  batchRegisterPrintPageUrl,
  fetchBatchPrintData,
  type BatchRegisterPrintData,
} from "../../api/overtimeApi";
import { formatClockTime } from "../../lib/timeFormat";
import styles from "./BatchRegisterSuccessModal.module.scss";

interface Props {
  batchId: string;
  onClose: () => void;
}

function fmtMoney(n: number) {
  return n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

export default function BatchRegisterSuccessModal({ batchId, onClose }: Props) {
  const [data, setData] = useState<BatchRegisterPrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchBatchPrintData(batchId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "No se pudo cargar el detalle");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  function openPrint(auto = false) {
    window.open(batchRegisterPrintPageUrl(batchId, auto), "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="batch-success-title">
      <div className={styles.dialog}>
        <header className={styles.header}>
          <div>
            <h2 id="batch-success-title">Registro exitoso</h2>
            {data && (
              <p className={styles.sub}>
                Planilla <strong>{data.batchCode}</strong> · {data.sourceLabel} · {data.entryCount}{" "}
                registro(s) · Periodo {data.periodCode}
              </p>
            )}
          </div>
          <div className={styles.headerActions}>
            <Button type="button" size="sm" onClick={() => openPrint(true)} disabled={!data}>
              Imprimir / Guardar PDF
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          {loading && <div className={styles.loading}>Cargando registros…</div>}
          {error && <div className={styles.error}>{error}</div>}
          {data && !loading && (
            <>
              <div className={styles.meta}>
                <span>Registró: {data.registeredBy}</span>
                <span>{new Date(data.registeredAt).toLocaleString("es-CO")}</span>
                <span>Total $: {fmtMoney(data.totalAmount)}</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cédula</th>
                      <th>Nombre</th>
                      <th>Fecha</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Consigna</th>
                      <th>Total $</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.entryCode}>
                        <td>{row.entryCode}</td>
                        <td>{row.employeeDocumentNumber}</td>
                        <td>{row.employeeFullName}</td>
                        <td>{row.workDate}</td>
                        <td>{formatClockTime(row.startTime) || row.startTime || "—"}</td>
                        <td>{formatClockTime(row.endTime) || row.endTime || "—"}</td>
                        <td className={styles.consigna}>{row.consigna || "—"}</td>
                        <td className={styles.num}>{fmtMoney(row.amountTotal)}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
