"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Motorcycle } from "../../types";
import styles from "./MotorcycleDetailModal.module.scss";

export interface MotorcycleDetailModalProps {
  open: boolean;
  motorcycle: Motorcycle | null;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MotorcycleDetailModal({
  open,
  motorcycle,
  onClose,
}: MotorcycleDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  if (!open || !motorcycle) return null;

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>Detalle de Motocicleta</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.placaHeader}>
          <span className={styles.placaBadge}>{motorcycle.placa}</span>
          <span
            className={`${styles.statusBadge} ${motorcycle.isActive ? styles.active : styles.inactive}`}
          >
            {motorcycle.isActive ? "Activa" : "Inactiva"}
          </span>
        </div>

        <dl className={styles.grid}>
          <div className={styles.field}>
            <dt>Marca</dt>
            <dd>{motorcycle.marca}</dd>
          </div>
          <div className={styles.field}>
            <dt>Modelo</dt>
            <dd>{motorcycle.modelo}</dd>
          </div>
          <div className={styles.field}>
            <dt>Tipo</dt>
            <dd>{motorcycle.tipo}</dd>
          </div>
          <div className={styles.field}>
            <dt>Cilindraje</dt>
            <dd>{motorcycle.cilindraje}</dd>
          </div>
          {motorcycle.user && (
            <div className={styles.fieldFull}>
              <dt>Usuario asociado</dt>
              <dd className={styles.userInfo}>
                {motorcycle.user.picture && (
                  <img
                    src={motorcycle.user.picture}
                    alt=""
                    className={styles.userAvatar}
                  />
                )}
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{motorcycle.user.name}</span>
                  <span className={styles.userEmail}>{motorcycle.user.email}</span>
                </div>
              </dd>
            </div>
          )}
          <div className={styles.field}>
            <dt>Propietario</dt>
            <dd>{motorcycle.propietario}</dd>
          </div>
          <div className={styles.field}>
            <dt>Cédula</dt>
            <dd>{motorcycle.cedula}</dd>
          </div>
          <div className={styles.field}>
            <dt>Teléfono</dt>
            <dd>{motorcycle.telefono}</dd>
          </div>
          <div className={styles.field}>
            <dt>Creada</dt>
            <dd>{formatDate(motorcycle.createdAt)}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button type="button" className={styles.closeAction} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}
