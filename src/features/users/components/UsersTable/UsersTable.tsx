import Image from "next/image";
import type { UserListItem } from "../../types";
import styles from "./UsersTable.module.scss";

export interface UsersTableProps {
  users: UserListItem[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  CORDINADOR: "Coordinador",
  SUPERVISOR: "Supervisor",
  COLABORADOR: "Colaborador",
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay usuarios registrados.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thUser}>Usuario</th>
            <th className={styles.thRole}>Rol</th>
            <th className={styles.thStatus}>Estado</th>
            <th className={styles.thLastLogin}>Último acceso</th>
            <th className={styles.thCreated}>Registrado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={styles.row}>
              <td className={styles.cellUser}>
                <div className={styles.userInfo}>
                  {user.picture ? (
                    <Image
                      src={user.picture}
                      alt=""
                      width={36}
                      height={36}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>
              </td>
              <td className={styles.cellRole}>
                <span className={`${styles.roleBadge} ${styles[`role${user.role}`]}`}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </td>
              <td className={styles.cellStatus}>
                <span
                  className={`${styles.statusBadge} ${user.isActive ? styles.statusActive : styles.statusInactive}`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className={styles.cellLastLogin}>{formatDate(user.lastLoginAt)}</td>
              <td className={styles.cellCreated}>{formatDate(user.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
