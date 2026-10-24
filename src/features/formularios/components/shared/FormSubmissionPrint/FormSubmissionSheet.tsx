"use client";

import { forwardRef } from "react";
import { MediaImage } from "@/components/MediaImage";
import type { FormReportConfig } from "../../../config/formReportTypes";
import { collectEvidences } from "../../../lib/collectEvidences";
import {
  formatCellValue,
  formatDateTime,
  humanizeFieldKey,
} from "../../../lib/formatters";
import { parseCoordinate } from "../../../lib/parseCoordinate";
import { mediaViewPageUrl } from "@/lib/mediaViewUrl";
import { buildPrintDetailSections } from "../../../lib/buildFormReportDisplay";
import styles from "./FormSubmissionPrint.module.scss";

export interface FormSubmissionSheetProps {
  config: FormReportConfig;
  record: Record<string, unknown>;
  /** `pdf`: ancho fijo A4 y estilos compactos de impresión, para captura con html2canvas. */
  variant?: "screen" | "pdf";
}

/**
 * Hoja del informe (logo, encabezado, secciones y evidencias).
 * Los elementos con `data-pdf-block` son los puntos donde el exportador puede cortar página.
 */
const FormSubmissionSheet = forwardRef<HTMLElement, FormSubmissionSheetProps>(
  function FormSubmissionSheet({ config, record, variant = "screen" }, ref) {
    const tecnico = (record.submittedBy as { name?: string })?.name ?? "—";
    const evidences = collectEvidences(record, config.evidenceFields);
    const subtitle = config.detailTitle(record);
    const detailSections = buildPrintDetailSections(config, record);

    const lat = config.locationField
      ? parseCoordinate(record[config.locationField.latKey])
      : null;
    const lng = config.locationField
      ? parseCoordinate(record[config.locationField.lngKey])
      : null;
    const hasLocation = lat != null && lng != null && !(lat === 0 && lng === 0);
    const showLocationSection = Boolean(config.locationField);

    const sheetClass =
      variant === "pdf" ? `${styles.sheet} ${styles.sheetPdf}` : styles.sheet;

    return (
      <article ref={ref} className={sheetClass}>
        <header className={styles.sheetHeader} data-pdf-block>
          <div className={styles.headerTop}>
            <img
              className={styles.logo}
              src="/images/logo-uten-print.png"
              alt="UTEN"
            />
            <div className={styles.orgBlock}>
              <p className={styles.orgName}>
                Unión de trabajadores de la industria energética nacional - UTEN{" "}
                <span className={styles.nit}>· NIT: 900262482-5</span>
              </p>
            </div>
          </div>

          <h1 className={styles.formTitle}>{config.title}</h1>
          <p className={styles.formSubtitle}>{subtitle}</p>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <strong>Sincronizado:</strong>
              <span>{formatDateTime(record.syncedAt as string)}</span>
            </div>
            <div className={styles.metaItem}>
              <strong>Técnico:</strong>
              <span>{tecnico}</span>
            </div>
            {record.startedAt ? (
              <div className={styles.metaItem}>
                <strong>Inicio:</strong>
                <span>{formatDateTime(record.startedAt as string)}</span>
              </div>
            ) : null}
            {record.completedAt ? (
              <div className={styles.metaItem}>
                <strong>Fin:</strong>
                <span>{formatDateTime(record.completedAt as string)}</span>
              </div>
            ) : null}
          </div>
        </header>

        {showLocationSection ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle} data-pdf-block data-pdf-keep-next>
              {config.locationField?.label ?? "Ubicación GPS"}
            </h2>
            {hasLocation && lat != null && lng != null ? (
              <p className={styles.coords} data-pdf-block>
                Coordenadas: {lat}, {lng}
              </p>
            ) : (
              <p className={styles.noLocation} data-pdf-block>
                Este registro no tiene coordenadas GPS capturadas (lat/lng vacíos
                o inválidos).
              </p>
            )}
          </section>
        ) : null}

        {detailSections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle} data-pdf-block data-pdf-keep-next>
              {section.title}
            </h2>
            <dl className={styles.fieldList}>
              {section.keys.map((key) => (
                <div key={key} className={styles.fieldRow} data-pdf-block>
                  <dt>{humanizeFieldKey(key)}</dt>
                  <dd>{formatCellValue(record[key])}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {evidences.length > 0 ? (
          <section className={styles.evidenceSection}>
            <h2 className={styles.sectionTitle} data-pdf-block data-pdf-keep-next>
              Firmas y evidencias fotográficas
            </h2>
            <div className={styles.evidenceGrid}>
              {evidences.map((item) => {
                const viewUrl = mediaViewPageUrl(item.url, {
                  label: item.label,
                });
                const isSignature = item.label.toLowerCase().includes("firma");
                return (
                  <figure
                    key={`${item.label}-${item.url}`}
                    className={`${styles.evidenceItem} ${
                      isSignature ? styles.evidenceSignature : styles.evidencePhoto
                    }`}
                    data-pdf-block
                  >
                    <figcaption>{item.label}</figcaption>
                    <MediaImage
                      src={item.url}
                      alt={item.label}
                      className={
                        isSignature ? styles.signatureImg : styles.photoImg
                      }
                    />
                    {viewUrl ? (
                      <a
                        className={styles.evidenceLink}
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver original
                      </a>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </section>
        ) : null}
      </article>
    );
  },
);

export default FormSubmissionSheet;
