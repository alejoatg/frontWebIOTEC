import Image from "next/image";
import type { UserListItem, UserRole } from "../../types";
import styles from "./UsersTable.module.scss";

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "ADMIN", label: "Administrador" },
  { value: "CORDINADOR", label: "Coordinador" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "ANALISTA", label: "Analista" },
  { value: "CONTABILIDAD", label: "Contabilidad" },
  { value: "TALENTO_HUMANO", label: "Talento humano" },
  { value: "TECNICO", label: "Técnico" },
  { value: "LIDER_BRIGADA", label: "Líder de brigada" },
  { value: "HSE", label: "HSE" },
];

export interface UsersTableProps {
  users: UserListItem[];
  savingRoleId: string | null;
  onRoleChange: (user: UserListItem, role: UserRole) => void;
  onEditGroup: (user: UserListItem) => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  CORDINADOR: "Coordinador",
  SUPERVISOR: "Supervisor",
  TECNICO: "Técnico",
  LIDER_BRIGADA: "Líder de brigada",
  HSE: "HSE",
  TALENTO_HUMANO: "Talento humano",
  COLABORADOR: "Colaborador",
  CONTABILIDAD: "Contabilidad",
  ANALISTA: "Analista",
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

export default function UsersTable({
  users,
  savingRoleId,
  onRoleChange,
  onEditGroup,
}: UsersTableProps) {
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
            <th className={styles.thActions}>Grupo</th>
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
                <select
                  className={styles.roleSelect}
                  value={ROLE_OPTIONS.some((r) => r.value === user.role) ? user.role : ""}
                  disabled={savingRoleId === user.id}
                  aria-label={`Rol de ${user.name}`}
                  onChange={(e) => onRoleChange(user, e.target.value as UserRole)}
                >
                  {!ROLE_OPTIONS.some((r) => r.value === user.role) && (
                    <option value="">{ROLE_LABELS[user.role] ?? user.role}</option>
                  )}
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className={styles.cellActions}>
                {user.role === "ANALISTA" ? (
                  <button type="button" className={styles.groupBtn} onClick={() => onEditGroup(user)}>
                    Digitadores
                  </button>
                ) : (
                  "—"
                )}
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
