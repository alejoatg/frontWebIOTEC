"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components";
import { fetchEntries, type OvertimeEntryRow } from "../../api/overtimeApi";
import { SPREADSHEET_COLUMNS } from "../../lib/entrySpreadsheet";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "./RegistrosPlanillaContainer.module.scss";
import shared from "../../styles/shared.module.scss";

const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "REJECTED", "SUPERSEDED"];

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
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<OvertimeEntryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries({
        year,
        month,
        status: status || undefined,
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
  }, [year, month, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PeriodSelector
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
          setPage(1);
        }}
      />

      <div className={shared.toolbar}>
        <label>
          Estado{" "}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "Todos"}
              </option>
            ))}
          </select>
        </label>
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
                  <th className={styles.stickyActions}>Detalle</th>
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
                        <Link
                          href={`/dashboard/contabilidad/horas-extra/registros/${entry.id}`}
                          className={styles.detailLink}
                        >
                          Abrir
                        </Link>
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
    </div>
  );
}
