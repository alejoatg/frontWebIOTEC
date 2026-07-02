"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components";
import { fetchEntry, type OvertimeEntryRow } from "../../api/overtimeApi";
import { DETAIL_SECTIONS } from "../../lib/entrySpreadsheet";
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
    default:
      return shared.badgeSuperseded;
  }
}

interface RegistroDetalleContainerProps {
  entryId: string;
}

export default function RegistroDetalleContainer({ entryId }: RegistroDetalleContainerProps) {
  const router = useRouter();
  const [entry, setEntry] = useState<OvertimeEntryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div className={shared.loading}>Cargando registro…</div>;
  if (error) return <div className={shared.error}>{error}</div>;
  if (!entry) return null;

  const periodYear = entry.period?.year ?? new Date(entry.workDate).getFullYear();
  const periodMonth = entry.period?.month ?? new Date(entry.workDate).getMonth() + 1;
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
        </div>
        <span className={`${shared.badge} ${statusClass(entry.status)}`}>{entry.status}</span>
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
          layout="stacked"
        />
      </div>

      {messages.length > 0 && (
        <div className={styles.messagesCard}>
          <h3 className={styles.sectionTitle}>Mensajes de validación</h3>
          <ul className={styles.messageList}>
            {messages.map((m, i) => (
              <li key={`${m.code ?? "msg"}-${i}`}>
                <strong>{m.severity ?? "INFO"}:</strong> {m.message ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.grid}>
        {DETAIL_SECTIONS.map((section) => (
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
                    {entry.correctedFromEntry.entryCode} ({entry.correctedFromEntry.status})
                  </button>
                </dd>
              </div>
            )}
            {entry.supersededByEntry && (
              <div className={styles.field}>
                <dt>Reemplazado por</dt>
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
                    {entry.supersededByEntry.entryCode} ({entry.supersededByEntry.status})
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
