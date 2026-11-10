"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import {
  correctEntry,
  fetchEntry,
  type CorrectEntryPayload,
  type OvertimeEntryRow,
} from "../../api/overtimeApi";
import {
  calcStartEndHours,
  computeAmounts,
  HOURS_COHERENCE_TOLERANCE,
  sumCategoryHours,
  validatorComparableHours,
} from "../../lib/overtimeCalculator";
import { isSundayOrHoliday } from "../../lib/colombiaHolidays";
import { toDateInputValue } from "../../lib/dateFormat";
import styles from "./CorrectEntryModal.module.scss";

interface CorrectEntryModalProps {
  entryId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (newEntry: OvertimeEntryRow) => void;
}

interface FormState {
  documentNumber: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hoursRd: string;
  hoursRn: string;
  hoursTsd: string;
  hoursTsn: string;
  hoursHedd: string;
  hoursHend: string;
  hoursDisponibilidad: string;
  jobPositionName: string;
  processName: string;
  zoneName: string;
  baseMunicipality: string;
  commissionMunicipality: string;
  brigadeCode: string;
  systemName: string;
  itinerary: string;
  caseRef: string;
  workRef: string;
  ticketRef: string;
  consigna: string;
  attachmentRef: string;
  operationalNote: string;
  accountingNote: string;
}

const REFERENCE_FIELDS: Array<[keyof FormState, string]> = [
  ["itinerary", "Itinerario"],
  ["caseRef", "Caso"],
  ["consigna", "Consigna"],
  ["workRef", "Orden de trabajo"],
  ["ticketRef", "Ticket"],
  ["attachmentRef", "Archivo"],
  ["systemName", "Sistema"],
];

const TEXT_FIELDS: Array<[keyof FormState, string]> = [
  ["documentNumber", "Cédula"],
  ["jobPositionName", "Cargo"],
  ["processName", "Proceso"],
  ["zoneName", "Zona"],
  ["baseMunicipality", "Municipio sede"],
  ["commissionMunicipality", "Municipio donde causó"],
  ["brigadeCode", "Brigada"],
];

function toForm(entry: OvertimeEntryRow): FormState {
  return {
    documentNumber: entry.employeeDocumentNumber ?? "",
    workDate: toDateInputValue(entry.workDate),
    startTime: entry.startTime ?? "",
    endTime: entry.endTime ?? "",
    hoursRd: String(entry.hoursRd ?? 0),
    hoursRn: String(entry.hoursRn ?? 0),
    hoursTsd: String(entry.hoursTsd ?? 0),
    hoursTsn: String(entry.hoursTsn ?? 0),
    hoursHedd: String(entry.hoursHedd ?? 0),
    hoursHend: String(entry.hoursHend ?? 0),
    hoursDisponibilidad: String(entry.hoursDisponibilidad ?? 0),
    jobPositionName: entry.jobPositionName ?? "",
    processName: entry.processName ?? "",
    zoneName: entry.zoneName ?? "",
    baseMunicipality: entry.baseMunicipality ?? "",
    commissionMunicipality: entry.commissionMunicipality ?? "",
    brigadeCode: entry.brigadeCode ?? "",
    systemName: entry.systemName ?? "",
    itinerary: entry.itinerary ?? "",
    caseRef: entry.caseRef ?? "",
    workRef: entry.workRef ?? "",
    ticketRef: entry.ticketRef ?? "",
    consigna: entry.consigna ?? "",
    attachmentRef: entry.attachmentRef ?? "",
    operationalNote: entry.operationalNote ?? "",
    accountingNote: "",
  };
}

function normalizeTime(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  return digits.padStart(4, "0").slice(-4);
}

