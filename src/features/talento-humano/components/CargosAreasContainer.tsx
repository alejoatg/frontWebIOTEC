"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useHrOrg } from "../hooks/useHrOrg";
import type { AreaItem, JobPositionItem, WorkProcessItem, ZoneItem } from "../types";
import listStyles from "./listShared.module.scss";
import styles from "./tables.module.scss";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`${styles.statusBadge} ${active ? styles.statusActive : styles.statusInactive}`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function CargosTable({ items }: { items: JobPositionItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay cargos registrados.</p>
      </div>
    );
  }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Cargo</th>
            <th>Asignaciones</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={styles.row}>
              <td className={styles.name}>{item.name}</td>
              <td>{item._count.employeeWorkLocations}</td>
              <td>
                <StatusBadge active={item.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AreasTable({ items }: { items: AreaItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay áreas registradas.</p>
      </div>
    );
  }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Área</th>
            <th>UEN</th>
            <th>Procesos</th>
            <th>Asignaciones</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={styles.row}>
              <td className={styles.name}>{item.name}</td>
              <td>{item.managementUnit?.name ?? "—"}</td>
              <td>{item._count.workProcesses}</td>
              <td>{item._count.employeeWorkLocations}</td>
              <td>
                <StatusBadge active={item.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcesosTable({ items }: { items: WorkProcessItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay procesos registrados.</p>
      </div>
    );
  }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Proceso</th>
            <th>Área</th>
            <th>UEN</th>
            <th>Asignaciones</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={styles.row}>
              <td className={styles.name}>{item.name}</td>
              <td>{item.area?.name ?? "—"}</td>
              <td>{item.area?.managementUnit?.name ?? "—"}</td>
              <td>{item._count.employeeWorkLocations}</td>
              <td>
                <StatusBadge active={item.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ZonesTable({ items }: { items: ZoneItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay zonas registradas.</p>
      </div>
    );
  }
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Zona</th>
            <th>Asignaciones</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={styles.row}>
              <td className={styles.name}>{item.name}</td>
              <td>{item._count.employeeWorkLocations}</td>
              <td>
                <StatusBadge active={item.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CargosAreasContainer() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const { jobPositions, areas, zones, workProcesses, loading, error, refetch } =
    useHrOrg(includeInactive);

  if (loading && jobPositions.length === 0 && areas.length === 0) {
    return (
      <div className={listStyles.loading}>
        <div className={listStyles.spinner} />
        <span>Cargando organización laboral...</span>
      </div>
    );
  }

  if (error && jobPositions.length === 0 && areas.length === 0) {
    return (
      <div className={listStyles.error}>
        <p>{error}</p>
        <button type="button" className={listStyles.retryBtn} onClick={() => void refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const total =
    jobPositions.length + areas.length + workProcesses.length + zones.length;

  return (
    <div className={listStyles.container}>
      <div className={listStyles.header}>
        <div className={listStyles.summary}>
          <span className={listStyles.count}>{total}</span>
          <span className={listStyles.countLabel}>registros de organización</span>
        </div>
        <div className={listStyles.toolbar}>
          <label className={listStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Incluir inactivos
          </label>
          <button
            type="button"
            className={listStyles.refreshBtn}
            onClick={() => void refetch()}
            aria-label="Actualizar"
            title="Actualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h3 className={styles.sectionTitle}>Cargos ({jobPositions.length})</h3>
          <CargosTable items={jobPositions} />
        </section>
        <section className={styles.panel}>
          <h3 className={styles.sectionTitle}>Áreas ({areas.length})</h3>
          <AreasTable items={areas} />
        </section>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h3 className={styles.sectionTitle}>Procesos ({workProcesses.length})</h3>
          <ProcesosTable items={workProcesses} />
        </section>
        <section className={styles.panel}>
          <h3 className={styles.sectionTitle}>Zonas ({zones.length})</h3>
          <ZonesTable items={zones} />
        </section>
      </div>
    </div>
  );
}
