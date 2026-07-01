"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPeriod, fetchPeriods, type OvertimePeriodDetail } from "../../api/overtimeApi";
import PeriodSelector from "../PeriodSelector/PeriodSelector";
import styles from "../../styles/shared.module.scss";

export default function ResumenContainer() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [detail, setDetail] = useState<OvertimePeriodDetail | null>(null);
  const [recent, setRecent] = useState<{ periodCode: string; status: string }[]>([]);

  useEffect(() => {
    fetchPeriod(year, month).then(setDetail).catch(() => setDetail(null));
  }, [year, month]);

  useEffect(() => {
    fetchPeriods()
      .then((list) => setRecent(list.slice(0, 6).map((p) => ({ periodCode: p.periodCode, status: p.status }))))
      .catch(() => setRecent([]));
  }, []);

  const counts = detail?.entryCounts ?? {};

  return (
    <div>
      <PeriodSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

      {!detail ? (
        <div className={`${styles.alert} ${styles.alertInfo}`}>
          No hay periodo creado para {year}-{String(month).padStart(2, "0")}. Se creará al cargar la primera
          planilla.
        </div>
      ) : (
        <div className={styles.previewSummary}>
          <span>Estado: {detail.status === "OPEN" ? "Abierto" : "Cerrado"}</span>
          <span>Pendientes: {counts.PENDING ?? 0}</span>
          <span>Aprobados: {counts.APPROVED ?? 0}</span>
          <span>Rechazados: {counts.REJECTED ?? 0}</span>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
        <Link href="/dashboard/contabilidad/horas-extra/cargar">Cargar Excel →</Link>
        <Link href="/dashboard/contabilidad/horas-extra/registros">Revisar registros →</Link>
        <Link href="/dashboard/contabilidad/horas-extra/consolidado">Consolidado / cierre →</Link>
      </div>

      {recent.length > 0 && (
        <>
          <h3 style={{ marginTop: "2rem", fontSize: "1rem" }}>Periodos recientes</h3>
          <ul style={{ fontSize: "0.875rem", color: "#475569" }}>
            {recent.map((p) => (
              <li key={p.periodCode}>
                {p.periodCode} — {p.status}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
