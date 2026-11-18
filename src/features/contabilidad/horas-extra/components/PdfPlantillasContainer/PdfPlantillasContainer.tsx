"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { canReviewOvertime, canSeeOvertimeMoney } from "@/features/dashboard/constants/nav";
import {
  createPdfPlantilla,
  deletePdfPlantilla,
  downloadAuthenticatedFile,
  fetchPdfPlantillaEligible,
  fetchPdfPlantillaEmployees,
  fetchPdfPlantillas,
  generatePdfBatch,
  pdfPeriodZipUrl,
  pdfPlantillaPrintPageUrl,
  type OvertimeEntryRow,
  type PdfPlantilla,
  type PdfPlantillaEmployee,
} from "../../api/overtimeApi";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";
import suggest from "../DigitarContainer/EmployeeSuggestField.module.scss";
import modal from "../VoidEntryModal/VoidEntryModal.module.scss";
import local from "./PdfPlantillasContainer.module.scss";
import { formatDateOnly } from "../../lib/dateFormat";
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
}

function PdfWorkerSuggest({
  workers,
  value,
  onChange,
  onPick,
}: {
  workers: PdfWorkerOption[];
  value: string;
  onChange: (value: string) => void;
  onPick: (worker: PdfWorkerOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
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
    : workers.slice(0, 12);

  return (
    <div className={suggest.wrap}>
      <input
        className={`${suggest.input} ${suggest.inputName}`}
        value={value}
        placeholder="Nombre o cédula"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 160)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const worker = matches[highlight] ?? matches[0];
            if (worker) onPick(worker);
            setOpen(false);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && query && (
        <ul
          className={suggest.list}
          role="listbox"
          style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, width: "16rem" }}
        >
          {matches.length === 0 ? (
            <li className={suggest.status}>Sin coincidencias</li>
          ) : (
            matches.map((worker, index) => (
              <li key={worker.employeeId}>
                <button
                  type="button"
                  className={index === highlight ? suggest.optionActive : suggest.option}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(worker);
                    setOpen(false);
                  }}
                >
                  <span className={suggest.doc}>{worker.documentNumber}</span>
                  <span className={suggest.name}>{worker.fullName}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function plantillaOverlapsRange(
  plantilla: PdfPlantilla,
  year: number,
  month: number,
  filterFrom: string,
  filterTo: string,
) {
  if (!filterFrom && !filterTo) return true;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const start = (plantilla.dateFrom ?? monthStart).slice(0, 10);
  const end = (plantilla.dateTo ?? monthEnd).slice(0, 10);
  if (filterFrom && end < filterFrom) return false;
  if (filterTo && start > filterTo) return false;
  return true;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatDateOnly(iso) || "—";
}

export default function PdfPlantillasContainer() {
  const { user } = useAuth();
  const canSeeMoney = canSeeOvertimeMoney(user?.role);
  const canDeletePdf = canReviewOvertime(user?.role);
  const canBulkPdf =
    user?.role === "ANALISTA" || user?.role === "SUPERVISOR" || user?.role === "CORDINADOR";
  const showIndividual = user?.role !== "ANALISTA";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employees, setEmployees] = useState<PdfPlantillaEmployee[]>([]);
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

  const loadEmployees = useCallback(async () => {
    try {
      setEmployees(
        await fetchPdfPlantillaEmployees(year, month, employeeSearch || undefined),
      );
    } catch {
      setEmployees([]);
    }
  }, [year, month, employeeSearch]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      setPlantillas(await fetchPdfPlantillas({ year, month }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar historial");
      setPlantillas([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setEmployeeId("");
    setEligible([]);
    setEligibleMeta(null);
    setDateFrom("");
    setDateTo("");
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
      return plantillaOverlapsRange(plantilla, year, month, historyDateFrom, historyDateTo);
    });
  }, [plantillas, historyEmployeeId, historyQuery, historyDateFrom, historyDateTo, year, month]);

  async function handlePreview() {
    if (!employeeId) {
      setError("Selecciona un trabajador");
      return;
    }
    setLoadingEligible(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await fetchPdfPlantillaEligible({
        year,
        month,
        employeeId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setEligible(data.items);
      setEligibleMeta({
        fullName: data.employee.fullName,
        documentNumber: data.employee.documentNumber,
      });
      if (data.total === 0) {
        setError(
          "No hay registros aprobados elegibles (sin planilla PDF previa) para ese filtro",
        );
      }
    } catch (e) {
      setEligible([]);
      setEligibleMeta(null);
      setError(e instanceof Error ? e.message : "Error al filtrar");
    } finally {
      setLoadingEligible(false);
    }
  }

  async function handleGenerate() {
    if (!employeeId) {
      setError("Selecciona un trabajador");
      return;
    }
    if (eligible.length === 0) {
      setError("No hay registros para incluir. Filtra primero.");
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
        dateTo: dateTo || undefined,
      });
      setSuccess(`Planilla ${created.plantillaCode} generada (${created.entryCount} registros)`);
      setEligible([]);
      setEligibleMeta(null);
      await loadHistory();
      await loadEmployees();
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
      if (showIndividual) await loadEmployees();
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
      if (showIndividual) await loadEmployees();
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

      {canBulkPdf && (
        <div className={local.filtersPanel}>
          <p className={styles.hint}>
            {user?.role === "ANALISTA"
              ? "Genera un PDF por trabajador con todos sus registros aprobados que aún no están en un PDF, aunque los hayan digitado supervisores distintos."
              : "Genera un PDF por cada trabajador al que usted digitó tiempo. Ese PDF incluye todos sus registros aprobados que aún no están en un PDF, aunque otro supervisor haya digitado parte."}{" "}
            Cada PDF se envía a quien lo genera, a quien digitó y al analista del grupo. No se envía al brigadista.
          </p>
          <div className={local.filterActions}>
            <Button
              type="button"
              onClick={handleGenerateBatch}
              disabled={generatingBatch || downloadingZip}
            >
              {generatingBatch ? "Generando PDFs…" : "Generar PDFs"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDownloadZip(false)}
              disabled={generatingBatch || downloadingZip}
            >
              {downloadingZip ? "Preparando ZIP…" : "Descargar PDFs del periodo"}
            </Button>
          </div>
        </div>
      )}

      {showIndividual && (
      <div className={local.filtersPanel}>
        <div className={local.filtersGrid}>
          <label className={local.filterField}>
            <span>Buscar trabajador</span>
            <input
              type="text"
              placeholder="Nombre o cédula"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
            />
          </label>
          <label className={local.filterField}>
            <span>Trabajador *</span>
            <select
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setEligible([]);
                setEligibleMeta(null);
                setSuccess(null);
              }}
            >
              <option value="">Seleccionar…</option>
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.fullName} — {emp.documentNumber} ({emp.entryCount})
                </option>
              ))}
            </select>
          </label>
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
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </div>
        <div className={local.filterActions}>
          <Button type="button" variant="outline" onClick={handlePreview} disabled={loadingEligible}>
            {loadingEligible ? "Filtrando…" : "Filtrar registros"}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerate}
            disabled={generating || eligible.length === 0}
          >
            {generating ? "Generando…" : "Generar e imprimir"}
          </Button>
        </div>
      </div>
      )}

      {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
      {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>}

      {showIndividual && (
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
                    {employeeId
                      ? "Filtra para ver registros aprobados elegibles (aún sin planilla PDF)"
                      : "Selecciona un trabajador y filtra"}
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
                    <td>{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      <section className={local.section}>
        <div className={local.historyHeader}>
          <h3 className={local.sectionTitle}>Planillas PDF generadas</h3>
          <div className={local.historySearch}>
            <label className={local.filterField}>
              <span>Nombre o cédula</span>
              <PdfWorkerSuggest
                workers={historyWorkers}
                value={historyQuery}
                onChange={(value) => {
                  setHistoryQuery(value);
                  setHistoryEmployeeId("");
                }}
                onPick={(worker) => {
                  setHistoryQuery(`${worker.fullName} — ${worker.documentNumber}`);
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
                  <th>Fechas filtro</th>
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
                        {p.dateFrom || p.dateTo
                          ? `${fmtDate(p.dateFrom)} → ${fmtDate(p.dateTo)}`
                          : "Todo el periodo"}
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
