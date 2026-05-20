"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AtuFormatoUnicoFilter from "../AtuFormatoUnicoFilter";
import AtuFormatoUnicoTable from "../AtuFormatoUnicoTable";
import { fetchAtuFormatoUnico } from "../../api/atuFormatoUnicoApi";
import type {
  AtuFormatoUnicoRecord,
  AtuFormatoUnicoFilter as AtuFilter,
  PaginatedResponse,
} from "../../types";
import styles from "./AtuFormatoUnicoContainer.module.scss";

export default function AtuFormatoUnicoContainer() {
  const [data, setData] = useState<PaginatedResponse<AtuFormatoUnicoRecord> | null>(null);
  const [currentFilter, setCurrentFilter] = useState<AtuFilter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (filter: AtuFilter) => {
    setIsLoading(true);
    setError(null);
    setCurrentFilter(filter);

    try {
      const result = await fetchAtuFormatoUnico(filter);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/formularios" className={styles.backLink}>
          <ArrowLeft size={20} />
          <span>Volver a Formularios</span>
        </Link>
        <h2 className={styles.title}>Formato Único ATU</h2>
        <p className={styles.subtitle}>
          Consulta las actividades de proceso de Alta Tensión (FR-338) enviadas desde IOTEC Forms
        </p>
      </div>

      <AtuFormatoUnicoFilter onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {isLoading && !data && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Consultando registros...</p>
        </div>
      )}

      {!isLoading && (
        <AtuFormatoUnicoTable
          data={data}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
