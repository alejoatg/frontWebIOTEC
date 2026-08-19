"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components";
import styles from "./RegisterValidationModal.module.scss";

interface RegisterValidationModalProps {
  open: boolean;
  errors: string[];
  onClose: () => void;
}

export default function RegisterValidationModal({
  open,
  errors,
  onClose,
}: RegisterValidationModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-validation-title"
      >
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <AlertCircle size={22} className={styles.icon} aria-hidden />
            <h2 id="register-validation-title" className={styles.title}>
              No se puede registrar la planilla
            </h2>
          </div>
          <p className={styles.subtitle}>
            Corrija los siguientes puntos e intente de nuevo.
          </p>
        </header>

        <ul className={styles.list}>
          {errors.map((msg, i) => (
            <li key={`${i}-${msg.slice(0, 40)}`}>{msg}</li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Button type="button" size="sm" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
