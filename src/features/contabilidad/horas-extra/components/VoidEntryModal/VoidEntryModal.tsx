"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components";
import { voidEntry } from "../../api/overtimeApi";
import styles from "./VoidEntryModal.module.scss";

interface VoidEntryModalProps {
  open: boolean;
  entryId: string | null;
  entryCode?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VoidEntryModal({
  open,
  entryId,
  entryCode,
  onClose,
  onSuccess,
}: VoidEntryModalProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
    if (!entryId) return;
    setSubmitting(true);
    setError(null);
    try {
      await voidEntry(entryId, note.trim() || undefined);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo anular el registro");
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
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="void-entry-title"
      >
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <AlertTriangle size={22} className={styles.icon} aria-hidden />
            <h2 id="void-entry-title" className={styles.title}>
              Anular registro
              {entryCode ? ` ${entryCode}` : ""}
            </h2>
          </div>
          <p className={styles.warning}>
            Esta acción no se puede deshacer. El registro de tiempo suplementario
            quedará anulado y no será reconocido.
          </p>
        </header>

        <div className={styles.body}>
          <label className={styles.label} htmlFor="void-entry-note">
            Motivo (opcional)
          </label>
          <textarea
            id="void-entry-note"
            className={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={submitting}
            placeholder="Ej.: digitación incorrecta, duplicado…"
          />
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Anulando…" : "Confirmar anulación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
