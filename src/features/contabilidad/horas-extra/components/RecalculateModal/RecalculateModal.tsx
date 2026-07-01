"use client";

import { Button } from "@/components";
import styles from "./RecalculateModal.module.scss";

export interface RecalculateModalProps {
  open: boolean;
  affectedCount: number;
  employeeLabel?: string;
  periodCodes?: string[];
  loading?: boolean;
  onConfirm: (recalculate: boolean) => void;
  onCancel: () => void;
}

export default function RecalculateModal({
  open,
  affectedCount,
  employeeLabel,
  periodCodes,
  loading,
  onConfirm,
  onCancel,
}: RecalculateModalProps) {
  if (!open) return null;

  const hasEntries = affectedCount > 0;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="recalc-title">
      <div className={styles.dialog}>
        <h2 id="recalc-title" className={styles.title}>
          {hasEntries ? "¿Actualizar registros del mes en curso?" : "Guardar cambios"}
        </h2>
        <div className={styles.body}>
          {hasEntries ? (
            <>
              {employeeLabel ? (
                <p>
                  Se actualizó el perfil contable de <strong>{employeeLabel}</strong>.
                </p>
              ) : (
                <p>Se actualizaron perfiles contables.</p>
              )}
              <p>
                Hay <strong>{affectedCount}</strong> registro(s) vigente(s) (PENDING o APPROVED) en
                periodo(s) abierto(s) que pueden recalcularse con el nuevo salario/factor.
              </p>
              {periodCodes && periodCodes.length > 0 && (
                <p className={styles.detail}>Periodos: {periodCodes.join(", ")}</p>
              )}
              <p>¿Desea recalcular los montos de esos registros ahora?</p>
            </>
          ) : (
            <p>
              No hay registros vigentes en periodos abiertos para recalcular. Los cambios aplicarán
              solo a cargas nuevas.
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
            Cancelar
          </Button>
          {hasEntries ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => onConfirm(false)}
              >
                No, solo cargas nuevas
              </Button>
              <Button type="button" size="sm" disabled={loading} onClick={() => onConfirm(true)}>
                Sí, recalcular
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" disabled={loading} onClick={() => onConfirm(false)}>
              Guardar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
