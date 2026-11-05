"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { updateUserRole } from "../api";
import { useUsers } from "../hooks/useUsers";
import type { UserListItem, UserRole } from "../types";
import AnalystGroupModal from "./AnalystGroupModal/AnalystGroupModal";
import UsersTable, { ROLE_OPTIONS } from "./UsersTable";
import styles from "./UsersListContainer.module.scss";

export default function UsersListContainer() {
  const { users, loading, error, refetch } = useUsers();
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [groupUser, setGroupUser] = useState<UserListItem | null>(null);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Cargando usuarios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button type="button" className={styles.retryBtn} onClick={refetch}>
          Reintentar
        </button>
      </div>
    );
  }

  async function handleRoleChange(user: UserListItem, role: UserRole) {
    if (role === user.role) return;
    const label = ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;
    if (!window.confirm(`Cambiar el rol de ${user.name} a ${label}?`)) return;
    setSavingRoleId(user.id);
    setActionError(null);
    try {
      await updateUserRole(user.id, role);
      await refetch();
      if (role === "ANALISTA") setGroupUser({ ...user, role });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "No se pudo cambiar el rol");
    } finally {
      setSavingRoleId(null);
    }
  }

  const digitizers = users.filter(
    (user) =>
      user.isActive && (user.role === "SUPERVISOR" || user.role === "CORDINADOR"),
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.summary}>
          <span className={styles.count}>{users.length}</span>
          <span className={styles.countLabel}>
            {users.length === 1 ? "usuario" : "usuarios"}
          </span>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={refetch}
          aria-label="Actualizar lista"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      {actionError && <p className={styles.actionError}>{actionError}</p>}
      <UsersTable
        users={users}
        savingRoleId={savingRoleId}
        onRoleChange={handleRoleChange}
        onEditGroup={setGroupUser}
      />
      {groupUser && (
        <AnalystGroupModal
          analyst={groupUser}
          digitizers={digitizers}
          onClose={() => setGroupUser(null)}
        />
      )}
    </div>
  );
}
