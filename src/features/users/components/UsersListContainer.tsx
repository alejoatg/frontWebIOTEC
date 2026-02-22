"use client";

import { RefreshCw } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import UsersTable from "./UsersTable";
import styles from "./UsersListContainer.module.scss";

export default function UsersListContainer() {
  const { users, loading, error, refetch } = useUsers();

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
      <UsersTable users={users} />
    </div>
  );
}
