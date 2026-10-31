"use client";

import { useMemo, useState } from "react";
import type { TmrRow } from "./api";
import { formatSpan, formatTs } from "./jornada";
import {
  availableMonths,
  buildCrewMonths,
  calendarCells,
  DESP_LARGA_H,
  EJEC_LARGA_H,
  monthLabel,
  type CrewMonth,
} from "./mensual";
import styles from "./TmrMensual.module.scss";

const WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Props {
  rows: TmrRow[];
}

export default function TmrMensual({ rows }: Props) {
  const months = useMemo(() => availableMonths(rows), [rows]);
  const [month, setMonth] = useState(months[0] ?? "");
  const crews = useMemo(() => (month ? buildCrewMonths(rows, month) : []), [rows, month]);
  const [crew, setCrew] = useState(crews[0]?.crew ?? "");
  const selected = crews.find((item) => item.crew === crew) ?? crews[0];
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const cells = useMemo(() => (month ? calendarCells(month) : []), [month]);
  const dayRows = pickedDay && selected ? (selected.porDia[pickedDay] ?? []) : [];

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Estadísticas por brigada en el mes. El calendario usa el día de ejecución. Un
        desplazamiento cuenta como largo si supera {DESP_LARGA_H} h; una ejecución, si
        supera {EJEC_LARGA_H} h.
      </p>

      <div className={styles.toolbar}>
        <label>
          Mes
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPickedDay(null);
            }}
          >
            {months.map((item) => (
              <option key={item} value={item}>
                {monthLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          <h3>Brigadas</h3>
          <ul>
            {crews.map((item) => (
              <li key={item.crew}>
                <button
                  type="button"
                  className={item.crew === selected?.crew ? styles.on : undefined}
                  onClick={() => {
                    setCrew(item.crew);
                    setPickedDay(null);
                  }}
                >
                  <strong>{item.crew}</strong>
                  <span>{item.actividades} act.</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selected ? (
          <div className={styles.main}>
            <Kpis item={selected} />
            <section>
              <h3>Calendario de actividades</h3>
              <div className={styles.calHead}>
                {WEEK.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className={styles.cal}>
                {cells.map((cell, index) => {
                  if (!cell) return <div key={`e-${index}`} className={styles.empty} />;
                  const n = selected.porDia[cell.key]?.length ?? 0;
                  const tone = n === 0 ? styles.idle : n >= 5 ? styles.hot : styles.work;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className={`${tone} ${pickedDay === cell.key ? styles.dayOn : ""}`}
                      onClick={() => setPickedDay(pickedDay === cell.key ? null : cell.key)}
                    >
                      <span>{cell.day}</span>
                      {n ? <strong>{n}</strong> : null}
                    </button>
                  );
                })}
              </div>
              {pickedDay ? (
                <div className={styles.dayDetail}>
                  <p>
                    {dayRows.length} actividad{dayRows.length === 1 ? "" : "es"} el {pickedDay}
                  </p>
                  <ul>
                    {dayRows.map((row) => (
                      <li key={row.id}>
                        <strong>{row.caseSerial || row.jobSerial}</strong>
                        <span>{formatTs(row.startTime)}</span>
                        <span>{row.municipality || "—"}</span>
                        <span>{row.workType || "sin tipo"}</span>
                        <span>TMR {formatSpan(row.tmrDuracionUten)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className={styles.hint}>Pulse un día con actividades para ver el detalle.</p>
              )}
            </section>

            <section className={styles.split}>
              <Special
                title={`Desplazamientos largos (> ${DESP_LARGA_H} h)`}
                rows={selected.despLargos}
                getValue={(row) => row.tmrDesp}
              />
              <Special
                title={`Ejecuciones largas (> ${EJEC_LARGA_H} h)`}
                rows={selected.ejecLargas}
                getValue={(row) => row.tmrSer}
              />
            </section>
          </div>
        ) : (
          <p className={styles.hint}>No hay brigadas en ese mes.</p>
        )}
      </div>
    </div>
  );
}

function Kpis({ item }: { item: CrewMonth }) {
  return (
    <div className={styles.kpis}>
      <div>
        <strong>{item.actividades}</strong>
        Actividades en el mes
      </div>
      <div>
        <strong>{item.diasConTrabajo}</strong>
        Días con trabajo
      </div>
      <div>
        <strong>{item.promedioPorDia.toFixed(1)}</strong>
        Promedio act. / día
      </div>
      <div>
        <strong>{formatSpan(item.ejecMedio)}</strong>
        Duración media (servicio)
      </div>
      <div>
        <strong>{formatSpan(item.despMedio)}</strong>
        Desplazamiento medio
      </div>
      <div>
        <strong>{formatSpan(item.alistMedio)}</strong>
        Alistamiento medio
      </div>
      <div>
        <strong>{formatSpan(item.tmrUtenMedio)}</strong>
        TMR UTEN medio
      </div>
      <div>
        <strong>{formatSpan(item.tmrFrioMedio)}</strong>
        TMR frío medio
      </div>
      <div>
        <strong>
          {item.r8}/{item.actividades}
        </strong>
        R{"<"}8 H
      </div>
      <div>
        <strong>{item.cumple}</strong>
        Cumple
      </div>
      <div>
        <strong>{item.noCumple}</strong>
        No cumple
      </div>
      <div>
        <strong>{item.cpl}</strong>
        CPL
      </div>
      <div>
        <strong>{item.fhl}</strong>
        FHL
      </div>
      <div>
        <strong>{item.sobre}</strong>
        Sobreasignación
      </div>
    </div>
  );
}

function Special({
  title,
  rows,
  getValue,
}: {
  title: string;
  rows: TmrRow[];
  getValue: (row: TmrRow) => number | null;
}) {
  return (
    <div className={styles.special}>
      <h3>
        {title} <span>{rows.length}</span>
      </h3>
      {rows.length === 0 ? (
        <p className={styles.hint}>Ninguno en este mes.</p>
      ) : (
        <ul>
          {rows.slice(0, 12).map((row) => (
            <li key={row.id}>
              <strong>{formatSpan(getValue(row))}</strong>
              <span>{row.caseSerial || row.jobSerial}</span>
              <span>{formatTs(row.startTime)}</span>
              <span>{row.municipality || "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
