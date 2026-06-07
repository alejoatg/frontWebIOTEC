"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMaintenanceStatus } from "@/lib/maintenance";
import styles from "./MaintenanceGate.module.scss";

interface Props {
  children: React.ReactNode;
}

export function MaintenanceGate({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");

  const check = useCallback(async (isRetry = false) => {
    if (isRetry) setChecking(true);
    else setLoading(true);

    const status = await fetchMaintenanceStatus();
    if (status?.web) {
      setActive(true);
      setMessage(status.message);
    } else {
      setActive(false);
    }

    setLoading(false);
    setChecking(false);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <p className={styles.muted}>Cargando…</p>
      </div>
    );
  }

  if (active) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon} aria-hidden>
            ⚙️
          </div>
          <h1 className={styles.title}>Mantenimiento</h1>
          <p className={styles.message}>{message}</p>
          <p className={styles.hint}>
            Si necesitas acceso urgente, contacta al administrador del sistema.
          </p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => check(true)}
            disabled={checking}
          >
            {checking ? "Revisando…" : "Revisar de nuevo"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
