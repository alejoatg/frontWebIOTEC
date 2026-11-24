"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { downloadFlujosExcel, fetchFlujos } from "./api";
import { currentMonthRange, FLUJO_STATUS_LABEL, FLUJO_STATUS_OPTIONS } from "./status";
import type { FlujoListFilter, FlujoListResponse } from "./types";
import styles from "./FlujosListContainer.module.scss";

export default function FlujosListContainer() {
  const router = useRouter();
  const month = currentMonthRange();
  const [fechaDesde, setFechaDesde] = useState(month.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(month.fechaHasta);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FlujoListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filter: FlujoListFilter = {
    fechaDesde,
    fechaHasta,
    status: status || undefined,
    search: search || undefined,
    page,
    pageSize: 50,
  };

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFlujos({ ...filter, page: nextPage });
      setData(result);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await downloadFlujosExcel(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Flujos · Atención de abejas</h2>
          <p className={styles.subtitle}>
            Programación web, visitas de campo y radicado consecutivo ATN.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/flujos/nuevo")}>
          <Plus size={18} />
          Nueva programación
        </Button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGrid}>
          <Input
            label="Desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
          <label>
            <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 4 }}>
              Estado
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">Todos</option>
              {FLUJO_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Buscar"
            placeholder="Radicado, nombre o cédula"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(1);
            }}
          />
        </div>
        <div className={styles.filterActions}>
          <Button onClick={() => void load(1)} disabled={loading}>
            {loading ? "Consultando..." : "Consultar"}
          </Button>
          <Button variant="secondary" onClick={() => void handleExport()} disabled={exporting || loading}>
            <FileSpreadsheet size={18} />
            {exporting ? "Exportando..." : "Excel"}
          </Button>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!data ? (
        <div className={styles.empty}>
          {loading ? "Cargando..." : "Aplica los filtros y consulta."}
        </div>
      ) : data.data.length === 0 ? (
        <div className={styles.empty}>No hay atenciones con esos filtros.</div>
      ) : (
        <div className={styles.tableWrap}>
          <div className={styles.summary}>
            Mostrando {(data.pagination.page - 1) * data.pagination.pageSize + 1} -{" "}
            {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} de{" "}
            {data.pagination.total}
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Detalle</th>
                <th>Radicado</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Barrio</th>
                <th>Visitas</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <tr key={row.id} className={styles.row}>
                  <td>
                    <Link href={`/dashboard/flujos/${row.id}`} className={styles.link}>
                      Ver
                    </Link>
                  </td>
                  <td>{row.radicado}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[row.status]}`}>
                      {FLUJO_STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td>{row.fecha}</td>
                  <td>{row.programacion?.nombre ?? "—"}</td>
                  <td>{row.programacion?.barrio ?? "—"}</td>
                  <td>{row.visitas?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.pagination.totalPages > 1 ? (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1 || loading}
                onClick={() => void load(page - 1)}
              >
                ← Anterior
              </button>
              <span>
                Página {data.pagination.page} de {data.pagination.totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= data.pagination.totalPages || loading}
                onClick={() => void load(page + 1)}
              >
                Siguiente →
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
