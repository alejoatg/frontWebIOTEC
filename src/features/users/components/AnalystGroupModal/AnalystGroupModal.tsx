"use client";

import { useEffect, useState } from "react";
import { fetchAnalystDigitizerIds, saveAnalystDigitizers } from "../../api";
import type { UserListItem } from "../../types";
import styles from "./AnalystGroupModal.module.scss";

export interface AnalystGroupModalProps {
  analyst: UserListItem;
  digitizers: UserListItem[];
  onClose: () => void;
}

export default function AnalystGroupModal({
  analyst,
  digitizers,
  onClose,
}: AnalystGroupModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchAnalystDigitizerIds(analyst.id)
      .then((ids) => {
        if (active) setSelected(ids);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "No se pudo cargar el grupo");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [analyst.id]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await saveAnalystDigitizers(analyst.id, selected);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="analyst-group-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="analyst-group-title" className={styles.title}>
          Digitadores de {analyst.name}
        </h3>
        <p className={styles.hint}>
          Este analista verá, descargará y podrá anular los registros pendientes
          de los supervisores y coordinadores marcados.
        </p>
        {loading && <p className={styles.hint}>Cargando…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && digitizers.length === 0 && (
          <p className={styles.hint}>No hay supervisores ni coordinadores activos.</p>
        )}
        {!loading && digitizers.length > 0 && (
          <ul className={styles.list}>
            {digitizers.map((user) => (
              <li key={user.id}>
                <label className={styles.option}>
                  <input
                    type="checkbox"
                    checked={selected.includes(user.id)}
                    onChange={() => toggle(user.id)}
                  />
                  <span>
                    <strong>{user.name}</strong>
                    <span className={styles.meta}>
                      {user.role === "CORDINADOR" ? "Coordinador" : "Supervisor"} · {user.email}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={styles.primary} onClick={save} disabled={saving || loading}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
