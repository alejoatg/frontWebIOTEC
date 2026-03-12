"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PreoperacionalesMotosFilter from "../PreoperacionalesMotosFilter";
import PreoperacionalesMotosTable from "../PreoperacionalesMotosTable";
import { fetchPreoperacionalesMotos } from "../../api/preoperacionalesMotosApi";
import type {
  PreoperacionalMoto,
  PreoperacionalMotoFilter,
  PaginatedResponse,
} from "../../types";
import styles from "./PreoperacionalesMotosContainer.module.scss";

export default function PreoperacionalesMotosContainer() {
  const [data, setData] = useState<PaginatedResponse<PreoperacionalMoto> | null>(null);
  const [currentFilter, setCurrentFilter] = useState<PreoperacionalMotoFilter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (filter: PreoperacionalMotoFilter) => {
    setIsLoading(true);
    setError(null);
    setCurrentFilter(filter);

    try {
      const result = await fetchPreoperacionalesMotos(filter);
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

    const newFilter = { ...currentFilter, page };
    await handleSearch(newFilter);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/formularios" className={styles.backLink}>
          <ArrowLeft size={20} />
          <span>Volver a Formularios</span>
        </Link>
        <h2 className={styles.title}>Preoperacionales Motos</h2>
        <p className={styles.subtitle}>
          Consulta las inspecciones diarias de vehículos tipo motocicleta
        </p>
      </div>

      <PreoperacionalesMotosFilter onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Consultando registros...</p>
        </div>
      )}

      {!isLoading && (
        <PreoperacionalesMotosTable
          data={data}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
