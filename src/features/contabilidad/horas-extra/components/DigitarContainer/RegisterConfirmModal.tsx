"use client";

import { useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components";
import styles from "./RegisterConfirmModal.module.scss";

interface RegisterConfirmModalProps {
  open: boolean;
  entryCount: number;
  periodLabel: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RegisterConfirmModal({
  open,
  entryCount,
  periodLabel,
  submitting = false,
  onClose,
  onConfirm,
}: RegisterConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

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
        aria-labelledby="register-confirm-title"
      >
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <ClipboardCheck size={22} className={styles.icon} aria-hidden />
            <h2 id="register-confirm-title" className={styles.title}>
              Confirmar registro
            </h2>
          </div>
          <p className={styles.body}>
            Se registrarán <strong>{entryCount}</strong> registro(s) de tiempo
            suplementario en el periodo <strong>{periodLabel}</strong>. Quedarán
            pendientes de aprobación por Contabilidad.
          </p>
          <p className={styles.note}>
            Revise que los datos sean correctos antes de continuar. Esta acción
            crea la planilla en el sistema.
          </p>
        </header>

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
          <Button type="button" size="sm" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Registrando…" : "Confirmar y registrar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
