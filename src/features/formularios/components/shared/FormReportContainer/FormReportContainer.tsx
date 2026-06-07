"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import type { FormReportConfig } from "../../../config/formReportTypes";
import type { FormReportListResponse } from "../../../config/formReportTypes";
import {
  fetchAllFormReportPages,
  fetchFormReportList,
} from "../../../api/formReportsApi";
import { exportRowsToExcel } from "../../../lib/exportExcel";
import { Button } from "@/components/Button";
import FormReportFilter from "../FormReportFilter";
import FormReportTable from "../FormReportTable";
import styles from "./FormReportContainer.module.scss";

export interface FormReportContainerProps {
  config: FormReportConfig;
}

export default function FormReportContainer({ config }: FormReportContainerProps) {
  const [data, setData] = useState<FormReportListResponse | null>(null);
  const [currentFilter, setCurrentFilter] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExportExcel = async () => {
    if (!currentFilter) return;
    setIsExporting(true);
    setError(null);
    try {
      const rows = await fetchAllFormReportPages(config, currentFilter);
      const excelColumns = config.listColumns.map((col) => ({
        key: col.key,
        label: col.label,
        accessor: col.accessor,
      }));
      if (!excelColumns.some((c) => c.key === "submittedByEmail")) {
        excelColumns.push({
          key: "submittedByEmail",
          label: "Email técnico",
          accessor: (r) => (r.submittedBy as { email?: string })?.email,
        });
      }
      const stamp = new Date().toISOString().slice(0, 10);
      exportRowsToExcel(
        rows,
        excelColumns,
        `${config.excelFileName}_${stamp}.xlsx`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar Excel");
    } finally {
      setIsExporting(false);
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
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            variant="secondary"
          >
            <FileSpreadsheet size={18} />
            {isExporting ? "Exportando..." : "Exportar Excel (consulta completa)"}
          </Button>
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
