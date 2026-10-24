"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, FileSpreadsheet, FileText, X } from "lucide-react";
import type { FormReportListResponse } from "../../../config/formReportTypes";
import { getFormReportBySlug } from "../../../config/formReportsRegistry";
import {
  fetchAllFormReportDetailsForExport,
  fetchFormReportList,
} from "../../../api/formReportsApi";
import { exportFormReportRows } from "../../../lib/exportFormReport";
import {
  BULK_CHUNK_SIZE,
  downloadFilterReports,
  listFilterRecordIds,
} from "../../../lib/downloadFilterReports";
import { Button } from "@/components/Button";
import FormReportFilter from "../FormReportFilter";
import FormReportTable from "../FormReportTable";
import styles from "./FormReportContainer.module.scss";

export interface FormReportContainerProps {
  slug: string;
}

export default function FormReportContainer({ slug }: FormReportContainerProps) {
  const config = getFormReportBySlug(slug);
  if (!config) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Formulario no configurado</p>
      </div>
    );
  }
  const [data, setData] = useState<FormReportListResponse | null>(null);
  const [currentFilter, setCurrentFilter] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<string | null>(null);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const bulkAbortRef = useRef<AbortController | null>(null);

  const handleSearch = async (filter: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    setCurrentFilter(filter);
    try {
      const result = await fetchFormReportList(config, filter);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar los datos");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!currentFilter) return;
    await handleSearch({ ...currentFilter, page });
  };

  const handleExport = async (format: "xlsx" | "csv") => {
    if (!currentFilter) return;
    setIsExporting(true);
    setExportProgress(null);
    setError(null);
    try {
      const rows = await fetchAllFormReportDetailsForExport(
        config,
        currentFilter,
        (loaded, total) => {
          setExportProgress(`Cargando detalle ${loaded}/${total}...`);
        },
      );
      exportFormReportRows(config, rows, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleBulkDownload = async () => {
    if (!currentFilter || isBulkRunning) return;
    setError(null);
    setBulkSummary(null);
    setIsBulkRunning(true);
    setBulkProgress("Consultando registros del filtro...");
    try {
      const ids = await listFilterRecordIds(config, currentFilter);
      if (ids.length === 0) {
        setBulkSummary("El filtro no tiene registros para descargar.");
        return;
      }
      const parts = Math.ceil(ids.length / BULK_CHUNK_SIZE);
      const accepted = window.confirm(
        `Se descargarán ${ids.length} registro(s) con su PDF, fotos y firmas, ` +
          `en ${parts} archivo(s) ZIP de hasta ${BULK_CHUNK_SIZE} registros.\n\n` +
          "El proceso puede tardar varios minutos: mantén esta pestaña abierta " +
          "y, si el navegador lo pregunta, permite las descargas múltiples.\n\n" +
          "¿Continuar?",
      );
      if (!accepted) return;

      const controller = new AbortController();
      bulkAbortRef.current = controller;
      const result = await downloadFilterReports(config, ids, {
        signal: controller.signal,
        onProgress: (p) =>
          setBulkProgress(
            `Registro ${p.current}/${p.total} · Parte ${p.part}/${p.parts} · ${p.message}`,
          ),
      });
      setBulkSummary(
        `${result.cancelled ? "Cancelado. " : ""}Procesados ${result.processed} de ${result.total} registro(s) en ${result.parts} ZIP` +
          (result.failedRecords > 0
            ? `. ${result.failedRecords} con incidencias (ver errores.txt dentro de cada ZIP).`
            : "."),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en la descarga masiva");
    } finally {
      bulkAbortRef.current = null;
      setIsBulkRunning(false);
      setBulkProgress(null);
    }
  };

  const handleBulkCancel = () => {
    bulkAbortRef.current?.abort();
    setBulkProgress("Cancelando: se entregará lo procesado en la parte actual...");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/formularios" className={styles.backLink}>
          <ArrowLeft size={20} />
          <span>Volver a Formularios</span>
        </Link>
        <h2 className={styles.title}>{config.title}</h2>
        <p className={styles.subtitle}>{config.subtitle}</p>
      </div>

      <FormReportFilter config={config} onSearch={handleSearch} isLoading={isLoading} />

      {data && data.data.length > 0 ? (
        <div className={styles.exportBar}>
          <Button
            onClick={() => handleExport("xlsx")}
            disabled={isExporting || isLoading}
            variant="secondary"
          >
            <FileSpreadsheet size={18} />
            {isExporting ? "Exportando..." : "Excel (.xlsx)"}
          </Button>
          <Button
            onClick={() => handleExport("csv")}
            disabled={isExporting || isLoading}
            variant="secondary"
          >
            <FileText size={18} />
            {isExporting ? "Exportando..." : "CSV"}
          </Button>
          <Button
            onClick={handleBulkDownload}
            disabled={isExporting || isLoading || isBulkRunning}
            variant="secondary"
          >
            <Archive size={18} />
            {isBulkRunning ? "Descargando..." : "Reportes y fotos (ZIP)"}
          </Button>
          {isBulkRunning ? (
            <Button onClick={handleBulkCancel} variant="outline">
              <X size={18} />
              Cancelar
            </Button>
          ) : null}
          <span className={styles.exportHint}>
            {bulkProgress ??
              exportProgress ??
              "Excel/CSV: todos los registros de la consulta (fotos y firmas como enlaces). ZIP: PDF, fotos y firmas de cada registro, en partes de hasta 15."}
          </span>
          {bulkSummary ? <span className={styles.exportHint}>{bulkSummary}</span> : null}
        </div>
      ) : null}

      {error ? (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Consultando registros...</p>
        </div>
      ) : null}

      <FormReportTable
        config={config}
        data={data}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
