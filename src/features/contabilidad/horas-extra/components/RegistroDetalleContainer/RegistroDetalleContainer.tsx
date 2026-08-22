"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { fetchEntry, type OvertimeEntryRow } from "../../api/overtimeApi";
import { dateOnlyMonth, dateOnlyYear, formatDateOnly } from "../../lib/dateFormat";
import { DETAIL_SECTIONS_NO_MONEY } from "../../lib/entrySpreadsheet";
import {
  overtimeSeverityLabel,
  overtimeStatusLabel,
} from "../../lib/overtimeStatus";
import EntryActions from "../EntryActions/EntryActions";
import styles from "./RegistroDetalleContainer.module.scss";
import shared from "../../styles/shared.module.scss";

function statusClass(status: string) {
  switch (status) {
    case "PENDING":
      return shared.badgePending;
    case "APPROVED":
      return shared.badgeApproved;
    case "REJECTED":
      return shared.badgeRejected;
    case "VOIDED":
      return shared.badgeVoided;
    default:
      return shared.badgeSuperseded;
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatDateOnly(iso) || "—";
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type HistoryItem = {
  at: string;
  sortKey: number;
  title: string;
  detail?: string;
};

function buildOperationHistory(entry: OvertimeEntryRow): HistoryItem[] {
  const items: HistoryItem[] = [];

  const push = (iso: string | null | undefined, title: string, detail?: string) => {
    if (!iso) return;
    const t = new Date(iso).getTime();
    items.push({
      at: formatDateTime(iso),
      sortKey: Number.isFinite(t) ? t : 0,
      title,
      detail,
    });
  };

  push(
    entry.createdAt,
    "Registro creado",
    entry.submittedBy?.name ? `Digitó: ${entry.submittedBy.name}` : undefined,
  );

  if (entry.importBatch?.registeredAt || entry.importBatch?.batchCode) {
    push(
      entry.importBatch.registeredAt ?? entry.createdAt,
      "Incluido en planilla",
      entry.importBatch.batchCode
        ? `Planilla ${entry.importBatch.batchCode}${
            entry.importBatch.originalFilename
              ? ` · ${entry.importBatch.originalFilename}`
              : ""
          }`
        : undefined,
    );
  }

  if (entry.correctedFromEntry) {
    push(
      entry.createdAt,
      "Corrección de registro previo",
      `${entry.correctedFromEntry.entryCode} (${overtimeStatusLabel(entry.correctedFromEntry.status)})`,
    );
  }

  if (entry.reviewedAt) {
    const actor = entry.reviewedBy?.name ? ` por ${entry.reviewedBy.name}` : "";
    if (entry.status === "APPROVED") {
      push(entry.reviewedAt, `Aprobado${actor}`, entry.accountingNote || undefined);
    } else if (entry.status === "REJECTED") {
      push(entry.reviewedAt, `Rechazado${actor}`, entry.accountingNote || undefined);
    } else if (entry.status === "VOIDED") {
      push(entry.reviewedAt, `Anulado${actor}`, entry.accountingNote || undefined);
    } else {
      push(entry.reviewedAt, `Revisado${actor}`, entry.accountingNote || undefined);
    }
  }

  if (entry.supersededByEntry) {
    push(
      entry.reviewedAt ?? entry.createdAt,
      "Corregido — reemplazado por nuevo registro",
      `${entry.supersededByEntry.entryCode} (${overtimeStatusLabel(entry.supersededByEntry.status)})`,
    );
  }

  items.sort((a, b) => a.sortKey - b.sortKey);
  return items;
}

interface RegistroDetalleContainerProps {
  entryId: string;
}

export default function RegistroDetalleContainer({ entryId }: RegistroDetalleContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [entry, setEntry] = useState<OvertimeEntryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sections = DETAIL_SECTIONS_NO_MONEY;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntry(entryId);
      setEntry(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  const history = useMemo(
    () => (entry ? buildOperationHistory(entry) : []),
    [entry],
  );

  if (loading) return <div className={shared.loading}>Cargando registro…</div>;
  if (error) return <div className={shared.error}>{error}</div>;
  if (!entry) return null;

  const periodYear = entry.period?.year ?? dateOnlyYear(entry.workDate);
  const periodMonth = entry.period?.month ?? dateOnlyMonth(entry.workDate);
  const messages = Array.isArray(entry.validationMessages)
    ? (entry.validationMessages as Array<{ code?: string; message?: string; severity?: string }>)
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/dashboard/contabilidad/horas-extra/registros" className={styles.backLink}>
            ← Registros
          </Link>
          <h2 className={styles.title}>{entry.entryCode}</h2>
          <p className={styles.subtitle}>
            {entry.employeeFullName} · {entry.employeeDocumentNumber}
          </p>
          {entry.status === "VOIDED" && (
            <p className={styles.supersededNote}>
              Este registro fue anulado y no es reconocido como tiempo suplementario.
            </p>
          )}
          {entry.status === "SUPERSEDED" && (
            <p className={styles.supersededNote}>
              Este registro fue corregido. Consulte la cadena de corrección abajo.
            </p>
          )}
        </div>
        <span className={`${shared.badge} ${statusClass(entry.status)}`}>
          {overtimeStatusLabel(entry.status)}
        </span>
      </div>

      <div className={styles.actionsCard}>
        <h3 className={styles.sectionTitle}>Acciones</h3>
        <EntryActions
          entryId={entry.id}
          employeeId={entry.employeeId}
          employeeDocumentNumber={entry.employeeDocumentNumber}
          entryCode={entry.entryCode}
          workDate={entry.workDate}
          status={entry.status}
          periodYear={periodYear}
          periodMonth={periodMonth}
          onActionComplete={load}
          allowVoid={entry.submittedBy?.id === user?.id}
          layout="stacked"
          redirectOnCorrect
        />
      </div>

      {messages.length > 0 && (
        <div className={styles.messagesCard}>
          <h3 className={styles.sectionTitle}>Mensajes de validación</h3>
          <ul className={styles.messageList}>
            {messages.map((m, i) => (
              <li key={`${m.code ?? "msg"}-${i}`}>
                <strong>{overtimeSeverityLabel(m.severity)}:</strong> {m.message ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.grid}>
        {sections.map((section) => (
          <section key={section.title} className={styles.card}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <dl className={styles.fieldList}>
              {section.fields.map((field) => (
                <div key={field.label} className={styles.field}>
                  <dt>{field.label}</dt>
                  <dd>{field.getValue(entry) ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Historial de operaciones</h3>
        {history.length === 0 ? (
          <p className={styles.historyEmpty}>Sin eventos registrados.</p>
        ) : (
          <ol className={styles.historyList}>
            {history.map((item, i) => (
              <li key={`${item.sortKey}-${i}`} className={styles.historyItem}>
                <time className={styles.historyTime}>{item.at}</time>
                <div>
                  <div className={styles.historyTitle}>{item.title}</div>
                  {item.detail && <div className={styles.historyDetail}>{item.detail}</div>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {(entry.correctedFromEntry || entry.supersededByEntry) && (
        <section className={styles.card}>
          <h3 className={styles.sectionTitle}>Cadena de corrección</h3>
          <dl className={styles.fieldList}>
            {entry.correctedFromEntry && (
              <div className={styles.field}>
                <dt>Corregido desde</dt>
                <dd>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() =>
                      router.push(
                        `/dashboard/contabilidad/horas-extra/registros/${entry.correctedFromEntry!.id}`,
                      )
                    }
                  >
                    {entry.correctedFromEntry.entryCode} (
                    {overtimeStatusLabel(entry.correctedFromEntry.status)})
                  </button>
                </dd>
              </div>
            )}
            {entry.supersededByEntry && (
              <div className={styles.field}>
                <dt>Corregido por</dt>
                <dd>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() =>
                      router.push(
                        `/dashboard/contabilidad/horas-extra/registros/${entry.supersededByEntry!.id}`,
                      )
                    }
                  >
                    {entry.supersededByEntry.entryCode} (
                    {overtimeStatusLabel(entry.supersededByEntry.status)})
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <div className={styles.footer}>
        <Link href="/dashboard/contabilidad/horas-extra/registros/planilla">
          <Button type="button" variant="outline" size="sm">
            Vista planilla
          </Button>
        </Link>
        <Button type="button" variant="ghost" size="sm" onClick={load}>
          Actualizar
        </Button>
      </div>
    </div>
  );
}
