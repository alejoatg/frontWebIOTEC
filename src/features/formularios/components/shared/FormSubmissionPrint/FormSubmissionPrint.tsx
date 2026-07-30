"use client";

import { Button } from "@/components/Button";
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

export interface FormSubmissionPrintProps {
  config: FormReportConfig;
  record: Record<string, unknown>;
}

export default function FormSubmissionPrint({
  config,
  record,
}: FormSubmissionPrintProps) {
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

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          <strong>{config.title}</strong>
          <span>{subtitle}</span>
        </div>
        <div className={styles.toolbarActions}>
          <Button type="button" size="sm" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.close()}
          >
            Cerrar
          </Button>
        </div>
      </div>

      <article className={styles.sheet}>
        <header className={styles.sheetHeader}>
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
            <h2 className={styles.sectionTitle}>
              {config.locationField?.label ?? "Ubicación GPS"}
            </h2>
            {hasLocation && lat != null && lng != null ? (
              <p className={styles.coords}>
                Coordenadas: {lat}, {lng}
              </p>
            ) : (
              <p className={styles.noLocation}>
                Este registro no tiene coordenadas GPS capturadas (lat/lng vacíos
                o inválidos).
              </p>
            )}
          </section>
        ) : null}

        {detailSections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <dl className={styles.fieldList}>
              {section.keys.map((key) => (
                <div key={key} className={styles.fieldRow}>
                  <dt>{humanizeFieldKey(key)}</dt>
                  <dd>{formatCellValue(record[key])}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {evidences.length > 0 ? (
          <section className={styles.evidenceSection}>
            <h2 className={styles.sectionTitle}>
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
    </div>
  );
}
