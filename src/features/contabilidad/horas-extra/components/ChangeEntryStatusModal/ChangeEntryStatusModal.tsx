"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components";
import { changeEntryStatus } from "../../api/overtimeApi";
import styles from "../VoidEntryModal/VoidEntryModal.module.scss";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "REJECTED", label: "Rechazado" },
  { value: "VOIDED", label: "Anulado" },
  { value: "SUPERSEDED", label: "Reemplazado" },
] as const;

interface ChangeEntryStatusModalProps {
  open: boolean;
  entryId: string | null;
  entryCode?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangeEntryStatusModal({
  open,
  entryId,
  entryCode,
  onClose,
  onSuccess,
}: ChangeEntryStatusModalProps) {
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("PENDING");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus("PENDING");
    setNote("");
    setError(null);
    setSubmitting(false);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  if (!open || !entryId) return null;

  async function handleConfirm() {
    if (!entryId || !note.trim()) {
      setError("La observación del cambio es obligatoria");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await changeEntryStatus(entryId, status, note.trim());
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el estado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="change-status-title">
        <header className={styles.header}>
          <h2 id="change-status-title" className={styles.title}>
            Cambiar estado{entryCode ? ` ${entryCode}` : ""}
          </h2>
          <p className={styles.warning}>
            El registro está aprobado. El nuevo estado queda guardado con la observación.
          </p>
        </header>
        <div className={styles.body}>
          <label className={styles.label} htmlFor="change-status-target">
            Nuevo estado
          </label>
          <select
            id="change-status-target"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as (typeof STATUS_OPTIONS)[number]["value"])
            }
            disabled={submitting}
            style={{
              width: "100%",
              marginBottom: "0.85rem",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "0.45rem 0.65rem",
              fontSize: "0.875rem",
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className={styles.label} htmlFor="change-status-note">
            Observación del cambio *
          </label>
          <textarea
            id="change-status-note"
            className={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={submitting}
            placeholder="Motivo del cambio de estado"
          />
          {error && <p className={styles.error}>{error}</p>}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={submitting || !note.trim()}>
            {submitting ? "Guardando…" : "Confirmar cambio"}
          </Button>
        </div>
      </div>
    </div>
  );
}
