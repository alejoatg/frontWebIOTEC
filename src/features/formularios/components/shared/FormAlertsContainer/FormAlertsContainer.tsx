"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { fetchAllFormReportPages } from "../../../api/formReportsApi";
import { FORM_ALERT_RULES } from "../../../config/formAlertRules";
import {
  FORM_ALERT_KIND_META,
  FORM_ALERT_KINDS,
  type FormAlertKind,
  type FormAlertRow,
} from "../../../config/formAlertTypes";
import { getFormReportBySlug } from "../../../config/formReportsRegistry";
import { getBogotaIsoDate } from "../../../lib/dateBogota";
import { evaluateFormAlerts } from "../../../lib/evaluateFormAlerts";
import styles from "./FormAlertsContainer.module.scss";

function badgeClass(tone: "danger" | "warning" | "info"): string {
  if (tone === "danger") return styles.badgeDanger;
  if (tone === "info") return styles.badgeInfo;
  return styles.badgeWarning;
}

export default function FormAlertsContainer() {
  const [fecha, setFecha] = useState(getBogotaIsoDate);
  const [kindFilter, setKindFilter] = useState<FormAlertKind | "all">("all");
  const [rows, setRows] = useState<FormAlertRow[]>([]);
  const [inspected, setInspected] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (day: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const batches = await Promise.all(
        FORM_ALERT_RULES.map(async (rule) => {
          const config = getFormReportBySlug(rule.slug);
          if (!config) return { inspected: 0, alerts: [] as FormAlertRow[] };
          const records = await fetchAllFormReportPages(config, {
            fechaDesde: day,
            fechaHasta: day,
            pageSize: 100,
          });
          const alerts: FormAlertRow[] = [];
          for (const record of records) {
            const matches = evaluateFormAlerts(record, rule);
            if (matches.length === 0) continue;
            alerts.push({
              id: String(record.id),
              slug: config.slug,
              formTitle: config.title,
              fecha: String(record.fecha ?? day),
              title: config.detailTitle(record),
              tecnico: (record.submittedBy as { name?: string } | undefined)?.name ?? "—",
              matches,
              record,
            });
          }
          return { inspected: records.length, alerts };
        }),
      );
      setInspected(batches.reduce((sum, item) => sum + item.inspected, 0));
      setRows(batches.flatMap((item) => item.alerts));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las alertas");
      setRows([]);
      setInspected(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(fecha);
  }, [fecha, load]);

  const visible = useMemo(
    () =>
      kindFilter === "all"
        ? rows
        : rows.filter((row) => row.matches.some((match) => match.kind === kindFilter)),
    [kindFilter, rows],
  );

  const counts = useMemo(() => {
    const byKind = Object.fromEntries(FORM_ALERT_KINDS.map((kind) => [kind, 0])) as Record<
      FormAlertKind,
      number
    >;
    for (const row of rows) {
      for (const match of row.matches) byKind[match.kind] += 1;
    }
    return byKind;
  }, [rows]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/formularios" className={styles.backLink}>
          <ArrowLeft size={20} />
          <span>Volver a Formularios</span>
        </Link>
        <h2 className={styles.title}>Alertas de formularios</h2>
        <p className={styles.subtitle}>
          Preoperacionales de vehículos y motocicletas del día elegido. Un mismo registro puede
          tener varias alertas.
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="alertas-fecha">Día</label>
          <input
            id="alertas-fecha"
            type="date"
            value={fecha}
            max={getBogotaIsoDate()}
            onChange={(e) => setFecha(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="button" onClick={() => void load(fecha)} disabled={isLoading}>
          {isLoading ? "Consultando…" : "Consultar"}
        </Button>
        <div className={styles.chips}>
          <button
            type="button"
            className={kindFilter === "all" ? styles.chipOn : styles.chip}
            onClick={() => setKindFilter("all")}
          >
            Todas ({rows.length})
          </button>
          {FORM_ALERT_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={kindFilter === kind ? styles.chipOn : styles.chip}
              onClick={() => setKindFilter(kind)}
            >
              {FORM_ALERT_KIND_META[kind].label} ({counts[kind]})
            </button>
          ))}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{inspected}</strong>
          Registros del día
        </div>
        <div className={styles.stat}>
          <strong>{rows.length}</strong>
          Con alerta
        </div>
      </div>

      {error ? (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      ) : null}

      {isLoading && rows.length === 0 ? (
        <div className={styles.loading}>Consultando registros del día…</div>
      ) : null}

      {!isLoading && !error && visible.length === 0 ? (
        <div className={styles.empty}>
          {rows.length === 0
            ? "No hay alertas para ese día en los formatos configurados."
            : "Ningún registro coincide con el tipo de alerta seleccionado."}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Formato</th>
                <th>Registro</th>
                <th>Técnico</th>
                <th>Alertas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={`${row.slug}-${row.id}`}>
                  <td>{row.formTitle}</td>
                  <td>{row.title}</td>
                  <td>{row.tecnico}</td>
                  <td>
                    <div className={styles.badges}>
                      {row.matches.map((match) => (
                        <span
                          key={match.kind}
                          className={badgeClass(FORM_ALERT_KIND_META[match.kind].tone)}
                        >
                          {FORM_ALERT_KIND_META[match.kind].label}
                        </span>
                      ))}
                    </div>
                    {row.matches.some((match) => match.details.length > 0) ? (
                      <p className={styles.details}>
                        {row.matches
                          .filter((match) => match.details.length > 0)
                          .map(
                            (match) =>
                              `${FORM_ALERT_KIND_META[match.kind].label}: ${match.details.join(", ")}`,
                          )
                          .join(" · ")}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/formularios/${row.slug}/${row.id}`}
                      className={styles.link}
                    >
                      Ver informe
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
