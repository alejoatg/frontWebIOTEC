"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components";
import {
  batchFileUrl,
  downloadAuthenticatedFile,
  fetchBatches,
  type OvertimeBatch,
} from "../../api/overtimeApi";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";

export default function PlanillasContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [batches, setBatches] = useState<OvertimeBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBatches(await fetchBatches(year, month));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PeriodSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      {loading && <div className={styles.loading}>Cargando planillas…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Archivo</th>
                <th>Filas</th>
                <th>Subido por</th>
                <th>Fecha</th>
                <th>Excel</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6}>Sin planillas en este periodo</td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.batchCode}</td>
                    <td>{b.originalFilename}</td>
                    <td>{b.rowCount}</td>
                    <td>{b.uploadedBy.name}</td>
                    <td>{new Date(b.registeredAt).toLocaleString("es-CO")}</td>
                    <td>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadAuthenticatedFile(
                            batchFileUrl(b.id),
                            b.originalFilename,
                          )
                        }
                      >
                        Descargar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
