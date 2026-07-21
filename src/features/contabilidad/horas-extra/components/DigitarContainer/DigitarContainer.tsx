"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components";
import {
  lookupManualEmployee,
  registerManualEntries,
  type ManualEntryPayload,
} from "../../api/overtimeApi";
import {
  calcStartEndHours,
  computeAmounts,
  HOURS_COHERENCE_TOLERANCE,
  sumCategoryHours,
} from "../../lib/overtimeCalculator";
import { formatClockTime } from "../../lib/timeFormat";
import BatchRegisterSuccessModal from "../BatchRegisterSuccessModal/BatchRegisterSuccessModal";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import shared from "../../styles/shared.module.scss";
import styles from "./DigitarContainer.module.scss";

type DigitarRow = {
  localId: string;
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
  // auto
  fullName: string;
  processName: string;
  zoneName: string;
  jobTitle: string;
  monthlySalary: number | null;
  payrollFactor: number | null;
  lookupError: string | null;
  lookingUp: boolean;
};

function newLocalId() {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyRow(partial?: Partial<DigitarRow>): DigitarRow {
  return {
    localId: newLocalId(),
    documentNumber: "",
    workDate: "",
    startTime: "",
    endTime: "",
    hoursRd: "0",
    hoursRn: "0",
    hoursTsd: "0",
    hoursTsn: "0",
    hoursHedd: "0",
    hoursHend: "0",
    hoursDisponibilidad: "0",
    baseMunicipality: "",
    commissionMunicipality: "",
    brigadeCode: "",
    systemName: "",
    itinerary: "",
    caseRef: "",
    workRef: "",
    ticketRef: "",
    consigna: "",
    attachmentRef: "",
    operationalNote: "",
    fullName: "",
    processName: "",
    zoneName: "",
    jobTitle: "",
    monthlySalary: null,
    payrollFactor: null,
    lookupError: null,
    lookingUp: false,
    ...partial,
  };
}

function num(v: string): number {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function periodBounds(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

function rowPreview(row: DigitarRow) {
  const hours = {
    RD: num(row.hoursRd),
    RN: num(row.hoursRn),
    TSD: num(row.hoursTsd),
    TSN: num(row.hoursTsn),
    HEDD: num(row.hoursHedd),
    HEND: num(row.hoursHend),
    DISPONIBILIDAD: num(row.hoursDisponibilidad),
  };
  const categoriesTotal = sumCategoryHours(hours);
  const startEnd = calcStartEndHours(row.startTime, row.endTime);
  const delta =
    startEnd == null ? null : Math.round((startEnd - categoriesTotal) * 10000) / 10000;
  const mismatch =
    delta != null && Math.abs(delta) > HOURS_COHERENCE_TOLERANCE;
  const salary = row.monthlySalary ?? 0;
  const factor = row.payrollFactor ?? 1.5829;
  const { total } = computeAmounts(hours, salary, factor, 220);
  return { categoriesTotal, startEnd, delta, mismatch, total, salary };
}

export default function DigitarContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<DigitarRow[]>([emptyRow()]);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successBatchId, setSuccessBatchId] = useState<string | null>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const syncingScroll = useRef(false);

  const bounds = useMemo(() => periodBounds(year, month), [year, month]);

  const syncTopSpacerWidth = useCallback(() => {
    const wrap = gridWrapRef.current;
    const spacer = topSpacerRef.current;
    if (!wrap || !spacer) return;
    const table = wrap.querySelector("table");
    spacer.style.width = `${table?.scrollWidth ?? wrap.scrollWidth}px`;
  }, []);

  useEffect(() => {
    syncTopSpacerWidth();
    const wrap = gridWrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => syncTopSpacerWidth());
    ro.observe(wrap);
    const table = wrap.querySelector("table");
    if (table) ro.observe(table);
    return () => ro.disconnect();
  }, [rows, syncTopSpacerWidth]);

  function handleTopScroll() {
    if (syncingScroll.current) return;
    const top = topScrollRef.current;
    const wrap = gridWrapRef.current;
    if (!top || !wrap) return;
    syncingScroll.current = true;
    wrap.scrollLeft = top.scrollLeft;
    syncingScroll.current = false;
  }

  function handleGridScroll() {
    if (syncingScroll.current) return;
    const top = topScrollRef.current;
    const wrap = gridWrapRef.current;
    if (!top || !wrap) return;
    syncingScroll.current = true;
    top.scrollLeft = wrap.scrollLeft;
    syncingScroll.current = false;
  }

  const updateRow = useCallback((localId: string, patch: Partial<DigitarRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)),
    );
  }, []);

  const handleLookup = useCallback(
    async (localId: string, documentNumber: string) => {
      const digits = documentNumber.replace(/\D/g, "");
      if (!digits) {
        updateRow(localId, {
          fullName: "",
          processName: "",
          zoneName: "",
          jobTitle: "",
          monthlySalary: null,
          payrollFactor: null,
          lookupError: null,
          lookingUp: false,
        });
        return;
      }
      updateRow(localId, { lookingUp: true, lookupError: null });
      try {
        const data = await lookupManualEmployee(digits);
        if (!data.found) {
          updateRow(localId, {
            lookingUp: false,
            fullName: "",
            processName: "",
            zoneName: "",
            jobTitle: "",
            monthlySalary: null,
            payrollFactor: null,
            lookupError: "Cédula no encontrada",
          });
          return;
        }
        if (data.isActive === false) {
          updateRow(localId, {
            lookingUp: false,
            fullName: data.fullName ?? "",
            processName: data.processName ?? "",
            zoneName: data.zoneName ?? "",
            jobTitle: data.jobTitle ?? "",
            monthlySalary: data.monthlySalary ?? null,
            payrollFactor: data.payrollFactor ?? null,
            lookupError: "Empleado inactivo",
          });
          return;
        }
        updateRow(localId, {
          lookingUp: false,
          documentNumber: data.documentNumber,
          fullName: data.fullName ?? "",
          processName: data.processName ?? "",
          zoneName: data.zoneName ?? "",
          jobTitle: data.jobTitle ?? "",
          monthlySalary: data.monthlySalary ?? null,
          payrollFactor: data.payrollFactor ?? null,
          lookupError: data.monthlySalary == null ? "Sin salario/catálogo" : null,
        });
      } catch (e) {
        updateRow(localId, {
          lookingUp: false,
          lookupError: e instanceof Error ? e.message : "Error al buscar",
        });
      }
    },
    [updateRow],
  );

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
    setSuccess(null);
  }

  function duplicateRow(localId: string) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.localId === localId);
      if (idx < 0) return prev;
      const src = prev[idx];
      const copy = emptyRow({
        ...src,
        localId: newLocalId(),
        lookingUp: false,
      });
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setSuccess(null);
  }

  function removeRow(localId: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.localId !== localId)));
  }

  async function handleRegister() {
    setError(null);
    setSuccess(null);
    if (!rows.length) {
      setError("Agrega al menos una fila");
      return;
    }

    for (const row of rows) {
      if (!row.documentNumber.replace(/\D/g, "")) {
        setError("Todas las filas deben tener cédula");
        return;
      }
      if (!row.workDate) {
        setError("Todas las filas deben tener fecha");
        return;
      }
      if (row.workDate < bounds.from || row.workDate > bounds.to) {
        setError(`La fecha debe estar en el periodo ${year}-${String(month).padStart(2, "0")}`);
        return;
      }
      if (!row.startTime || !row.endTime) {
        setError("Todas las filas deben tener hora inicio y fin");
        return;
      }
      const preview = rowPreview(row);
      if (preview.mismatch) {
        setError(
          `Fila ${row.documentNumber}: el horario no coincide con la suma de horas por categoría`,
        );
        return;
      }
      if (row.lookupError === "Cédula no encontrada" || row.lookupError === "Empleado inactivo") {
        setError(`Corrige la cédula de la fila ${row.documentNumber}`);
        return;
      }
    }

    const payload: ManualEntryPayload[] = rows.map((row) => ({
      documentNumber: row.documentNumber.replace(/\D/g, ""),
      workDate: row.workDate,
      startTime: formatClockTime(row.startTime) || row.startTime,
      endTime: formatClockTime(row.endTime) || row.endTime,
      hoursRd: num(row.hoursRd),
      hoursRn: num(row.hoursRn),
      hoursTsd: num(row.hoursTsd),
      hoursTsn: num(row.hoursTsn),
      hoursHedd: num(row.hoursHedd),
      hoursHend: num(row.hoursHend),
      hoursDisponibilidad: num(row.hoursDisponibilidad),
      baseMunicipality: row.baseMunicipality || undefined,
      commissionMunicipality: row.commissionMunicipality || undefined,
      brigadeCode: row.brigadeCode || undefined,
      systemName: row.systemName || undefined,
      itinerary: row.itinerary || undefined,
      caseRef: row.caseRef || undefined,
      workRef: row.workRef || undefined,
      ticketRef: row.ticketRef || undefined,
      consigna: row.consigna || undefined,
      attachmentRef: row.attachmentRef || undefined,
      operationalNote: row.operationalNote || undefined,
    }));

    setRegistering(true);
    try {
      const result = await registerManualEntries({ year, month, rows: payload });
      setSuccess(
        `Planilla ${result.batchCode} registrada (${result.entryCount} registros). Quedan en pendiente de aprobación.`,
      );
      setRows([emptyRow()]);
      setSuccessBatchId(result.batchId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al registrar";
      setError(msg);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div>
      <PeriodSelector
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
          setSuccess(null);
          setError(null);
        }}
      />

      <p className={styles.hint}>
        Digita los registros en borrador. Nombre, proceso, zona y sueldo se completan al salir de la
        cédula. Usa <strong>Duplicar</strong> para el mismo trabajo con otro trabajador (cambia la
        cédula). Al final registra toda la planilla de una vez.
      </p>

      <div className={styles.toolbar}>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          Agregar fila
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleRegister}
          disabled={registering}
        >
          {registering ? "Registrando…" : "Registrar planilla"}
        </Button>
        <span className={styles.count}>{rows.length} fila(s)</span>
      </div>

      {error && <div className={`${shared.alert} ${shared.alertError}`}>{error}</div>}
      {success && (
        <div className={`${shared.alert} ${shared.alertSuccess}`}>
          {success}{" "}
          <Link href="/dashboard/contabilidad/horas-extra/registros/planilla">
            Ir a vista planilla
          </Link>
        </div>
      )}

      <div
        className={styles.topScroll}
        ref={topScrollRef}
        onScroll={handleTopScroll}
        aria-hidden
      >
        <div className={styles.topScrollSpacer} ref={topSpacerRef} />
      </div>
      <div
        className={styles.gridWrap}
        ref={gridWrapRef}
        onScroll={handleGridScroll}
      >
        <table className={styles.grid}>
          <thead>
            <tr>
              <th className={styles.stickyActions}>Acciones</th>
              <th>Cédula *</th>
              <th>Nombre</th>
              <th>Fecha *</th>
              <th>Inicio *</th>
              <th>Fin *</th>
              <th>RD</th>
              <th>RN</th>
              <th>TSD</th>
              <th>TSN</th>
              <th>HEDD</th>
              <th>HEND</th>
              <th>Disp.</th>
              <th>Validador</th>
              <th>Total $</th>
              <th>Proceso</th>
              <th>Zona</th>
              <th>Sueldo</th>
              <th>Consigna</th>
              <th>Lugar comisión</th>
              <th>Municipio sede</th>
              <th>Brigada</th>
              <th>Sistema</th>
              <th>Itinerario</th>
              <th>Caso</th>
              <th>Trabajo</th>
              <th>Ticket</th>
              <th>Archivo</th>
              <th>Obs. operativa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const preview = rowPreview(row);
              return (
                <tr
                  key={row.localId}
                  className={preview.mismatch || row.lookupError ? styles.rowWarn : undefined}
                >
                  <td className={styles.stickyActions}>
                    <div className={styles.rowActions}>
                      <button type="button" onClick={() => duplicateRow(row.localId)}>
                        Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.localId)}
                        disabled={rows.length <= 1}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.documentNumber}
                      inputMode="numeric"
                      onChange={(e) =>
                        updateRow(row.localId, { documentNumber: e.target.value })
                      }
                      onBlur={(e) => handleLookup(row.localId, e.target.value)}
                    />
                    {row.lookingUp && <div className={styles.cellHint}>Buscando…</div>}
                    {row.lookupError && (
                      <div className={styles.cellError}>{row.lookupError}</div>
                    )}
                  </td>
                  <td className={styles.ro}>{row.fullName || "—"}</td>
                  <td>
                    <input
                      className={styles.cellInput}
                      type="date"
                      min={bounds.from}
                      max={bounds.to}
                      value={row.workDate}
                      onChange={(e) => updateRow(row.localId, { workDate: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      placeholder="17:00"
                      value={row.startTime}
                      onChange={(e) => updateRow(row.localId, { startTime: e.target.value })}
                      onBlur={(e) =>
                        updateRow(row.localId, {
                          startTime: formatClockTime(e.target.value) || e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      placeholder="19:00"
                      value={row.endTime}
                      onChange={(e) => updateRow(row.localId, { endTime: e.target.value })}
                      onBlur={(e) =>
                        updateRow(row.localId, {
                          endTime: formatClockTime(e.target.value) || e.target.value,
                        })
                      }
                    />
                  </td>
                  {(
                    [
                      ["hoursRd", row.hoursRd],
                      ["hoursRn", row.hoursRn],
                      ["hoursTsd", row.hoursTsd],
                      ["hoursTsn", row.hoursTsn],
                      ["hoursHedd", row.hoursHedd],
                      ["hoursHend", row.hoursHend],
                      ["hoursDisponibilidad", row.hoursDisponibilidad],
                    ] as const
                  ).map(([key, val]) => (
                    <td key={key}>
                      <input
                        className={`${styles.cellInput} ${styles.num}`}
                        value={val}
                        inputMode="decimal"
                        onChange={(e) => updateRow(row.localId, { [key]: e.target.value })}
                      />
                    </td>
                  ))}
                  <td
                    className={`${styles.ro} ${styles.num} ${preview.mismatch ? styles.bad : ""}`}
                  >
                    {preview.delta == null ? "—" : preview.delta}
                  </td>
                  <td className={`${styles.ro} ${styles.num}`}>
                    {preview.salary
                      ? preview.total.toLocaleString("es-CO")
                      : "—"}
                  </td>
                  <td className={styles.ro}>{row.processName || "—"}</td>
                  <td className={styles.ro}>{row.zoneName || "—"}</td>
                  <td className={`${styles.ro} ${styles.num}`}>
                    {row.monthlySalary != null
                      ? row.monthlySalary.toLocaleString("es-CO")
                      : "—"}
                  </td>
                  {(
                    [
                      ["consigna", row.consigna],
                      ["commissionMunicipality", row.commissionMunicipality],
                      ["baseMunicipality", row.baseMunicipality],
                      ["brigadeCode", row.brigadeCode],
                      ["systemName", row.systemName],
                      ["itinerary", row.itinerary],
                      ["caseRef", row.caseRef],
                      ["workRef", row.workRef],
                      ["ticketRef", row.ticketRef],
                      ["attachmentRef", row.attachmentRef],
                      ["operationalNote", row.operationalNote],
                    ] as const
                  ).map(([key, val]) => (
                    <td key={key}>
                      <input
                        className={styles.cellInput}
                        value={val}
                        onChange={(e) => updateRow(row.localId, { [key]: e.target.value })}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {successBatchId && (
        <BatchRegisterSuccessModal
          batchId={successBatchId}
          onClose={() => setSuccessBatchId(null)}
        />
      )}
    </div>
  );
}
