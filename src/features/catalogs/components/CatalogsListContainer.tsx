"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, RefreshCw } from "lucide-react";
import { fetchCatalogs } from "../api/catalogsApi";
import type { CatalogSummary } from "../types";
import styles from "./CatalogsListContainer.module.scss";

export default function CatalogsListContainer() {
  const [catalogs, setCatalogs] = useState<CatalogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCatalogs(await fetchCatalogs());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Cargando catálogos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button type="button" onClick={load}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.hint}>
          Diccionario maestro del sistema: cada catálogo agrupa pares <strong>clave → valor</strong>{" "}
          reutilizables en formularios, empleados y reportes.
        </p>
        <button type="button" className={styles.refreshBtn} onClick={load} aria-label="Actualizar">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className={styles.grid}>
        {catalogs.map((catalog) => (
          <Link
            key={catalog.code}
            href={`/dashboard/catalogos/${catalog.code}`}
            className={styles.card}
          >
            <div className={styles.cardIcon}>
              <BookOpen size={22} />
            </div>
            <div className={styles.cardBody}>
              <span className={styles.code}>{catalog.code}</span>
              <h3 className={styles.name}>{catalog.name}</h3>
              {catalog.description ? (
                <p className={styles.description}>{catalog.description}</p>
              ) : null}
              <span className={styles.count}>
                {catalog.itemCount} {catalog.itemCount === 1 ? "ítem" : "ítems"}
              </span>
            </div>
            <ChevronRight size={20} className={styles.chevron} />
          </Link>
        ))}
      </div>
    </div>
  );
}
