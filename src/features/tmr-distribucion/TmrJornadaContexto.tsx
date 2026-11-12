"use client";

import { useEffect, useMemo, useState } from "react";
import type { TmrRow } from "./api";
import {
  formatClock,
  formatSpan,
  formatTs,
  jornadaContexto,
  muestraJornadaContexto,
  muestraJornadaLogistica,
  type JornadaDiaResumen,
} from "./jornada";
import styles from "./TmrJornadaContexto.module.scss";

interface Props {
  row: TmrRow;
  rows: TmrRow[];
  onOpenOrder?: (id: string) => void;
}

export default function TmrJornadaContexto({ row, rows, onOpenOrder }: Props) {
  const dias = useMemo(() => jornadaContexto(rows, row), [rows, row]);
  const logistica = muestraJornadaLogistica(row);
  const useTabs = logistica || dias.length > 1;
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setTab(0);
  }, [row.id]);

  if (!muestraJornadaContexto(row) || !dias.length) return null;

  const tabSafe = Math.min(tab, dias.length - 1);
  const visible = useTabs ? [dias[tabSafe]] : dias;
  const overnight = dias.length > 1;

  return (
    <aside className={styles.side}>
      <header className={styles.head}>
        <h3>Jornada de la brigada</h3>
        <p>
          {row.crew || "Sin brigada"}
          {logistica
            ? overnight
              ? " · logística especial: En ruta al día siguiente."
              : " · logística especial."
            : overnight
              ? " · la orden cruzó de un día al otro."
              : " · mismo día del TMR."}
        </p>
      </header>

      {useTabs && dias.length > 1 ? (
        <div className={styles.tabs} role="tablist" aria-label="Días de la jornada">
          {dias.map((dia, index) => (
            <button
              key={dia.key}
              type="button"
              role="tab"
              aria-selected={index === tabSafe}
              className={index === tabSafe ? styles.tabOn : styles.tab}
              onClick={() => setTab(index)}
            >
              Día {index + 1}
              <span>{dia.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {visible.map((dia) => (
        <DayDetail
          key={dia.key}
          dia={dia}
          currentId={row.id}
          showTitle={!useTabs || dias.length === 1}
          onOpenOrder={onOpenOrder}
        />
      ))}
    </aside>
  );
}

function DayDetail({
  dia,
  currentId,
  showTitle,
  onOpenOrder,
}: {
  dia: JornadaDiaResumen;
  currentId: string;
  showTitle: boolean;
  onOpenOrder?: (id: string) => void;
}) {
  return (
    <section className={styles.day}>
      {showTitle ? <h4>{dia.label}</h4> : null}
      <ol className={styles.timeline}>
        <li className={styles.marker}>
          <span>Inicio de jornada · primer desplazamiento</span>
          <strong>{formatClock(dia.inicio)}</strong>
          <small>{formatTs(dia.inicio)}</small>
        </li>
        {dia.ordenes.map((orden, index) => {
          const current = orden.id === currentId;
          return (
            <li key={orden.id}>
              <button
                type="button"
                className={current ? styles.current : styles.order}
                onClick={() => onOpenOrder?.(orden.id)}
              >
                <p className={styles.orderTitle}>
                  Orden {index + 1}
                  {current ? " · esta orden" : ""}
                </p>
                <p className={styles.meta}>
                  job {orden.jobSerial || "—"}
                  {orden.caseSerial ? ` · caso ${orden.caseSerial}` : ""}
                  {orden.municipality ? ` · ${orden.municipality}` : ""}
                </p>
                <dl className={styles.times}>
                  <div>
                    <dt>Start</dt>
                    <dd>{formatClock(orden.startTime)}</dd>
                  </div>
                  <div>
                    <dt>En ruta</dt>
                    <dd>{formatClock(orden.enRouteAt)}</dd>
                  </div>
                  <div>
                    <dt>En sitio</dt>
                    <dd>{formatClock(orden.arrivedSiteAt)}</dd>
                  </div>
                  <div>
                    <dt>Completado</dt>
                    <dd>{formatClock(orden.completedAt)}</dd>
                  </div>
                </dl>
                <p className={styles.spans}>
                  Alist. {formatSpan(orden.tmrAlist)} · Desp. {formatSpan(orden.tmrDesp)} · Ser.{" "}
                  {formatSpan(orden.tmrSer)} · TMR CEO {formatSpan(orden.tmrDuracion)} · TMR UTEN{" "}
                  {formatSpan(orden.tmrDuracionUten)}
                </p>
                {orden.exclusion ? <p className={styles.excl}>{orden.exclusion}</p> : null}
                {orden.observacion ? (
                  <p className={styles.obs}>
                    <strong>Observación. </strong>
                    {orden.observacion}
                  </p>
                ) : (
                  <p className={styles.obsMuted}>Sin observación</p>
                )}
              </button>
            </li>
          );
        })}
        <li className={styles.marker}>
          <span>Fin de jornada · último cierre</span>
          <strong>{formatClock(dia.fin)}</strong>
          <small>{formatTs(dia.fin)}</small>
        </li>
      </ol>
    </section>
  );
}