function parseNum(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function buildPayload(form: FormState): CorrectEntryPayload {
  return {
    documentNumber: form.documentNumber.replace(/\D/g, "") || undefined,
    workDate: form.workDate || undefined,
    startTime: normalizeTime(form.startTime),
    endTime: normalizeTime(form.endTime),
    hoursRd: parseNum(form.hoursRd),
    hoursRn: parseNum(form.hoursRn),
    hoursTsd: parseNum(form.hoursTsd),
    hoursTsn: parseNum(form.hoursTsn),
    hoursHedd: parseNum(form.hoursHedd),
    hoursHend: parseNum(form.hoursHend),
    hoursDisponibilidad: parseNum(form.hoursDisponibilidad),
    jobPositionName: form.jobPositionName.trim(),
    processName: form.processName.trim(),
    zoneName: form.zoneName.trim(),
    baseMunicipality: form.baseMunicipality.trim(),
    commissionMunicipality: form.commissionMunicipality.trim(),
    brigadeCode: form.brigadeCode.trim(),
    systemName: form.systemName.trim(),
    itinerary: form.itinerary.trim(),
    caseRef: form.caseRef.trim(),
    workRef: form.workRef.trim(),
    ticketRef: form.ticketRef.trim(),
    consigna: form.consigna.trim(),
    attachmentRef: form.attachmentRef.trim(),
    operationalNote: form.operationalNote.trim(),
    accountingNote: form.accountingNote.trim(),
  };
}

export default function CorrectEntryModal({
  entryId,
  open,
  onClose,
  onSuccess,
}: CorrectEntryModalProps) {
  const [entry, setEntry] = useState<OvertimeEntryRow | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
    fetchEntry(entryId)
      .then((data) => {
        setEntry(data);
        setForm(toForm(data));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudo cargar el registro");
      })
      .finally(() => setLoading(false));
  }, [open, entryId]);

  const preview = useMemo(() => {
    if (!entry || !form) return null;
    const hours = {
      RD: parseNum(form.hoursRd) ?? Number(entry.hoursRd ?? 0),
      RN: parseNum(form.hoursRn) ?? Number(entry.hoursRn ?? 0),
      TSD: parseNum(form.hoursTsd) ?? Number(entry.hoursTsd ?? 0),
      TSN: parseNum(form.hoursTsn) ?? Number(entry.hoursTsn ?? 0),
      HEDD: parseNum(form.hoursHedd) ?? Number(entry.hoursHedd ?? 0),
      HEND: parseNum(form.hoursHend) ?? Number(entry.hoursHend ?? 0),
      DISPONIBILIDAD: parseNum(form.hoursDisponibilidad) ?? Number(entry.hoursDisponibilidad ?? 0),
    };
    const start = normalizeTime(form.startTime) ?? entry.startTime ?? "";
    const end = normalizeTime(form.endTime) ?? entry.endTime ?? "";
    const startEnd = start && end ? calcStartEndHours(start, end) : null;
    const categoriesTotal = sumCategoryHours(hours);
    const comparable = validatorComparableHours(
      hours,
      isSundayOrHoliday(form.workDate || toDateInputValue(entry.workDate)),
    );
    const amounts = computeAmounts(
      hours,
      Number(entry.salarySnapshot ?? 0),
      Number(entry.payrollFactorSnapshot ?? 1),
      entry.hourlyDivisorSnapshot ?? 220,
    );
    const coherenceWarning =
      startEnd != null && Math.abs(startEnd - comparable) > HOURS_COHERENCE_TOLERANCE
        ? `Horario (${startEnd} h) no coincide con horas por categoría (${categoriesTotal} h).`
        : null;

    return { ...amounts, categoriesTotal, startEnd, coherenceWarning };
  }, [entry, form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit() {
    if (!form || !entry) return;
    if (!form.accountingNote.trim()) {
      setError("Indique la justificación de la corrección.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await correctEntry(entryId, buildPayload(form));
      onSuccess(result);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al corregir");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="correct-title">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="correct-title" className={styles.title}>
            Corregir registro
          </h2>
          {entry && (
            <p className={styles.subtitle}>
              {entry.entryCode} — {entry.employeeFullName}. Se creará un nuevo registro{" "}
              <strong>aprobado</strong> y el actual quedará como <strong>corregido</strong>.
              {entry.status === "APPROVED" && (
                <>
                  {" "}
                  Este registro ya estaba aprobado: la justificación es obligatoria.
                </>
              )}
            </p>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.body}>
          {loading && <p>Cargando datos…</p>}
          {!loading && form && (
            <>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Fecha y horario</h3>
                <div className={styles.grid3}>
                  <div className={styles.field}>
                    <label htmlFor="corr-workDate">Fecha labor</label>
                    <input
                      id="corr-workDate"
                      type="date"
                      value={form.workDate}
                      onChange={(e) => update("workDate", e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="corr-startTime">Hora inicio (militar)</label>
                    <input
                      id="corr-startTime"
                      value={form.startTime}
                      placeholder="0630"
                      onChange={(e) => update("startTime", e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="corr-endTime">Hora fin (militar)</label>
                    <input
                      id="corr-endTime"
                      value={form.endTime}
                      placeholder="1430"
                      onChange={(e) => update("endTime", e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Horas por categoría</h3>
                <div className={styles.grid4}>
                  {(
                    [
                      ["hoursRd", "RD"],
                      ["hoursRn", "RN"],
                      ["hoursTsd", "TSD"],
                      ["hoursTsn", "TSN"],
                      ["hoursHedd", "HEDD"],
                      ["hoursHend", "HEND"],
                      ["hoursDisponibilidad", "Disponibilidad"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className={styles.field}>
                      <label htmlFor={`corr-${key}`}>{label}</label>
                      <input
                        id={`corr-${key}`}
                        inputMode="decimal"
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                {preview?.coherenceWarning && (
                  <div className={styles.warning}>{preview.coherenceWarning}</div>
                )}
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Itinerario, orden y referencias</h3>
                <div className={styles.grid2}>
                  {REFERENCE_FIELDS.map(([key, label]) => (
                    <div key={key} className={styles.field}>
                      <label htmlFor={`corr-${key}`}>{label}</label>
                      <input
                        id={`corr-${key}`}
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Datos del registro</h3>
                <div className={styles.grid2}>
                  {TEXT_FIELDS.map(([key, label]) => (
                    <div key={key} className={styles.field}>
                      <label htmlFor={`corr-${key}`}>{label}</label>
                      <input
                        id={`corr-${key}`}
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className={styles.field} style={{ marginTop: "0.65rem" }}>
                  <label htmlFor="corr-operational">Observación operativa</label>
                  <textarea
                    id="corr-operational"
                    rows={2}
                    value={form.operationalNote}
                    onChange={(e) => update("operationalNote", e.target.value)}
                  />
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Contabilidad</h3>
                <div className={styles.field}>
                  <label htmlFor="corr-accounting">Justificación de la corrección *</label>
                  <textarea
                    id="corr-accounting"
                    rows={3}
                    value={form.accountingNote}
                    onChange={(e) => update("accountingNote", e.target.value)}
                    placeholder="Obligatoria. Ej.: ajuste de horas TSD por error de digitación…"
                  />
                </div>
              </section>

              {preview && (
                <div className={styles.preview}>
                  <span>
                    Subtotal:{" "}
                    <strong>{preview.subtotal.toLocaleString("es-CO")}</strong>
                  </span>
                  <span>
                    Total:{" "}
                    <strong>{preview.total.toLocaleString("es-CO")}</strong>
                  </span>
                  {entry?.amountTotal != null && (
                    <span>
                      Anterior:{" "}
                      <strong>{Number(entry.amountTotal).toLocaleString("es-CO")}</strong>
                    </span>
                  )}
                </div>
              )}

              <p className={styles.hint}>
                Puede modificar cualquier dato del registro. Si cambia la cédula, el trabajador
                debe existir y estar activo. Los montos se recalculan con el salario del registro,
                o con el del nuevo trabajador si cambia la cédula. Un campo vacío se borra.
              </p>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting || loading || !form}
            onClick={handleSubmit}
          >
            {submitting ? "Guardando…" : "Confirmar corrección"}
          </Button>
        </div>
      </div>
    </div>
  );
}
