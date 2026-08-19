"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components";
import {
  fetchManualDraft,
  fetchManualEmployees,
  lookupManualEmployee,
  registerManualEntries,
  saveManualDraft,
  type ManualEmployeeLookup,
  type ManualEmployeeOption,
  type ManualEntryPayload,
} from "../../api/overtimeApi";
import {
  calcStartEndHours,
  HOURS_COHERENCE_TOLERANCE,
  sumCategoryHours,
} from "../../lib/overtimeCalculator";
import { formatClockTime, isHalfHourClock, toHalfHourClock } from "../../lib/timeFormat";
import {
  suggestSupplementalCategoryHours,
  suggestedHoursToRowPatch,
} from "../../lib/suggestCategoryHours";
import BatchRegisterSuccessModal from "../BatchRegisterSuccessModal/BatchRegisterSuccessModal";
import CategoriasTsHelpModal, {
  categoriaShortLabel,
  type CategoriaTsCode,
} from "../CategoriasTsHelpModal/CategoriasTsHelpModal";
import RegisterValidationModal from "../RegisterValidationModal/RegisterValidationModal";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import shared from "../../styles/shared.module.scss";
import EmployeeSuggestField from "./EmployeeSuggestField";
import HalfHourSelect from "./HalfHourSelect";
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
  fullName: string;
  processName: string;
  zoneName: string;
  jobTitle: string;
  monthlySalary: number | null;
  payrollFactor: number | null;
  lookupError: string | null;
  lookingUp: boolean;
  /** Si true, no sobrescribir categorías al cambiar fecha/horario. */
  categoriesManual: boolean;
};

const CATEGORY_KEYS = [
  "hoursRd",
  "hoursRn",
  "hoursTsd",
  "hoursTsn",
  "hoursHedd",
  "hoursHend",
  "hoursDisponibilidad",
] as const;

type CategoryFieldKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_HEADER_CODES: CategoriaTsCode[] = [
  "RD",
  "RN",
  "TSD",
  "TSN",
  "HEDD",
  "HEND",
  "DISPONIBILIDAD",
];

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
    categoriesManual: false,
    ...partial,
  };
}

function autofillPatchForRow(row: Pick<DigitarRow, "workDate" | "startTime" | "endTime">) {
  const suggested = suggestSupplementalCategoryHours(
    row.workDate,
    row.startTime,
    row.endTime,
  );
  if (!suggested) return null;
  return suggestedHoursToRowPatch(suggested);
}

function mergeSchedulePatch(
  row: DigitarRow,
  patch: Partial<Pick<DigitarRow, "workDate" | "startTime" | "endTime">>,
): Partial<DigitarRow> {
  const next = { ...row, ...patch };
  if (next.categoriesManual) return patch;
  const autofill = autofillPatchForRow(next);
  if (!autofill) return patch;
  return { ...patch, ...autofill };
}

function mergeAutofillForce(row: DigitarRow): Partial<DigitarRow> {
  const autofill = autofillPatchForRow(row);
  if (!autofill) return { categoriesManual: false };
  return { ...autofill, categoriesManual: false };
}

function rowToDraftPayload(row: DigitarRow): Record<string, unknown> {
  return { ...row, lookingUp: false };
}

function rowFromDraftPayload(raw: Record<string, unknown>): DigitarRow {
  return emptyRow({
    ...(raw as Partial<DigitarRow>),
    localId: newLocalId(),
    lookingUp: false,
    startTime: toHalfHourClock(String(raw.startTime ?? "")),
    endTime: toHalfHourClock(String(raw.endTime ?? "")),
    categoriesManual: Boolean(raw.categoriesManual),
  });
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
  const mismatch = delta != null && Math.abs(delta) > HOURS_COHERENCE_TOLERANCE;
  const ok = delta != null && !mismatch;
  return { categoriesTotal, startEnd, delta, mismatch, ok };
}

