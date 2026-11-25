"use client";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import type { TmrRow, TmrSummary } from "./api";
import { kpisByAmbito, type TmrKpis } from "./tmrKpis";
import styles from "./TmrContainer.module.scss";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PIE_COLORS = ["#0f766e", "#b91c1c", "#d97706", "#2563eb", "#64748b", "#7c3aed"];

const PIE_OPTIONS = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { boxWidth: 10, font: { size: 10 }, padding: 6 },
    },
  },
};

function pct(part: number, total: number): string {
  if (!total) return "0 %";
  return `${((part / total) * 100).toFixed(1)} %`;
}

function AmbitoKpis({ title, kpis }: { title: string; kpis: TmrKpis }) {
  return (
    <section className={styles.ambito}>
      <h3>{title}</h3>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{kpis.uten}</strong>
          Jobs UTEN
        </div>
        <div className={styles.stat}>
          <strong>{pct(kpis.r8Frio, kpis.uten)}</strong>
          R{"<"}8 H frío
        </div>
        <div className={styles.stat}>
          <strong>{pct(kpis.r8Validado, kpis.uten)}</strong>
          R{"<"}8 H validado
        </div>
        <div className={styles.stat}>
          <strong>{kpis.cumple}</strong>
          Cumple
        </div>
        <div className={styles.stat}>
          <strong>{kpis.noCumple}</strong>
          No cumple
        </div>
        <div className={styles.stat}>
          <strong>{kpis.cpl}</strong>
          Logística especial
        </div>
        <div className={styles.stat}>
          <strong>{kpis.fhl}</strong>
          Fuera de horario
        </div>
        <div className={styles.stat}>
          <strong>{kpis.sobreasignacion}</strong>
          Sobreasignación
        </div>
        <div className={styles.stat}>
          <strong>{kpis.manual}</strong>
          Validación manual
        </div>
      </div>
    </section>
  );
}

function ExclusionPie({ kpis }: { kpis: TmrKpis }) {
  return (
    <Pie
      data={{
        labels: [
          "Cumple",
          "No cumple",
          "Logística especial",
          "Fuera de horario",
          "Sobreasignación",
          "Validación manual",
        ],
        datasets: [
          {
            data: [
              kpis.cumple,
              kpis.noCumple,
              kpis.cpl,
              kpis.fhl,
              kpis.sobreasignacion,
              kpis.manual,
            ],
            backgroundColor: PIE_COLORS,
          },
        ],
      }}
      options={PIE_OPTIONS}
    />
  );
}

interface Props {
  rows: TmrRow[];
  summary: TmrSummary;
  editedCount: number;
  onOpenReglas: () => void;
}

export default function TmrEstadistica({ rows, summary, editedCount, onOpenReglas }: Props) {
  const kpis = kpisByAmbito(rows);
  return (
    <>
      <div className={styles.ambitoGrid3}>
        <AmbitoKpis title="General" kpis={kpis.general} />
        <AmbitoKpis title="Rural" kpis={kpis.rural} />
        <AmbitoKpis title="Urbano" kpis={kpis.urbano} />
        {kpis.otro.uten > 0 ? <AmbitoKpis title="Sin rural/urbano" kpis={kpis.otro} /> : null}
      </div>
      <p className={styles.ambitoNote}>
        {summary.uten} jobs UTEN en total
        {editedCount ? ` · ${editedCount} editadas en esta sesión` : ""}. El general suma rural y
        urbano; debajo van por separado.
      </p>

      <div className={styles.chartsCompact}>
        <div className={styles.chart}>
          <div className={styles.chartHead}>
            <h3>Exclusión · General</h3>
            <button type="button" className={styles.chartLink} onClick={onOpenReglas}>
              Ver reglas
            </button>
          </div>
          <div className={styles.chartBox}>
            <ExclusionPie kpis={kpis.general} />
          </div>
        </div>
        <div className={styles.chart}>
          <h3>Exclusión · Rural</h3>
          <div className={styles.chartBox}>
            <ExclusionPie kpis={kpis.rural} />
          </div>
        </div>
        <div className={styles.chart}>
          <h3>Exclusión · Urbano</h3>
          <div className={styles.chartBox}>
            <ExclusionPie kpis={kpis.urbano} />
          </div>
        </div>
        <div className={styles.chartWide}>
          <h3>R{"<"}8 / R{">"}8 por ubicación</h3>
          <div className={styles.chartBoxWide}>
            <Bar
              data={{
                labels: summary.byUbicacion.map((item) => item.ubicacion),
                datasets: [
                  {
                    label: "R<8 H",
                    data: summary.byUbicacion.map((item) => item.r8),
                    backgroundColor: "#0f766e",
                  },
                  {
                    label: "R>8 H",
                    data: summary.byUbicacion.map((item) => item.rOver),
                    backgroundColor: "#b91c1c",
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
                },
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
