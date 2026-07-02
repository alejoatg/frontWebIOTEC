"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canReviewOvertime } from "@/features/dashboard/constants/nav";
import { approveEntry, type OvertimeEntryRow } from "../../api/overtimeApi";
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
  const isPending = entry.status === "PENDING";

  async function handleApprove() {
    try {
      await approveEntry(entry.id);
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
          <button type="button" className={styles.btnOk} onClick={handleApprove}>
            Aprobar
          </button>
          <button type="button" className={styles.btnWarn} onClick={() => onCorrect(entry.id)}>
            Corregir
          </button>
          <button type="button" className={styles.btnDanger} onClick={() => onReject(entry.id)}>
            Rechazar
          </button>
        </>
      )}
    </div>
  );
}
