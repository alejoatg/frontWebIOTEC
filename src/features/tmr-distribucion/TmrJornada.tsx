"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Flag,
  MapPin,
  Navigation,
  UserPlus,
  Wrench,
} from "lucide-react";
import type { TmrRow } from "./api";
import { crewsWithDays, formatClock, formatSpan, formatTs, jornadaRows, jornadaTotals } from "./jornada";
import styles from "./TmrJornada.module.scss";

const TIMES = [
  { key: "startTime", label: "Start", icon: Flag },
  { key: "assignedAt", label: "Asignación", icon: UserPlus },
  { key: "enRouteAt", label: "En ruta", icon: Navigation },
  { key: "arrivedSiteAt", label: "En sitio", icon: MapPin },
  { key: "completedAt", label: "Completado", icon: CheckCircle2 },
] as const;

interface Props {
  rows: TmrRow[];
}

export default function TmrJornada({ rows }: Props) {
  const crews = useMemo(() => crewsWithDays(rows), [rows]);
  const [crew, setCrew] = useState(crews[0]?.crew ?? "");
  const selectedCrew = crews.find((item) => item.crew === crew) ?? crews[0];
  const [day, setDay] = useState(selectedCrew?.days[0]?.key ?? "");
  const daySafe = selectedCrew?.days.some((item) => item.key === day)
    ? day
    : (selectedCrew?.days[0]?.key ?? "");
  const items = useMemo(
    () => (selectedCrew && daySafe ? jornadaRows(rows, selectedCrew.crew, daySafe) : []),
    [rows, selectedCrew, daySafe],
  );
  const totals = jornadaTotals(items);

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Elija brigada y día de ejecución (En-Route; si no hay, Start). La bitácora ordena las
        actividades de esa jornada.
      </p>
      <div className={styles.pickers}>
        <div className={styles.list}>
          <h3>Brigadas</h3>
          <ul>
            {crews.map((item) => (
              <li key={item.crew}>
                <button
                  type="button"
                  className={item.crew === selectedCrew?.crew ? styles.on : undefined}
                  onClick={() => {
                    setCrew(item.crew);
                    setDay(item.days[0]?.key ?? "");
                  }}
                >
                  <strong>{item.crew}</strong>
                  <span>
                    {item.days.length} día{item.days.length === 1 ? "" : "s"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.list}>
          <h3>Días</h3>
          <ul>
            {(selectedCrew?.days ?? []).map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={item.key === daySafe ? styles.on : undefined}
                  onClick={() => setDay(item.key)}
                >
                  <strong>{item.label}</strong>
                  <span>
                    {item.count} actividad{item.count === 1 ? "" : "es"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedCrew && daySafe ? (
        <>
          <div className={styles.summary}>
            <div>
              <strong>{totals.count}</strong>
              Actividades
            </div>
            <div>
              <strong>{formatSpan(totals.trabajo)}</strong>
              Jornada (primera ruta → último cierre)
            </div>
            <div>
              <strong>{formatSpan(totals.tmrUten)}</strong>
              Suma TMR UTEN
            </div>
            <div>
              <strong>{totals.sobre}</strong>
              Con sobreasignación
            </div>
          </div>

          <ol className={styles.bitacora}>
            {items.map((row, index) => (
              <li key={row.id} className={styles.card}>
                <header>
                  <span className={styles.seq}>{index + 1}</span>
                  <div>
                    <h4>
                      Actividad {index + 1} · orden {row.caseSerial || row.jobSerial}
                    </h4>
                    <p>
                      {row.municipality || "Sin municipio"}
                      {row.ubicacion ? ` · ${row.ubicacion}` : ""}
                      {row.exclusion ? ` · ${row.exclusion}` : ""}
                    </p>
                  </div>
                </header>

                <div className={styles.times}>
                  {TIMES.map((item) => {
                    const Icon = item.icon;
                    const value = row[item.key];
                    return (
                      <div key={item.key} className={value ? styles.time : styles.timeEmpty}>
                        <Icon size={16} aria-hidden />
                        <span>{item.label}</span>
                        <strong>{formatClock(value)}</strong>
                        <small>{formatTs(value)}</small>
                      </div>
                    );
                  })}
                </div>

                <dl className={styles.spans}>
                  <div>
                    <dt>Alistamiento</dt>
                    <dd>{formatSpan(row.tmrAlist)}</dd>
                  </div>
                  <div>
                    <dt>Desplazamiento</dt>
                    <dd>{formatSpan(row.tmrDesp)}</dd>
                  </div>
                  <div>
                    <dt>Servicio</dt>
                    <dd>{formatSpan(row.tmrSer)}</dd>
                  </div>
                  <div>
                    <dt>TMR UTEN</dt>
                    <dd>{formatSpan(row.tmrDuracionUten)}</dd>
                  </div>
                </dl>

                <div className={styles.detail}>
                  <p>
                    <ClipboardList size={15} aria-hidden />
                    <span>
                      <strong>Tipo de trabajo. </strong>
                      {row.workType || "Sin tipo"}
                      {row.circuitCode ? ` · circuito ${row.circuitCode}` : ""}
                      {row.location ? ` · ${row.location}` : ""}
                    </span>
                  </p>
                  <p>
                    <Wrench size={15} aria-hidden />
                    <span>
                      <strong>Daño / causa. </strong>
                      {row.cause || "Sin causa"}
                      {row.caseDescription ? ` — ${row.caseDescription}` : ""}
                    </span>
                  </p>
                  {row.ticketDescription ? (
                    <p className={styles.ticket}>{row.ticketDescription}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className={styles.hint}>No hay actividades para esa brigada y día.</p>
      )}
    </div>
  );
}
