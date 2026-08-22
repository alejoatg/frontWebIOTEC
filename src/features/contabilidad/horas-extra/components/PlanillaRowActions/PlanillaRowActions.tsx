"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  canReviewOvertime,
  canVoidAnyOvertime,
} from "@/features/dashboard/constants/nav";
import { approveEntry, type OvertimeEntryRow } from "../../api/overtimeApi";
import VoidEntryModal from "../VoidEntryModal/VoidEntryModal";
import styles from "./PlanillaRowActions.module.scss";

interface PlanillaRowActionsProps {
  entry: OvertimeEntryRow;
  onReject: (entryId: string) => void;
  onCorrect: (entryId: string) => void;
  onActionComplete: () => void;
}

export default function PlanillaRowActions({
  entry,
  onReject,
  onCorrect,
  onActionComplete,
}: PlanillaRowActionsProps) {
  const { user } = useAuth();
  const canReview = canReviewOvertime(user?.role);
  const canVoid = canVoidAnyOvertime(user?.role);
  const isPending = entry.status === "PENDING";
  const canCorrect = canReview && (isPending || entry.status === "APPROVED");
  const [voidOpen, setVoidOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveNote, setApproveNote] = useState("");

  async function handleApprove() {
    if (!approveNote.trim()) return;
    try {
      await approveEntry(entry.id, approveNote.trim());
      setApproveOpen(false);
      setApproveNote("");
      onActionComplete();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al aprobar");
    }
  }

  return (
    <div className={styles.actions}>
      <Link
        href={`/dashboard/contabilidad/horas-extra/registros/${entry.id}`}
        className={styles.link}
      >
        Detalle
      </Link>
      {canReview && isPending && (
        <>
          <button type="button" className={styles.btnOk} onClick={() => setApproveOpen(true)}>
            Aprobar
          </button>
          <button type="button" className={styles.btnDanger} onClick={() => onReject(entry.id)}>
            Rechazar
          </button>
        </>
      )}
      {canCorrect && (
        <button type="button" className={styles.btnWarn} onClick={() => onCorrect(entry.id)}>
          Corregir
        </button>
      )}
      {canVoid && isPending && (
        <button type="button" className={styles.btnDanger} onClick={() => setVoidOpen(true)}>
          Anular
        </button>
      )}
      {approveOpen && (
        <div className={styles.approveBox}>
          <label htmlFor={`approve-note-${entry.id}`}>Justificación de la aprobación</label>
          <textarea
            id={`approve-note-${entry.id}`}
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            rows={2}
            placeholder="Obligatoria…"
          />
          <div className={styles.approveActions}>
            <button
              type="button"
              className={styles.btnOk}
              onClick={() => void handleApprove()}
              disabled={!approveNote.trim()}
            >
              Confirmar
            </button>
            <button
              type="button"
              className={styles.btnWarn}
              onClick={() => {
                setApproveOpen(false);
                setApproveNote("");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      <VoidEntryModal
        open={voidOpen}
        entryId={entry.id}
        entryCode={entry.entryCode}
        onClose={() => setVoidOpen(false)}
        onSuccess={onActionComplete}
      />
    </div>
  );
}
