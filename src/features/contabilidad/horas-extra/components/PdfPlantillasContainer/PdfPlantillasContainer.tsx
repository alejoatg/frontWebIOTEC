"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components";
import {
  createPdfPlantilla,
  fetchPdfPlantillaEligible,
  fetchPdfPlantillaEmployees,
  fetchPdfPlantillas,
  pdfPlantillaPrintPageUrl,
  type OvertimeEntryRow,
  type PdfPlantilla,
  type PdfPlantillaEmployee,
} from "../../api/overtimeApi";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";
import local from "./PdfPlantillasContainer.module.scss";
import { formatClockTime } from "../../lib/timeFormat";

function fmtMoney(n: number | undefined) {
  return (n ?? 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export default function PdfPlantillasContainer() {
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
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setEmployeeId("");
    setEligible([]);
    setEligibleMeta(null);
    setDateFrom("");
    setDateTo("");
    setSuccess(null);
  }, [loadHistory]);

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

  function handleRedownload(p: PdfPlantilla) {
    setError(null);
    window.open(pdfPlantillaPrintPageUrl(p.id, true), "_blank", "noopener,noreferrer");
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

      {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
      {success && <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>}

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
                <th>Total $</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {eligible.length === 0 ? (
                <tr>
                  <td colSpan={7}>
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
                    <td>{fmtMoney(row.amountTotal)}</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={local.section}>
        <h3 className={local.sectionTitle}>Planillas PDF generadas</h3>
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
                {plantillas.length === 0 ? (
                  <tr>
                    <td colSpan={8}>Sin planillas PDF en este periodo</td>
                  </tr>
                ) : (
                  plantillas.map((p) => (
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRedownload(p)}
                        >
                          Imprimir / PDF
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
