"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import TrabajadoresTable from "./TrabajadoresTable";
import styles from "./listShared.module.scss";

export default function TrabajadoresListContainer() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const { employees, loading, error, refetch } = useEmployees({ search, includeInactive });

  const countLabel = useMemo(
    () => (employees.length === 1 ? "trabajador" : "trabajadores"),
    [employees.length],
  );

  const applySearch = () => setSearch(searchInput.trim());

  if (loading && employees.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Cargando trabajadores...</span>
      </div>
    );
  }

  if (error && employees.length === 0) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button type="button" className={styles.retryBtn} onClick={() => void refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.summary}>
          <span className={styles.count}>{employees.length}</span>
          <span className={styles.countLabel}>{countLabel}</span>
        </div>
        <div className={styles.toolbar}>
          <Link href="/dashboard/talento-humano/trabajadores/nuevo" className={styles.primaryBtn}>
            <Plus size={18} />
            Agregar trabajador
          </Link>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nombre o cédula..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
          />
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={applySearch}
            aria-label="Buscar"
            title="Buscar"
          >
            <Search size={18} />
          </button>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Incluir inactivos
          </label>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => void refetch()}
            aria-label="Actualizar lista"
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      {error ? (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      ) : null}
      <TrabajadoresTable employees={employees} />
    </div>
  );
}
