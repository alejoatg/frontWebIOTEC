"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, FileText } from "lucide-react";
import type { FormReportListResponse } from "../../../config/formReportTypes";
import { getFormReportBySlug } from "../../../config/formReportsRegistry";
import {
  fetchAllFormReportDetailsForExport,
  fetchFormReportList,
} from "../../../api/formReportsApi";
import { exportFormReportRows } from "../../../lib/exportFormReport";
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
          <span className={styles.exportHint}>
            {exportProgress ??
              "Exporta todos los registros de la consulta con los mismos campos del detalle. Fotos y firmas como enlaces."}
          </span>
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