function formatDraftSavedAt(date: Date): string {
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function rowLabel(row: DigitarRow, index: number): string {
  const doc = row.documentNumber.replace(/\D/g, "");
  if (doc) return `Cédula ${doc}`;
  if (row.fullName.trim()) return row.fullName.trim();
  return `Fila ${index + 1}`;
}

function collectRegisterErrors(
  rows: DigitarRow[],
  bounds: { from: string; to: string },
  year: number,
  month: number,
): string[] {
  const errors: string[] = [];
  if (!rows.length) {
    errors.push("Agrega al menos una fila.");
    return errors;
  }

  rows.forEach((row, index) => {
    const label = rowLabel(row, index);
    if (!row.documentNumber.replace(/\D/g, "")) {
      errors.push(`${label}: falta la cédula.`);
      return;
    }
    if (!row.workDate) {
      errors.push(`${label}: falta la fecha.`);
      return;
    }
    if (row.workDate < bounds.from || row.workDate > bounds.to) {
      errors.push(
        `${label}: la fecha debe estar en el periodo ${year}-${String(month).padStart(2, "0")}.`,
      );
      return;
    }
    if (!row.startTime || !row.endTime) {
      errors.push(`${label}: faltan hora de inicio y/o fin.`);
      return;
    }
    if (!isHalfHourClock(row.startTime) || !isHalfHourClock(row.endTime)) {
      errors.push(
        `${label}: las horas solo pueden ser en punto o media hora (ej. 18:00, 18:30).`,
      );
      return;
    }
    const preview = rowPreview(row);
    if (preview.mismatch && preview.delta != null) {
      errors.push(
        `${label}: validador ${preview.delta} (debe ser 0). Ajuste las horas por categoría o use Autollenar.`,
      );
      return;
    }
    if (row.lookupError === "Cédula no encontrada" || row.lookupError === "Empleado inactivo") {
      errors.push(`${label}: ${row.lookupError.toLowerCase()}.`);
    }
  });

  return errors;
}

function patchFromEmployee(emp: {
  documentNumber: string;
  fullName?: string | null;
  processName?: string | null;
  zoneName?: string | null;
  jobTitle?: string | null;
  monthlySalary?: number | null;
  payrollFactor?: number | null;
  municipality?: string | null;
  isActive?: boolean;
}): Partial<DigitarRow> {
  const inactive = emp.isActive === false;
  return {
    documentNumber: emp.documentNumber,
    fullName: emp.fullName ?? "",
    processName: emp.processName ?? "",
    zoneName: emp.zoneName ?? "",
    jobTitle: emp.jobTitle ?? "",
    monthlySalary: emp.monthlySalary ?? null,
    payrollFactor: emp.payrollFactor ?? null,
    baseMunicipality: emp.municipality ?? "",
    lookupError: inactive ? "Empleado inactivo" : null,
    lookingUp: false,
  };
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpFocus, setHelpFocus] = useState<CategoriaTsCode | null>(null);
  const [registerValidationOpen, setRegisterValidationOpen] = useState(false);
  const [registerValidationErrors, setRegisterValidationErrors] = useState<string[]>([]);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const syncingScroll = useRef(false);
  const draftReadyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  const forceImmediateSaveRef = useRef(false);
  const yearRef = useRef(year);
  const monthRef = useRef(month);
  const rowsRef = useRef(rows);
  yearRef.current = year;
  monthRef.current = month;
  rowsRef.current = rows;

  const bounds = useMemo(() => periodBounds(year, month), [year, month]);

  const flushDraftSave = useCallback(
    async (targetYear: number, targetMonth: number, payload: Record<string, unknown>[]) => {
      setDraftStatus("saving");
      try {
        const result = await saveManualDraft(targetYear, targetMonth, payload);
        setDraftStatus("saved");
        setDraftSavedAt(new Date(result.updatedAt));
      } catch {
        setDraftStatus("error");
      }
    },
    [],
  );

  const scheduleDraftSave = useCallback(
    (payload: Record<string, unknown>[], immediate: boolean) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (immediate) {
        void flushDraftSave(yearRef.current, monthRef.current, payload);
      } else {
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          void flushDraftSave(yearRef.current, monthRef.current, payload);
        }, 900);
      }
    },
    [flushDraftSave],
  );

  // Carga el único borrador del usuario (incluye el periodo en el que se quedó).
  useEffect(() => {
    let cancelled = false;
    draftReadyRef.current = false;
    (async () => {
      try {
        const draft = await fetchManualDraft();
        if (cancelled) return;
        if (draft.year && draft.month) {
          setYear(draft.year);
          setMonth(draft.month);
        }
        const loadedRows = draft.rows.length
          ? draft.rows.map(rowFromDraftPayload)
          : [emptyRow()];
        setRows(loadedRows);
        lastSavedSnapshotRef.current = JSON.stringify(loadedRows.map(rowToDraftPayload));
        if (draft.updatedAt) {
          setDraftStatus("saved");
          setDraftSavedAt(new Date(draft.updatedAt));
        }
      } catch {
        if (!cancelled) setRows([emptyRow()]);
      } finally {
        if (!cancelled) draftReadyRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (!draftReadyRef.current) return;
      const payload = rowsRef.current.map(rowToDraftPayload);
      void saveManualDraft(yearRef.current, monthRef.current, payload).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!draftReadyRef.current) return;
    const payload = rows.map(rowToDraftPayload);
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedSnapshotRef.current) return;
    lastSavedSnapshotRef.current = serialized;
    const immediate = forceImmediateSaveRef.current;
    forceImmediateSaveRef.current = false;
    scheduleDraftSave(payload, immediate);
  }, [rows, scheduleDraftSave]);

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

  const updateSchedule = useCallback(
    (localId: string, patch: Partial<Pick<DigitarRow, "workDate" | "startTime" | "endTime">>) => {
      setRows((prev) =>
        prev.map((r) =>
          r.localId === localId ? { ...r, ...mergeSchedulePatch(r, patch) } : r,
        ),
      );
    },
    [],
  );

  const updateCategory = useCallback(
    (localId: string, key: CategoryFieldKey, value: string) => {
      setRows((prev) =>
        prev.map((r) =>
          r.localId === localId ? { ...r, [key]: value, categoriesManual: true } : r,
        ),
      );
    },
    [],
  );

  const autofillRow = useCallback((localId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.localId === localId ? { ...r, ...mergeAutofillForce(r) } : r)),
    );
  }, []);

  const openCategoryHelp = useCallback((code?: CategoriaTsCode) => {
    setHelpFocus(code ?? null);
    setHelpOpen(true);
  }, []);

  const applyEmployee = useCallback(
    (
      localId: string,
      emp: ManualEmployeeOption | ManualEmployeeLookup,
    ) => {
      updateRow(localId, patchFromEmployee(emp));
    },
    [updateRow],
  );

  const handleDocumentCommit = useCallback(
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
        applyEmployee(localId, data);
      } catch (e) {
        updateRow(localId, {
          lookingUp: false,
          lookupError: e instanceof Error ? e.message : "Error al buscar",
        });
      }
    },
    [applyEmployee, updateRow],
  );

  const handleNameCommit = useCallback(
    async (localId: string, fullName: string) => {
      const q = fullName.trim();
      if (!q) return;
      try {
        const matches = await fetchManualEmployees(q);
        const exact = matches.filter(
          (e) => e.fullName.trim().toLowerCase() === q.toLowerCase(),
        );
        if (exact.length === 1) {
          applyEmployee(localId, exact[0]);
          return;
        }
        if (matches.length === 1) {
          applyEmployee(localId, matches[0]);
          return;
        }
        if (matches.length === 0) {
          updateRow(localId, { lookupError: "Nombre no encontrado" });
          return;
        }
        updateRow(localId, { lookupError: "Hay varios nombres: elige uno de la lista" });
      } catch (e) {
        updateRow(localId, {
          lookupError: e instanceof Error ? e.message : "Error al buscar",
        });
      }
    },
    [applyEmployee, updateRow],
  );

  function addRow() {
    forceImmediateSaveRef.current = true;
    setRows((prev) => [...prev, emptyRow()]);
    setSuccess(null);
  }

  function duplicateRow(localId: string) {
    forceImmediateSaveRef.current = true;
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
    forceImmediateSaveRef.current = true;
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.localId !== localId)));
  }

  async function handleSaveDraftNow() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const payload = rows.map(rowToDraftPayload);
    lastSavedSnapshotRef.current = JSON.stringify(payload);
    await flushDraftSave(year, month, payload);
  }

  function handlePeriodChange(newYear: number, newMonth: number) {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setYear(newYear);
    setMonth(newMonth);
    yearRef.current = newYear;
    monthRef.current = newMonth;
    const payload = rows.map(rowToDraftPayload);
    lastSavedSnapshotRef.current = JSON.stringify(payload);
    void flushDraftSave(newYear, newMonth, payload);
    setSuccess(null);
    setError(null);
  }

  async function handleRegister() {
    setError(null);
    setSuccess(null);

    const validationErrors = collectRegisterErrors(rows, bounds, year, month);
    if (validationErrors.length) {
      setRegisterValidationErrors(validationErrors);
      setRegisterValidationOpen(true);
      return;
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
      const resetRow = emptyRow();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      lastSavedSnapshotRef.current = JSON.stringify([rowToDraftPayload(resetRow)]);
      setRows([resetRow]);
      setDraftStatus("idle");
      setDraftSavedAt(null);
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
        onChange={handlePeriodChange}
      />

      <div className={styles.toolbar}>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          Agregar fila
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveDraftNow}
          disabled={draftStatus === "saving"}
        >
          Guardar borrador
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
        <div className={styles.draftMeta}>
          {draftStatus === "saving" && (
            <span className={styles.draftStatus}>Guardando borrador…</span>
          )}
          {draftStatus === "saved" && draftSavedAt && (
            <span className={styles.draftStatus}>
              Último borrador: {formatDraftSavedAt(draftSavedAt)}
            </span>
          )}
          {draftStatus === "error" && (
            <span className={`${styles.draftStatus} ${styles.draftStatusError}`}>
              No se pudo guardar el borrador. Usa &quot;Guardar borrador&quot; para reintentar.
            </span>
          )}
        </div>
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
              <th>Nombre *</th>
              <th>Fecha *</th>
              <th>Inicio *</th>
              <th>Fin *</th>
              {CATEGORY_HEADER_CODES.map((code) => (
                <th key={code} className={styles.categoryTh}>
                  <span>{categoriaShortLabel(code)}</span>
                  <button
                    type="button"
                    className={styles.colHelpBtn}
                    title={`Qué es ${code}`}
                    aria-label={`Ayuda: ${code}`}
                    onClick={() => openCategoryHelp(code)}
                  >
                    ?
                  </button>
                </th>
              ))}
              <th>Validador</th>
              <th>Proceso</th>
              <th>Zona</th>
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
                      <button type="button" onClick={() => autofillRow(row.localId)}>
                        Autollenar
                      </button>
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
                    <EmployeeSuggestField
                      mode="document"
                      value={row.documentNumber}
                      placeholder="Cédula"
                      inputMode="numeric"
                      onChange={(v) => updateRow(row.localId, { documentNumber: v })}
                      onPick={(emp) => applyEmployee(row.localId, emp)}
                      onCommit={(v) => void handleDocumentCommit(row.localId, v)}
                    />
                    {row.lookingUp && <div className={styles.cellHint}>Buscando…</div>}
                    {row.lookupError && (
                      <div className={styles.cellError}>{row.lookupError}</div>
                    )}
                  </td>
                  <td>
                    <EmployeeSuggestField
                      mode="name"
                      value={row.fullName}
                      placeholder="Nombre"
                      onChange={(v) => updateRow(row.localId, { fullName: v })}
                      onPick={(emp) => applyEmployee(row.localId, emp)}
                      onCommit={(v) => void handleNameCommit(row.localId, v)}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      type="date"
                      min={bounds.from}
                      max={bounds.to}
                      value={row.workDate}
                      onChange={(e) => updateSchedule(row.localId, { workDate: e.target.value })}
                    />
                  </td>
                  <td>
                    <HalfHourSelect
                      value={row.startTime}
                      onChange={(v) => updateSchedule(row.localId, { startTime: v })}
                    />
                  </td>
                  <td>
                    <HalfHourSelect
                      value={row.endTime}
                      onChange={(v) => updateSchedule(row.localId, { endTime: v })}
                    />
                  </td>
                  {CATEGORY_KEYS.map((key) => (
                    <td key={key}>
                      <input
                        className={`${styles.cellInput} ${styles.num}`}
                        value={row[key]}
                        inputMode="decimal"
                        onChange={(e) => updateCategory(row.localId, key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td
                    className={`${styles.ro} ${styles.num} ${styles.validatorCell} ${
                      preview.ok
                        ? styles.validatorCellOk
                        : preview.mismatch
                          ? styles.validatorCellBad
                          : ""
                    }`}
                  >
                    {preview.delta == null ? (
                      "—"
                    ) : preview.ok ? (
                      <span className={styles.validatorOk}>
                        <Check size={14} strokeWidth={2.5} aria-hidden />
                        0
                      </span>
                    ) : (
                      <span className={styles.validatorBad}>{preview.delta}</span>
                    )}
                  </td>
                  <td className={styles.ro}>{row.processName || "—"}</td>
                  <td className={styles.ro}>{row.zoneName || "—"}</td>
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

      <p className={styles.footnote}>
        Hay un solo borrador por usuario: al volver a esta pestaña se restaura para seguir
        digitando. Puedes buscar por cédula o por nombre (se cruzan con Parámetros). Las horas
        de inicio y fin solo aceptan en punto o media hora (18:00, 18:30). Al indicar{" "}
        <strong>Fecha + Inicio + Fin</strong>, se proponen TSD/TSN/HEDD/HEND según horario diurno
        (6:00–21:00) y festivo; RD, RN y Disponibilidad se digitán manualmente. Use{" "}
        <button type="button" className={styles.inlineHelp} onClick={() => openCategoryHelp()}>
          Guía de categorías
        </button>{" "}
        o el ícono <span className={styles.inlineHelpIcon}>?</span> en cada columna.{" "}
        <strong>Duplicar</strong> copia el tramo para otro trabajador.
      </p>

      {successBatchId && (
        <BatchRegisterSuccessModal
          batchId={successBatchId}
          onClose={() => setSuccessBatchId(null)}
        />
      )}

      <CategoriasTsHelpModal
        open={helpOpen}
        focusCode={helpFocus}
        onClose={() => {
          setHelpOpen(false);
          setHelpFocus(null);
        }}
      />

      <RegisterValidationModal
        open={registerValidationOpen}
        errors={registerValidationErrors}
        onClose={() => setRegisterValidationOpen(false)}
      />
    </div>
  );
}
