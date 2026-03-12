"use client";

import { Eye, Pencil, Ban } from "lucide-react";
import type { Motorcycle } from "../../types";
import styles from "./MotorcyclesTable.module.scss";

export interface MotorcyclesTableProps {
  motorcycles: Motorcycle[];
  onView: (motorcycle: Motorcycle) => void;
  onEdit: (motorcycle: Motorcycle) => void;
  onDeactivate: (motorcycle: Motorcycle) => void;
}

export default function MotorcyclesTable({
  motorcycles,
  onView,
  onEdit,
  onDeactivate,
}: MotorcyclesTableProps) {
  if (motorcycles.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay motocicletas registradas.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Marca</th>
            <th className={styles.thModelo}>Modelo</th>
            <th className={styles.thTipo}>Tipo</th>
            <th className={styles.thPropietario}>Propietario/Usuario</th>
            <th className={styles.thCedula}>Cédula</th>
            <th>Estado</th>
            <th className={styles.thActions}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {motorcycles.map((moto) => (
            <tr key={moto.id} className={styles.row}>
              <td>
                <span className={styles.placaBadge}>{moto.placa}</span>
              </td>
              <td className={styles.cellMarca}>{moto.marca}</td>
              <td className={styles.cellModelo}>{moto.modelo}</td>
              <td className={styles.cellTipo}>{moto.tipo}</td>
              <td className={styles.cellPropietario}>
                {moto.user ? (
                  <div className={styles.userBadge} title={moto.user.email}>
                    {moto.user.name}
                  </div>
                ) : (
                  moto.propietario
                )}
              </td>
              <td className={styles.cellCedula}>{moto.cedula}</td>
              <td>
                <span
                  className={`${styles.statusBadge} ${moto.isActive ? styles.statusActive : styles.statusInactive}`}
                >
                  {moto.isActive ? "Activa" : "Inactiva"}
                </span>
              </td>
              <td>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onView(moto)}
                    title="Ver detalle"
                    aria-label={`Ver detalle de ${moto.placa}`}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onEdit(moto)}
                    title="Editar"
                    aria-label={`Editar ${moto.placa}`}
                    disabled={!moto.isActive}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionDanger}`}
                    onClick={() => onDeactivate(moto)}
                    title="Inactivar"
                    aria-label={`Inactivar ${moto.placa}`}
                    disabled={!moto.isActive}
                  >
                    <Ban size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
