"use client";

import { useEffect, useMemo, useState } from "react";
import type { TmrRow } from "./api";
import { formatSpan, formatTs } from "./jornada";
import {
  availableMonths,
  buildCrewMonths,
  buildMonthGeneral,
  calendarCells,
  DESP_LARGA_H,
  EJEC_LARGA_H,
  monthLabel,
  type CrewMonth,
  type MonthGeneral,
  type PlaceStat,
} from "./mensual";
import styles from "./TmrMensual.module.scss";

const WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Props {
  rows: TmrRow[];
}

export default function TmrMensual({ rows }: Props) {
  const months = useMemo(() => availableMonths(rows), [rows]);
  const [month, setMonth] = useState(months[0] ?? "");
  const [general, setGeneral] = useState<MonthGeneral | null>(null);
  const [crews, setCrews] = useState<CrewMonth[]>([]);
  const [phase, setPhase] = useState<"panorama" | "brigadas" | "listo">("panorama");
  const [crew, setCrew] = useState("");
  const selected = crews.find((item) => item.crew === crew) ?? crews[0];
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const cells = useMemo(() => (month ? calendarCells(month) : []), [month]);
  const dayRows = pickedDay && selected ? (selected.porDia[pickedDay] ?? []) : [];

  useEffect(() => {
    if (!month) {
      setGeneral(null);
      setCrews([]);
      return;
    }
    let cancel = false;
    setPhase("panorama");
    setCrews([]);
    const first = window.setTimeout(() => {
      if (cancel) return;
      const nextGeneral = buildMonthGeneral(rows, month);
      setGeneral(nextGeneral);
      setPhase("brigadas");
      window.setTimeout(() => {
        if (cancel) return;
        const nextCrews = buildCrewMonths(rows, month);
        setCrews(nextCrews);
        setCrew((current) => nextCrews.some((item) => item.crew === current) ? current : (nextCrews[0]?.crew ?? ""));
        setPhase("listo");
      }, 0);
    }, 0);
    return () => {
      cancel = true;
      window.clearTimeout(first);
    };
  }, [rows, month]);

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Primero el panorama de todas las brigadas (viajes, servicios y lugares con más
        desplazamiento). Debajo, el detalle por brigada. El calendario usa el día de
        ejecución. Un desplazamiento cuenta como largo si supera {DESP_LARGA_H} h; una
        ejecución, si supera {EJEC_LARGA_H} h.
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

      {phase !== "listo" ? (
        <p className={styles.hint}>
          {phase === "panorama" ? "Generando panorama del mes…" : "Cargando brigadas…"}
        </p>
      ) : null}

      {general ? (
        <section className={styles.general}>
          <h3>Panorama del mes</h3>
          <p className={styles.hint}>
            Todas las brigadas UTEN. Desplazamiento = En ruta → en sitio. Ejecución = en
            sitio → completado.
          </p>
          <div className={styles.kpis}>
            <div>
              <strong>{general.actividades}</strong>
              Actividades
            </div>
            <div>
              <strong>{formatSpan(general.despMedio)}</strong>
              Desplazamiento medio
            </div>
            <div>
              <strong>{formatSpan(general.ejecMedio)}</strong>
              Ejecución media
            </div>
            <div>
              <strong>{formatSpan(general.alistMedio)}</strong>
              Alistamiento medio
            </div>
            <div>
              <strong>{formatSpan(general.tmrUtenMedio)}</strong>
              TMR UTEN medio
            </div>
            <div>
              <strong>{general.despLargos.length}</strong>
              Viajes &gt; {DESP_LARGA_H} h
            </div>
            <div>
              <strong>{general.ejecLargas.length}</strong>
              Servicios &gt; {EJEC_LARGA_H} h
            </div>
          </div>

          <div className={styles.split}>
            <Special
              title={`Desplazamientos más largos (> ${DESP_LARGA_H} h)`}
              rows={general.despLargos}
              getValue={(row) => row.tmrDesp}
              showCrew
            />
            <Special
              title={`Ejecuciones más largas (> ${EJEC_LARGA_H} h)`}
              rows={general.ejecLargas}
              getValue={(row) => row.tmrSer}
              showCrew
            />
          </div>

          <div className={styles.split}>
            <PlaceTable
              title="Núcleos con más tiempo de desplazamiento"
              rows={general.nucleos}
            />
            <PlaceTable
              title="Municipios con más tiempo de desplazamiento"
              rows={general.municipios}
            />
          </div>
        </section>
      ) : null}

      <h3 className={styles.blockTitle}>Por brigada</h3>
      {phase !== "listo" ? <p className={styles.hint}>El detalle por brigada se arma después del panorama.</p> : null}
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
        ) : phase === "listo" ? (
          <p className={styles.hint}>No hay brigadas en ese mes.</p>
        ) : null}
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
  showCrew = false,
}: {
  title: string;
  rows: TmrRow[];
  getValue: (row: TmrRow) => number | null;
  showCrew?: boolean;
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
              {showCrew ? <span>{row.crew}</span> : null}
              <span>{row.caseSerial || row.jobSerial}</span>
              <span>{formatTs(row.startTime)}</span>
              <span>{row.municipality || "—"}</span>
              {row.nucleo ? <span>{row.nucleo}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceTable({ title, rows }: { title: string; rows: PlaceStat[] }) {
  return (
    <div className={styles.special}>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className={styles.hint}>Sin datos de ubicación en este mes.</p>
      ) : (
        <div className={styles.placeWrap}>
          <table className={styles.place}>
            <thead>
              <tr>
                <th>Lugar</th>
                <th>Jobs</th>
                <th>Desp. medio</th>
                <th>Ejec. media</th>
                <th>Viajes largos</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.jobs}</td>
                  <td>{formatSpan(row.despMedio)}</td>
                  <td>{formatSpan(row.ejecMedio)}</td>
                  <td>{row.despLargos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
