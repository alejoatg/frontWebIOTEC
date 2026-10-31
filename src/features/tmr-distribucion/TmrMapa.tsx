"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { TmrRow } from "./api";
import { formatSpan, formatTs } from "./jornada";
import { availableMonths, monthLabel } from "./mensual";
import { buildMapPoints, type MapLevel, type MapMetric } from "./mapa";
import styles from "./TmrMapa.module.scss";

const TmrMapaCanvas = dynamic(() => import("./TmrMapaCanvas"), {
  ssr: false,
  loading: () => <p className={styles.hint}>Cargando mapa…</p>,
});

const METRIC_LABEL: Record<MapMetric, string> = {
  desp: "Desplazamiento medio",
  ejec: "Ejecución media",
  tmr: "TMR UTEN medio",
  jobs: "Cantidad de jobs",
};

const LEGEND_HOURS = [
  { color: "#0f766e", text: "≤ 0,75 h" },
  { color: "#65a30d", text: "≤ 1,5 h" },
  { color: "#ca8a04", text: "≤ 2 h" },
  { color: "#ea580c", text: "≤ 3 h" },
  { color: "#b91c1c", text: "> 3 h" },
];

const LEGEND_JOBS = [
  { color: "#0f766e", text: "≤ 50" },
  { color: "#65a30d", text: "≤ 150" },
  { color: "#ca8a04", text: "≤ 300" },
  { color: "#ea580c", text: "≤ 600" },
  { color: "#b91c1c", text: "> 600" },
];

interface Props {
  rows: TmrRow[];
}

export default function TmrMapa({ rows }: Props) {
  const months = useMemo(() => availableMonths(rows), [rows]);
  const [month, setMonth] = useState(months[0] ?? "");
  const [level, setLevel] = useState<MapLevel>("municipio");
  const [metric, setMetric] = useState<MapMetric>("desp");
  const [selected, setSelected] = useState<string | null>(null);

  const { points, unmatched } = useMemo(
    () => (month ? buildMapPoints(rows, month, level) : { points: [], unmatched: [] }),
    [rows, month, level],
  );
  const current = points.find((item) => item.key === selected) ?? points[0] ?? null;

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Mapa OpenStreetMap con centros de municipio y núcleo. El color sigue el indicador
        elegido; el tamaño del círculo, la cantidad de jobs. Sin licencia de Google Maps.
      </p>

      <div className={styles.toolbar}>
        <label>
          Mes
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setSelected(null);
            }}
          >
            {months.map((item) => (
              <option key={item} value={item}>
                {monthLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Agrupar
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value as MapLevel);
              setSelected(null);
            }}
          >
            <option value="municipio">Municipio</option>
            <option value="nucleo">Núcleo</option>
          </select>
        </label>
        <label>
          Color
          <select value={metric} onChange={(e) => setMetric(e.target.value as MapMetric)}>
            <option value="desp">Desplazamiento</option>
            <option value="ejec">Ejecución</option>
            <option value="tmr">TMR UTEN</option>
            <option value="jobs">Cantidad de jobs</option>
          </select>
        </label>
      </div>

      <div className={styles.layout}>
        <div className={styles.mapBox}>
          <TmrMapaCanvas
            points={points}
            metric={metric}
            selected={current?.key ?? null}
            onSelect={setSelected}
          />
          <div className={styles.legend}>
            <strong>{METRIC_LABEL[metric]}</strong>
            {(metric === "jobs" ? LEGEND_JOBS : LEGEND_HOURS).map((item) => (
              <div key={item.text} className={styles.swatch}>
                <i style={{ background: item.color }} />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.side}>
          <div className={styles.kpis}>
            <div>
              <strong>{points.length}</strong>
              En el mapa
            </div>
            <div>
              <strong>{unmatched.length}</strong>
              Sin coordenadas
            </div>
          </div>

          <div className={styles.list}>
            <h3>Ranking por desplazamiento</h3>
            <ul>
              {points.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={item.key === current?.key ? styles.on : undefined}
                    onClick={() => setSelected(item.key)}
                  >
                    <strong>{item.name}</strong>
                    <span>{formatSpan(item.despMedio)}</span>
                    <span>{item.jobs} jobs</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {unmatched.length ? (
            <p className={styles.warn}>Sin catálogo: {unmatched.join(", ")}</p>
          ) : null}

          {current ? (
            <div className={styles.detail}>
              <h3>
                {current.name}
                {current.subtitle && current.subtitle !== current.name ? ` · ${current.subtitle}` : ""}
              </h3>
              <div className={styles.kpis}>
                <div>
                  <strong>{current.jobs}</strong>
                  Jobs
                </div>
                <div>
                  <strong>{formatSpan(current.despMedio)}</strong>
                  Desp. medio
                </div>
                <div>
                  <strong>{formatSpan(current.ejecMedio)}</strong>
                  Ejec. media
                </div>
                <div>
                  <strong>{formatSpan(current.tmrUtenMedio)}</strong>
                  TMR UTEN
                </div>
                <div>
                  <strong>{current.despLargos}</strong>
                  Viajes largos
                </div>
                <div>
                  <strong>{current.source === "catalogo" ? "Catálogo" : "Derivado"}</strong>
                  Coordenadas
                </div>
              </div>
              <ul>
                {current.rows.slice(0, 10).map((row) => (
                  <li key={row.id}>
                    <strong>{row.caseSerial || row.jobSerial}</strong>
                    <span>{row.crew}</span>
                    <span>{formatTs(row.startTime)}</span>
                    <span>Desp. {formatSpan(row.tmrDesp)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className={styles.hint}>No hay puntos georreferenciados en este mes.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
