"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canReviewOvertime, canSeeOvertimeMoney } from "@/features/dashboard/constants/nav";
import {
  createPdfPlantilla,
  deletePdfPlantilla,
  downloadAuthenticatedFile,
  fetchPdfPlantillaEligible,
  fetchPdfPlantillas,
  fetchPeriod,
  generatePdfBatch,
  pdfPeriodZipUrl,
  pdfPlantillaPrintPageUrl,
  type OvertimeEntryRow,
  type PdfPlantilla,
} from "../../api/overtimeApi";
import EmployeeSuggestField from "../DigitarContainer/EmployeeSuggestField";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";
import suggest from "../DigitarContainer/EmployeeSuggestField.module.scss";
import modal from "../VoidEntryModal/VoidEntryModal.module.scss";
import local from "./PdfPlantillasContainer.module.scss";
import { formatDateOnly, toDateInputValue } from "../../lib/dateFormat";
import { overtimeStatusLabel } from "../../lib/overtimeStatus";
import { formatClockTime } from "../../lib/timeFormat";

function fmtMoney(n: number | undefined) {
  return (n ?? 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface PdfWorkerOption {
  employeeId: string;
  documentNumber: string;
  fullName: string;
  entryCount?: number;
}

function workerLabel(worker: PdfWorkerOption) {
  return `${worker.documentNumber} — ${worker.fullName}`;
}

function PdfWorkerSuggest({
  workers,
  value,
  locked,
  onChange,
  onPick,
}: {
  workers: PdfWorkerOption[];
  value: string;
  locked?: boolean;
  onChange: (value: string) => void;
  onPick: (worker: PdfWorkerOption) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const query = value.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const matches = query
    ? workers
        .filter(
          (worker) =>
            worker.fullName.toLowerCase().includes(query) ||
            (digits.length > 0 && worker.documentNumber.includes(digits)),
        )
        .slice(0, 12)
    : [];

  function updateCoords() {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 2,
      left: rect.left,
      width: Math.max(rect.width, 280),
    });
  }

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (listRef.current && target && listRef.current.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function pick(worker: PdfWorkerOption) {
    onPick(worker);
    setOpen(false);
  }

  const showList = open && !locked && query.length > 0 && coords && typeof document !== "undefined";

  return (
    <div className={suggest.wrap} ref={wrapRef}>
      <input
        className={`${suggest.input} ${suggest.inputWide}`}
        value={value}
        placeholder="Cédula o nombre"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => {
          updateCoords();
          if (!locked) setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 160)}
        onKeyDown={(e) => {
          if (!open || locked || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const worker = matches[highlight] ?? matches[0];
            if (worker) pick(worker);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {showList &&
        createPortal(
          <ul
            ref={listRef}
            className={suggest.list}
            role="listbox"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            {matches.length === 0 ? (
              <li className={suggest.status}>Sin coincidencias</li>
            ) : (
              matches.map((worker, index) => (
                <li key={worker.employeeId}>
                  <button
                    type="button"
                    className={index === highlight ? suggest.optionActive : suggest.option}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(worker);
                    }}
                  >
                    <span className={suggest.doc}>{worker.documentNumber}</span>
                    <span className={suggest.name}>
                      {worker.fullName}
                      {worker.entryCount != null ? ` · ${worker.entryCount}` : ""}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}

function plantillaOverlapsRange(plantilla: PdfPlantilla, filterFrom: string, filterTo: string) {
  if (!filterFrom && !filterTo) return true;
  const start = plantilla.includedFrom?.slice(0, 10);
  const end = plantilla.includedTo?.slice(0, 10);
  if (!start || !end) return false;
  if (filterFrom && end < filterFrom) return false;
  if (filterTo && start > filterTo) return false;
  return true;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatDateOnly(iso) || "—";
}

export default function PdfPlantillasContainer({
  view,
}: {
  view: "generar" | "imprimir";
}) {
  const { user } = useAuth();
  const canSeeMoney = canSeeOvertimeMoney(user?.role);
  const canDeletePdf = canReviewOvertime(user?.role);
  const isAnalyst = user?.role === "ANALISTA";
  const canGenerateAll =
    isAnalyst || user?.role === "SUPERVISOR" || user?.role === "CORDINADOR";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cutoffDate, setCutoffDate] = useState<string | null>(null);
  const [cutoffKnown, setCutoffKnown] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{
    employeeId: string;
    documentNumber: string;
    fullName: string;
  } | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [eligible, setEligible] = useState<OvertimeEntryRow[]>([]);
  const [eligibleMeta, setEligibleMeta] = useState<{
    fullName: string;
    documentNumber: string;
  } | null>(null);
  const [plantillas, setPlantillas] = useState<PdfPlantilla[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyEmployeeId, setHistoryEmployeeId] = useState("");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfToDelete, setPdfToDelete] = useState<PdfPlantilla | null>(null);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const [deletePdfError, setDeletePdfError] = useState<string | null>(null);

  const historyRequestRef = useRef(0);
  const loadHistory = useCallback(async () => {
    const requestId = ++historyRequestRef.current;
    setLoadingHistory(true);
    setPlantillas([]);
    try {
      const rows = await fetchPdfPlantillas({ year, month });
      if (requestId === historyRequestRef.current) setPlantillas(rows);
    } catch (e) {
      if (requestId !== historyRequestRef.current) return;
      setError(e instanceof Error ? e.message : "Error al cargar historial");
      setPlantillas([]);
    } finally {
      if (requestId === historyRequestRef.current) setLoadingHistory(false);
    }
  }, [year, month]);

  useEffect(() => {
    let active = true;
    setCutoffKnown(false);
    setCutoffDate(null);
    fetchPeriod(year, month)
      .then((period) => {
        if (!active) return;
        setCutoffDate(period?.pdfCutoffDate ? toDateInputValue(period.pdfCutoffDate) : null);
        setCutoffKnown(true);
      })
      .catch(() => {
        if (!active) return;
        setCutoffDate(null);
        setCutoffKnown(true);
      });
    return () => {
      active = false;
    };
  }, [year, month]);

  const monthEnd = useMemo(() => {
    const last = new Date(Date.UTC(year, month, 0));
    const y = last.getUTCFullYear();
    const m = String(last.getUTCMonth() + 1).padStart(2, "0");
    const d = String(last.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [year, month]);
  const fixedDateTo = cutoffDate || monthEnd;
  const fixedDateLabel = formatDateOnly(`${fixedDateTo}T00:00:00.000Z`);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setEmployeeId("");
    setEmployeeQuery("");
    setSelectedEmployee(null);
    setEligible([]);
    setEligibleMeta(null);
    setDateFrom("");
    setHistoryQuery("");
    setHistoryEmployeeId("");
    setHistoryDateFrom("");
    setHistoryDateTo("");
    setSuccess(null);
  }, [year, month]);

  const historyWorkers = useMemo(() => {
    const byEmployee = new Map<string, PdfWorkerOption>();
    for (const plantilla of plantillas) {
      if (!byEmployee.has(plantilla.employeeId)) {
        byEmployee.set(plantilla.employeeId, {
          employeeId: plantilla.employeeId,
          documentNumber: plantilla.employeeDocumentNumber,
          fullName: plantilla.employeeFullName,
        });
      }
    }
    return [...byEmployee.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  }, [plantillas]);

  const visiblePlantillas = useMemo(() => {
    const query = historyEmployeeId ? "" : historyQuery.trim().toLowerCase();
    const digits = query.replace(/\D/g, "");
    return plantillas.filter((plantilla) => {
      if (historyEmployeeId && plantilla.employeeId !== historyEmployeeId) return false;
      if (query) {
        const nameMatch = plantilla.employeeFullName.toLowerCase().includes(query);
        const docMatch = digits.length > 0 && plantilla.employeeDocumentNumber.includes(digits);
        if (!nameMatch && !docMatch) return false;
      }
      return plantillaOverlapsRange(plantilla, historyDateFrom, historyDateTo);
    });
  }, [plantillas, historyEmployeeId, historyQuery, historyDateFrom, historyDateTo]);

  useEffect(() => {
    if (!employeeId || !cutoffKnown) {
      setEligible([]);
      setEligibleMeta(null);
      return;
    }
    let cancelled = false;
    setLoadingEligible(true);
    setError(null);
    void fetchPdfPlantillaEligible({
      year,
      month,
      employeeId,
      dateFrom: dateFrom || undefined,
      dateTo: fixedDateTo,
    })
      .then((data) => {
        if (cancelled) return;
        setEligible(data.items);
        setEligibleMeta({
          fullName: data.employee.fullName,
          documentNumber: data.employee.documentNumber,
        });
        if (data.total === 0) {
          setError("No hay registros aprobados sin planilla PDF para ese trabajador");
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setEligible([]);
        setEligibleMeta(null);
        setError(e instanceof Error ? e.message : "Error al cargar registros");
      })
      .finally(() => {
        if (!cancelled) setLoadingEligible(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, dateFrom, fixedDateTo, cutoffKnown, year, month]);

  async function handleGenerate() {
    if (!employeeId) {
      setError("Selecciona un trabajador");
      return;
    }
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createPdfPlantilla({
        year,
        month,
        employeeId,
        dateFrom: dateFrom || undefined,
        dateTo: fixedDateTo,
      });
      setSuccess(`Planilla ${created.plantillaCode} generada (${created.entryCount} registros)`);
      setEligible([]);
      setEligibleMeta(null);
      setEmployeeId("");
      setEmployeeQuery("");
      setSelectedEmployee(null);
      await loadHistory();
      window.open(pdfPlantillaPrintPageUrl(created.id, true), "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar PDF");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateBatch() {
    setGeneratingBatch(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await generatePdfBatch(year, month);
      setSuccess(
        result.created === 0
          ? result.message
          : `${result.message}. Correos enviados: ${result.emailed}.`,
      );
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar los PDF");
    } finally {
      setGeneratingBatch(false);
    }
  }

  async function handleDownloadZip(filtered = false) {
    setDownloadingZip(true);
    setError(null);
    try {
      await downloadAuthenticatedFile(
        pdfPeriodZipUrl({
          year,
          month,
          employeeId: filtered ? historyEmployeeId || undefined : undefined,
          search: filtered && !historyEmployeeId ? historyQuery : undefined,
          dateFrom: filtered ? historyDateFrom || undefined : undefined,
          dateTo: filtered ? historyDateTo || undefined : undefined,
        }),
        `pdfs-${year}-${String(month).padStart(2, "0")}.zip`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al descargar los PDF");
    } finally {
      setDownloadingZip(false);
    }
  }

  function handleRedownload(p: PdfPlantilla) {
    setError(null);
    window.open(pdfPlantillaPrintPageUrl(p.id, true), "_blank", "noopener,noreferrer");
  }

  async function handleConfirmDeletePdf() {
    if (!pdfToDelete) return;
    setDeletingPdf(true);
    setDeletePdfError(null);
    try {
      await deletePdfPlantilla(pdfToDelete.id);
      setSuccess(`Planilla ${pdfToDelete.plantillaCode} eliminada. Sus registros quedaron libres.`);
      setPdfToDelete(null);
      await loadHistory();
    } catch (e) {
      setDeletePdfError(e instanceof Error ? e.message : "No se pudo eliminar el PDF");
    } finally {
      setDeletingPdf(false);
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
        }}
      />

      {view === "generar" && cutoffKnown && cutoffDate && (
        <div className={`${styles.alert} ${styles.alertInfo}`}>
          Fecha de corte de generación de PDF por Contabilidad: {fixedDateLabel}. Registros
          superiores a esta fecha aún no se pueden incluir en plantillas PDF.
        </div>
      )}

      {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
      {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>}

      {view === "generar" && canGenerateAll && (
      <div className={local.filtersPanel}>
        <p className={styles.hint}>
          {isAnalyst
            ? "Genera un PDF por cada trabajador de los digitadores asignados"
            : "Genera un PDF por cada trabajador al que usted digitó horas"}
          , con sus registros aprobados que aún no están en un PDF.
          Cada PDF se envía a quien
          lo genera, a quien digitó y al analista del grupo. No se envía al brigadista.
        </p>
        <div className={local.filterActions}>
          <Button type="button" onClick={handleGenerateBatch} disabled={generatingBatch}>
            {generatingBatch ? "Generando PDFs…" : "Generar PDFs"}
          </Button>
        </div>
      </div>
      )}

      {view === "generar" && !isAnalyst && (
      <div className={local.filtersPanel}>
        <p className={styles.hint}>
          Busque al trabajador por cédula o nombre y selecciónelo. El PDF incluye sus registros
          aprobados que aún no están en una planilla, hasta el {fixedDateLabel}.
        </p>
        <div className={local.filtersGrid}>
          <div className={`${local.filterField} ${local.workerSearch}`}>
            <span>Trabajador</span>
            <EmployeeSuggestField
              mode="name"
              value={employeeQuery}
              placeholder="Cédula o nombre…"
              onChange={(value) => {
                setEmployeeQuery(value);
                setSelectedEmployee(null);
                setEmployeeId("");
                setSuccess(null);
              }}
              onPick={(employee) => {
                setSelectedEmployee(employee);
                setEmployeeQuery(`${employee.documentNumber} — ${employee.fullName}`);
                setEmployeeId(employee.employeeId);
                setSuccess(null);
              }}
              onCommit={() => undefined}
            />
            {selectedEmployee ? (
              <span className={local.selectedHint}>
                Seleccionado: {selectedEmployee.fullName} · {selectedEmployee.documentNumber}
              </span>
            ) : null}
          </div>
          <label className={local.filterField}>
            <span>Fecha desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label className={local.filterField}>
            <span>Fecha hasta</span>
            <input type="date" value={cutoffKnown ? fixedDateTo : ""} readOnly disabled />
          </label>
        </div>
        <div className={local.filterActions}>
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerate}
            disabled={generating || !employeeId}
            title={employeeId ? undefined : "Seleccione un trabajador de la lista"}
          >
            {generating ? "Generando…" : "Generar e imprimir"}
          </Button>
        </div>
      </div>
      )}

      {view === "generar" && !isAnalyst && (
      <section className={local.section}>
        <h3 className={local.sectionTitle}>
          Registros a incluir
          {eligibleMeta
            ? ` — ${eligibleMeta.fullName} (${eligibleMeta.documentNumber}) · ${eligible.length}`
            : ""}
        </h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha</th>
                <th>Consigna</th>
                <th>Inicio</th>
                <th>Fin</th>
                {canSeeMoney && <th>Total $</th>}
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {eligible.length === 0 ? (
                <tr>
                  <td colSpan={canSeeMoney ? 7 : 6}>
                    {loadingEligible
                      ? "Cargando registros…"
                      : employeeId
                        ? "Sin registros aprobados pendientes de PDF"
                        : "Busque y seleccione un trabajador"}
                  </td>
                </tr>
              ) : (
                eligible.map((row) => (
                  <tr key={row.id}>
                    <td>{row.entryCode}</td>
                    <td>{fmtDate(row.workDate)}</td>
                    <td>{row.consigna ?? "—"}</td>
                    <td>{formatClockTime(row.startTime) || "—"}</td>
                    <td>{formatClockTime(row.endTime) || "—"}</td>
                    {canSeeMoney && <td>{fmtMoney(row.amountTotal)}</td>}
                    <td>{overtimeStatusLabel(row.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {view === "imprimir" && (
      <section className={local.section}>
        <div className={local.historyHeader}>
          <h3 className={local.sectionTitle}>Planillas PDF generadas</h3>
          <div className={local.historySearch}>
            <label className={`${local.filterField} ${local.workerSearch}`}>
              <span>Nombre o cédula</span>
              <PdfWorkerSuggest
                workers={historyWorkers}
                value={historyQuery}
                locked={Boolean(historyEmployeeId)}
                onChange={(value) => {
                  setHistoryQuery(value);
                  setHistoryEmployeeId("");
                }}
                onPick={(worker) => {
                  setHistoryQuery(workerLabel(worker));
                  setHistoryEmployeeId(worker.employeeId);
                }}
              />
            </label>
            <label className={local.filterField}>
              <span>Fecha desde</span>
              <input
                type="date"
                value={historyDateFrom}
                onChange={(e) => setHistoryDateFrom(e.target.value)}
              />
            </label>
            <label className={local.filterField}>
              <span>Fecha hasta</span>
              <input
                type="date"
                value={historyDateTo}
                onChange={(e) => setHistoryDateTo(e.target.value)}
              />
            </label>
            {(historyQuery || historyDateFrom || historyDateTo) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHistoryQuery("");
                  setHistoryEmployeeId("");
                  setHistoryDateFrom("");
                  setHistoryDateTo("");
                }}
              >
                Ver todas
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloadingZip || visiblePlantillas.length === 0}
              onClick={() => handleDownloadZip(true)}
            >
              {downloadingZip ? "Preparando ZIP…" : "Descargar PDFs filtrados"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloadingZip || plantillas.length === 0}
              onClick={() => handleDownloadZip(false)}
            >
              {downloadingZip ? "Preparando ZIP…" : "Descargar PDFs del periodo"}
            </Button>
          </div>
        </div>
        {loadingHistory && <div className={styles.loading}>Cargando historial…</div>}
        {!loadingHistory && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Trabajador</th>
                  <th>Cédula</th>
                  <th>Fechas incluidas</th>
                  <th>Registros</th>
                  <th>Generado</th>
                  <th>Por</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlantillas.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      {historyQuery || historyDateFrom || historyDateTo
                        ? "Sin planillas PDF para ese filtro en este periodo"
                        : "Sin planillas PDF en este periodo"}
                    </td>
                  </tr>
                ) : (
                  visiblePlantillas.map((p) => (
                    <tr key={p.id}>
                      <td>{p.plantillaCode}</td>
                      <td>{p.employeeFullName}</td>
                      <td>{p.employeeDocumentNumber}</td>
                      <td>
                        {p.includedFrom
                          ? `${fmtDate(p.includedFrom)} → ${fmtDate(p.includedTo)}`
                          : "—"}
                      </td>
                      <td>{p.entryCount}</td>
                      <td>{new Date(p.generatedAt).toLocaleString("es-CO")}</td>
                      <td>{p.generatedBy.name}</td>
                      <td>
                        <div className={local.rowActions}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRedownload(p)}
                          >
                            Imprimir / PDF
                          </Button>
                          {canDeletePdf && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDeletePdfError(null);
                                setPdfToDelete(p);
                              }}
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {pdfToDelete && (
        <div
          className={modal.overlay}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingPdf) setPdfToDelete(null);
          }}
        >
          <div className={modal.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-pdf-list-title">
            <header className={modal.header}>
              <h2 id="delete-pdf-list-title" className={modal.title}>
                Eliminar {pdfToDelete.plantillaCode}
              </h2>
              <p className={modal.warning}>
                Se borra el PDF de {pdfToDelete.employeeFullName}. Los {pdfToDelete.entryCount}{" "}
                registros quedan libres para generar la planilla de nuevo.
              </p>
            </header>
            <div className={modal.body}>
              {deletePdfError && <p className={modal.error}>{deletePdfError}</p>}
            </div>
            <div className={modal.actions}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deletingPdf}
                onClick={() => setPdfToDelete(null)}
              >
                Cancelar
              </Button>
              <Button type="button" size="sm" disabled={deletingPdf} onClick={() => void handleConfirmDeletePdf()}>
                {deletingPdf ? "Eliminando…" : "Eliminar PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
