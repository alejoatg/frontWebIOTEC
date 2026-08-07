import type { EmployeeListItem } from "../types";
import styles from "./tables.module.scss";

export default function TrabajadoresTable({ employees }: { employees: EmployeeListItem[] }) {
  if (employees.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay trabajadores para mostrar.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Trabajador</th>
            <th>Cédula</th>
            <th>Cargo</th>
            <th>Área</th>
            <th>Zona</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className={styles.row}>
              <td>
                <div className={styles.name}>{emp.fullName}</div>
                {emp.email ? <div className={styles.muted}>{emp.email}</div> : null}
              </td>
              <td className={styles.doc}>{emp.documentNumber}</td>
              <td>{emp.jobPosition ?? "—"}</td>
              <td>{emp.area ?? "—"}</td>
              <td>{emp.zone ?? "—"}</td>
              <td>
                <span
                  className={`${styles.statusBadge} ${emp.isActive ? styles.statusActive : styles.statusInactive}`}
                >
                  {emp.isActive ? "Activo" : "Inactivo"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
