"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { fetchCatalog, fetchCatalogItems } from "../api/catalogsApi";
import type { CatalogItemOption, CatalogSummary } from "../types";
import styles from "./CatalogDetailContainer.module.scss";

interface Props {
  code: string;
}

export default function CatalogDetailContainer({ code }: Props) {
  const [catalog, setCatalog] = useState<CatalogSummary | null>(null);
  const [items, setItems] = useState<CatalogItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogRes, itemsRes] = await Promise.all([
        fetchCatalog(code),
        fetchCatalogItems(code, true),
      ]);
      setCatalog(catalogRes);
      setItems(itemsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className={styles.error}>
        <p>{error ?? "Catálogo no encontrado"}</p>
        <Link href="/dashboard/catalogos">Volver</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Link href="/dashboard/catalogos" className={styles.backLink}>
          <ArrowLeft size={18} />
          Catálogos
        </Link>
        <button type="button" className={styles.refreshBtn} onClick={load} aria-label="Actualizar">
          <RefreshCw size={18} />
        </button>
      </div>

      <header className={styles.header}>
        <span className={styles.code}>{catalog.code}</span>
        <h1 className={styles.title}>{catalog.name}</h1>
        {catalog.description ? <p className={styles.description}>{catalog.description}</p> : null}
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Clave</th>
              <th>Valor</th>
              <th>Orden</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  Sin ítems registrados
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.key}>
                  <td>
                    <code>{item.key}</code>
                  </td>
                  <td>{item.value}</td>
                  <td>{item.sortOrder}</td>
                  <td>
                    <span
                      className={item.isActive ? styles.badge : styles.badgeInactive}
                    >
                      {item.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
