"use client";

import { useMemo } from "react";
import type { TmrRow } from "./api";
import {
  formatClock,
  formatSpan,
  formatTs,
  jornadaContexto,
  muestraJornadaNoCumple,
} from "./jornada";
import styles from "./TmrJornadaContexto.module.scss";

interface Props {
  row: TmrRow;
  rows: TmrRow[];
  onOpenOrder?: (id: string) => void;
}

export default function TmrJornadaContexto({ row, rows, onOpenOrder }: Props) {
  const dias = useMemo(() => jornadaContexto(rows, row), [rows, row]);
  if (!muestraJornadaNoCumple(row) || !dias.length) return null;

  const overnight = dias.length > 1;

  return (
    <aside className={styles.side}>
      <header className={styles.head}>
        <h3>Jornada de la brigada</h3>
        <p>
          {row.crew || "Sin brigada"}
          {overnight
            ? " · la orden cruzó de un día al otro; se muestran ambos."
            : " · mismo día del TMR."}
        </p>
      </header>

      {dias.map((dia) => (
        <section key={dia.key} className={styles.day}>
          <h4>{dia.label}</h4>
          <ol className={styles.timeline}>
            <li className={styles.marker}>
              <span>Inicio de jornada · primer desplazamiento</span>
              <strong>{formatClock(dia.inicio)}</strong>
              <small>{formatTs(dia.inicio)}</small>
            </li>
            {dia.ordenes.map((orden, index) => {
              const current = orden.id === row.id;
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
                    {orden.exclusion ? (
                      <p className={styles.excl}>{orden.exclusion}</p>
                    ) : null}
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
      ))}
    </aside>
  );
}
