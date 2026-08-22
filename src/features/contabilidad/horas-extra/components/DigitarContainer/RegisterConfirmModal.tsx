"use client";

import { useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components";
import styles from "./RegisterConfirmModal.module.scss";

interface RegisterConfirmModalProps {
  open: boolean;
  entryCount: number;
  periodLabel: string;
  /** Consulta de duplicados / validación previa. */
  validating?: boolean;
  submitting?: boolean;
  /** Errores de validación (p. ej. duplicados) tras el check. */
  validationErrors?: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function RegisterConfirmModal({
  open,
  entryCount,
  periodLabel,
  validating = false,
  submitting = false,
  validationErrors = [],
  onClose,
  onConfirm,
}: RegisterConfirmModalProps) {
  const busy = validating || submitting;
  const hasValidationErrors = validationErrors.length > 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
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

          {validating ? (
            <p className={styles.validating} role="status" aria-live="polite">
              Validando duplicados…
            </p>
          ) : hasValidationErrors ? (
            <>
              <p className={styles.body}>
                Se encontraron problemas. Remueva o modifique las filas antes de
                registrar.
              </p>
              <ul className={styles.errorList}>
                {validationErrors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className={styles.body}>
                Se registrarán <strong>{entryCount}</strong> registro(s) de tiempo
                suplementario en el periodo <strong>{periodLabel}</strong>. Quedarán
                pendientes de aprobación por Contabilidad.
              </p>
              <p className={styles.note}>
                Revise que los datos sean correctos antes de continuar. Esta acción
                crea la planilla en el sistema.
              </p>
            </>
          )}
        </header>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={busy}
          >
            {hasValidationErrors ? "Cerrar" : "Cancelar"}
          </Button>
          {!hasValidationErrors && (
            <Button
              type="button"
              size="sm"
              onClick={onConfirm}
              disabled={busy || validating}
            >
              {submitting
                ? "Registrando…"
                : validating
                  ? "Validando…"
                  : "Confirmar y registrar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
