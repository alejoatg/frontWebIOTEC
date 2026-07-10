"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { FormReportConfig } from "../../config/formReportTypes";
import FormDetailReport from "../shared/FormDetailReport";
import styles from "./InspectionDetailModal.module.scss";

export interface InspectionDetailModalProps {
  open: boolean;
  config: FormReportConfig | null;
  record: Record<string, unknown> | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

export default function InspectionDetailModal({
  open,
  config,
  record,
  loading,
  error,
  onClose,
}: InspectionDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
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

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {config?.title ?? "Detalle de inspección"}
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <p className={styles.status}>Cargando detalle...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : config && record ? (
            <FormDetailReport config={config} record={record} />
          ) : (
            <p className={styles.status}>Sin datos</p>
          )}
        </div>
      </div>
    </dialog>
  );
}
