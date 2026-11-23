"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components";
import { fetchPeriod, savePdfCutoff } from "../../api/overtimeApi";
import { formatDateOnly, toDateInputValue } from "../../lib/dateFormat";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "./ParametrosContainer.module.scss";

export default function CortePdfPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cutoff, setCutoff] = useState("");
  const [includedThrough, setIncludedThrough] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    fetchPeriod(year, month)
      .then((period) => {
        if (!active) return;
        setCutoff(toDateInputValue(period?.pdfCutoffDate));
        setIncludedThrough(period?.pdfIncludedThrough ?? null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setCutoff("");
        setIncludedThrough(null);
        setError(e instanceof Error ? e.message : "No se pudo cargar el corte");
      });
    return () => {
      active = false;
    };
  }, [year, month]);

  async function save(next: string | null) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await savePdfCutoff(year, month, next);
      setCutoff(toDateInputValue(saved.pdfCutoffDate));
      setIncludedThrough(saved.pdfIncludedThrough ?? null);
      setMessage(
        saved.pdfCutoffDate
          ? `Corte guardado hasta el ${formatDateOnly(saved.pdfCutoffDate)}.`
          : "Este mes queda sin corte: el PDF incluye todas las fechas aprobadas.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el corte");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.cutoff}>
      <h3 className={styles.cutoffTitle}>Corte de PDFs</h3>
      <p className={styles.intro}>
        Fecha hasta la que puede entrar un registro al generar PDFs de ese mes. Los días
        posteriores quedan aprobados, pero fuera del PDF. Si no hay corte, entra el mes completo.
      </p>
      <PeriodSelector
        year={year}
        month={month}
        hideCounts
        onChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
          setMessage(null);
        }}
      />
      <div className={styles.cutoffRow}>
        <label>
          Incluir hasta
          <input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
        </label>
        <Button type="button" size="sm" disabled={saving || !cutoff} onClick={() => void save(cutoff)}>
          {saving ? "Guardando…" : "Guardar corte"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void save(null)}>
          Mes completo
        </Button>
      </div>
      {includedThrough && (
        <p className={styles.intro}>
          Ya hay PDF con registros hasta el {formatDateOnly(includedThrough)}. El corte no puede
          quedar antes de ese día.
        </p>
      )}
      {message && <p className={styles.cutoffOk}>{message}</p>}
      {error && <p className={styles.cutoffError}>{error}</p>}
    </section>
  );
}
