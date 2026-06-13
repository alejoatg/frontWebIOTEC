"use client";

import { useRef, useState } from "react";
import type { FormReportConfig } from "../../../config/formReportTypes";
import { collectEvidences } from "../../../lib/collectEvidences";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { exportElementToPdf } from "../../../lib/exportPdf";
import {
  formatCellValue,
  formatDateTime,
  humanizeFieldKey,
} from "../../../lib/formatters";
import { Button } from "@/components/Button";
import styles from "./FormDetailReport.module.scss";

export interface FormDetailReportProps {
  config: FormReportConfig;
  record: Record<string, unknown>;
}

export default function FormDetailReport({ config, record }: FormDetailReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const tecnico = (record.submittedBy as { name?: string })?.name ?? "—";
  const evidences = collectEvidences(record, config.evidenceFields).map((item) => ({
    ...item,
    url: resolveMediaUrl(item.url),
  }));

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setExportingPdf(true);
    try {
      await exportElementToPdf(
        reportRef.current,
        `${config.excelFileName}-${String(record.id).slice(0, 8)}.pdf`,
        config.title,
      );
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <Button onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? "Generando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      <div ref={reportRef} className={styles.report}>
        <header className={styles.reportHeader}>
          <h1 className={styles.reportTitle}>{config.title}</h1>
          <p className={styles.reportSubtitle}>{config.detailTitle(record)}</p>
          <div className={styles.meta}>
            <span>
              <strong>Sincronizado:</strong> {formatDateTime(record.syncedAt as string)}
            </span>
            {record.startedAt ? (
              <span>
                <strong>Inicio diligenciamiento:</strong>{" "}
                {formatDateTime(record.startedAt as string)}
              </span>
            ) : null}
            {record.completedAt ? (
              <span>
                <strong>Fin diligenciamiento:</strong>{" "}
                {formatDateTime(record.completedAt as string)}
              </span>
            ) : null}
            <span>
              <strong>Técnico:</strong> {tecnico}
            </span>
          </div>
        </header>

        {config.detailSections.map((section) => {
          const visibleKeys = section.keys.filter((key) => {
            const value = record[key];
            return value !== undefined && value !== null && value !== "";
          });
          if (visibleKeys.length === 0) return null;
          return (
            <section key={section.title} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <dl className={styles.fieldList}>
                {visibleKeys.map((key) => (
                  <div key={key} className={styles.fieldRow}>
                    <dt>{humanizeFieldKey(key)}</dt>
                    <dd>{formatCellValue(record[key])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}

        {evidences.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Firmas y evidencias fotográficas</h2>
            <div className={styles.evidenceGrid}>
              {evidences.map((item) => (
                <figure key={`${item.label}-${item.url}`} className={styles.evidenceItem}>
                  <figcaption>{item.label}</figcaption>
                  {item.label.toLowerCase().includes("firma") ? (
                    <img
                      src={item.url}
                      alt={item.label}
                      className={styles.signatureImg}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.label}
                      className={styles.photoImg}
                    />
                  )}
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
