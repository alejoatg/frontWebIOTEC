"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canReviewOvertime } from "@/features/dashboard/constants/nav";
import {
  approveEntry,
  dayPrintPageUrl,
  downloadAuthenticatedFile,
  pdfMonthUrl,
  rejectEntry,
} from "../../api/overtimeApi";
import styles from "../../styles/shared.module.scss";

export interface EntryActionsProps {
  entryId: string;
  employeeId: string;
  employeeDocumentNumber: string;
  entryCode: string;
  workDate: string;
  status: string;
  periodYear: number;
  periodMonth: number;
  onActionComplete?: () => void;
  showDetailLink?: boolean;
  layout?: "inline" | "stacked";
}

export default function EntryActions({
  entryId,
  employeeId,
  employeeDocumentNumber,
  entryCode,
  workDate,
  status,
  periodYear,
  periodMonth,
  onActionComplete,
  showDetailLink = false,
  layout = "inline",
}: EntryActionsProps) {
  const { user } = useAuth();
  const canReview = canReviewOvertime(user?.role);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  async function handleApprove() {
    try {
      await approveEntry(entryId);
      onActionComplete?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al aprobar");
    }
  }

  async function handleReject() {
    if (!rejectNote.trim()) return;
    try {
      await rejectEntry(entryId, rejectNote.trim());
      setRejectOpen(false);
      setRejectNote("");
      onActionComplete?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al rechazar");
    }
  }

  const actionClass = layout === "stacked" ? styles.actionsStacked : styles.actions;

  return (
    <>
      <div className={actionClass}>
        {showDetailLink && (
          <Link href={`/dashboard/contabilidad/horas-extra/registros/${entryId}`}>
            <Button type="button" variant="outline" size="sm">
              Ver detalle
            </Button>
          </Link>
        )}
        <Link
          href={dayPrintPageUrl(employeeId, workDate)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button type="button" variant="ghost" size="sm">
            Imprimir día
          </Button>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            downloadAuthenticatedFile(
              pdfMonthUrl(employeeId, periodYear, periodMonth),
              `TS-mes-${employeeDocumentNumber}.pdf`,
            )
          }
        >
          PDF mes
        </Button>
        {canReview && status === "PENDING" && (
          <>
            <Button type="button" size="sm" onClick={handleApprove}>
              Aprobar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRejectOpen(true)}>
              Rechazar
            </Button>
          </>
        )}
      </div>

      {rejectOpen && (
        <div className={styles.alert} style={{ marginTop: "1rem" }}>
          <p>Observación contabilidad (obligatoria):</p>
          <textarea
            value={rejectNote}
            onChange={(ev) => setRejectNote(ev.target.value)}
            rows={3}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <div className={styles.actions}>
            <Button type="button" size="sm" onClick={handleReject}>
              Confirmar rechazo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
