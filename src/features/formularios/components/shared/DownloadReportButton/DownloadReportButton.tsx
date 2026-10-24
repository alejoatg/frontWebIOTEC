"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import type { FormReportConfig } from "../../../config/formReportTypes";
import { fetchFormReportById } from "../../../api/formReportsApi";
import { downloadSubmissionReport } from "../../../lib/downloadSubmissionReport";
import styles from "./DownloadReportButton.module.scss";

export interface DownloadReportButtonProps {
  config: FormReportConfig;
  /** Registro completo (detalle). Si no se envía, se consulta por `id`. */
  record?: Record<string, unknown>;
  /** Necesario cuando no se pasa `record` (p. ej. filas del listado). */
  id?: string;
  /** `button`: botón normal (detalle). `link`: texto compacto (listado). */
  variant?: "button" | "link";
}

export default function DownloadReportButton({
  config,
  record,
  id,
  variant = "button",
}: DownloadReportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      let full = record;
      if (!full) {
        if (!id) throw new Error("Falta el identificador del registro");
        setStatus("Consultando registro...");
        full = await fetchFormReportById(config, id);
      }
      await downloadSubmissionReport(config, full, setStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el reporte");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const label = busy ? "Preparando..." : "Descargar reporte";

  if (variant === "link") {
    return (
      <span className={styles.linkWrap}>
        <button
          type="button"
          className={styles.linkButton}
          onClick={handleClick}
          disabled={busy}
          title={busy && status ? status : "Descarga un ZIP con el reporte, imágenes y firmas"}
        >
          {label}
        </button>
        {error ? (
          <span className={styles.linkError} role="alert" title={error}>
            Error
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={handleClick} disabled={busy}>
        {busy ? (status ?? label) : label}
      </Button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
