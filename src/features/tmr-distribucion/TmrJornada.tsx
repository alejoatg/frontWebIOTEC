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
import {
  crewDayStats,
  crewMonths,
  crewsWithDays,
  formatClock,
  formatSpan,
  formatTs,
  jornadaRows,
  jornadaTotals,
  possibleExclusionReason,
  TMR_ALERT_H,
  TMR_WATCH_H,
} from "./jornada";
import { calendarCells, monthLabel } from "./mensual";
import styles from "./TmrJornada.module.scss";

const WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TIMES = [
  { key: "startTime", label: "Start", icon: Flag },
  { key: "assignedAt", label: "Asignación", icon: UserPlus },
  { key: "enRouteAt", label: "En ruta", icon: Navigation },
  { key: "arrivedSiteAt", label: "En sitio", icon: MapPin },
  { key: "completedAt", label: "Completado", icon: CheckCircle2 },
] as const;

interface Props {
  rows: TmrRow[];
  onOpen?: (row: TmrRow) => void;
}

export default function TmrJornada({ rows, onOpen }: Props) {
  const crews = useMemo(() => crewsWithDays(rows), [rows]);
  const [crew, setCrew] = useState(crews[0]?.crew ?? "");
  const selectedCrew = crews.find((item) => item.crew === crew) ?? crews[0];
  const months = useMemo(
    () => (selectedCrew ? crewMonths(rows, selectedCrew.crew) : []),
    [rows, selectedCrew],
  );
  const [month, setMonth] = useState(months[0] ?? "");
  const monthSafe = months.includes(month) ? month : (months[0] ?? "");
  const stats = useMemo(
    () => (selectedCrew && monthSafe ? crewDayStats(rows, selectedCrew.crew, monthSafe) : {}),
    [rows, selectedCrew, monthSafe],
  );
  const cells = useMemo(() => (monthSafe ? calendarCells(monthSafe) : []), [monthSafe]);
  const [day, setDay] = useState(selectedCrew?.days[0]?.key ?? "");
  const workDays = Object.keys(stats).sort();
  const daySafe =
    day && monthSafe && day.startsWith(`${monthSafe}-`)
      ? day
      : (workDays[0] ?? "");
  const items = useMemo(
    () => (selectedCrew && daySafe ? jornadaRows(rows, selectedCrew.crew, daySafe) : []),
    [rows, selectedCrew, daySafe],
  );
  const totals = jornadaTotals(items);
  const dayStat = stats[daySafe];

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        El calendario muestra el mes de la brigada: actividades por día, TMR UTEN medio y
        semáforo (verde ≤ {TMR_WATCH_H} h, ámbar si hay TMR altos, rojo si el promedio supera{" "}
        {TMR_ALERT_H} h o hay 2 o más R{">"}8). Pulse un día y luego una actividad para el
        detalle.
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
                    const nextMonths = crewMonths(rows, item.crew);
                    setMonth(nextMonths[0] ?? "");
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
        <div className={styles.calWrap}>
          <div className={styles.calBar}>
            <h3>Calendario de la brigada</h3>
            {months.length > 1 ? (
              <select
                value={monthSafe}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setDay("");
                }}
              >
                {months.map((item) => (
                  <option key={item} value={item}>
                    {monthLabel(item)}
                  </option>
                ))}
              </select>
            ) : (
              <span>{monthSafe ? monthLabel(monthSafe) : ""}</span>
            )}
          </div>
          <div className={styles.calHead}>
            {WEEK.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className={styles.cal}>
            {cells.map((cell, index) => {
              if (!cell) return <div key={`e-${index}`} className={styles.empty} />;
              const stat = stats[cell.key];
              const tone =
                stat?.tone === "alert"
                  ? styles.alert
                  : stat?.tone === "watch"
                    ? styles.watch
                    : stat?.tone === "ok"
                      ? styles.ok
                      : styles.idle;
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`${tone} ${daySafe === cell.key ? styles.dayOn : ""}`}
                  onClick={() => setDay(cell.key)}
                >
                  <span>{cell.day}</span>
                  {stat ? (
                    <>
                      <strong>{stat.count} act.</strong>
                      <small>{stat.tmrMedio != null ? `${stat.tmrMedio.toFixed(1)} h` : "—"}</small>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className={styles.legend}>
            <span className={styles.ok}>TMR medio ≤ {TMR_WATCH_H} h</span>
            <span className={styles.watch}>TMR alto o promedio &gt; {TMR_WATCH_H} h</span>
            <span className={styles.alert}>Promedio &gt; {TMR_ALERT_H} h o 2+ R{">"}8</span>
          </div>
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
              <strong>{formatClock(totals.inicio)}</strong>
              Inicio jornada (primer desplazamiento)
              <small>{formatTs(totals.inicio)}</small>
            </div>
            <div>
              <strong>{formatClock(totals.fin)}</strong>
              Fin jornada (último cierre)
              <small>{formatTs(totals.fin)}</small>
            </div>
            <div>
              <strong>{formatSpan(totals.trabajo)}</strong>
              Jornada (primer desplazamiento → último cierre)
            </div>
            <div>
              <strong>{formatSpan(totals.tmrUten)}</strong>
              Suma TMR UTEN
            </div>
            <div>
              <strong>{totals.sobre}</strong>
              Con sobreasignación
            </div>
            <div>
              <strong>{dayStat ? `${dayStat.count}` : "0"}</strong>
              Actividades en el día
            </div>
            <div>
              <strong>{dayStat?.tmrMedio != null ? `${dayStat.tmrMedio.toFixed(1)} h` : "—"}</strong>
              TMR UTEN medio del día
            </div>
          </div>

          <ol className={styles.bitacora}>
            {items.map((row, index) => {
              const exclusionReason = possibleExclusionReason(row);
              return (
              <li
                key={row.id}
                className={onOpen ? `${styles.card} ${styles.clickCard}` : styles.card}
                onClick={onOpen ? () => onOpen(row) : undefined}
              >
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
                    <dt>TMR CEO</dt>
                    <dd>{formatSpan(row.tmrDuracion)}</dd>
                  </div>
                  <div>
                    <dt>TMR UTEN</dt>
                    <dd>{formatSpan(row.tmrDuracionUten)}</dd>
                  </div>
                </dl>
                {exclusionReason ? (
                  <p className={styles.reason}>
                    <strong>Posible exclusión. </strong>
                    {exclusionReason}
                  </p>
                ) : null}

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
              );
            })}
          </ol>
        </>
      ) : (
        <p className={styles.hint}>No hay actividades para esa brigada y día.</p>
      )}
    </div>
  );
}
