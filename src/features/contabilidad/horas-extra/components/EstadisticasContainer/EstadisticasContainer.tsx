"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Line, Bar } from "react-chartjs-2";
import { Button } from "@/components";
import HorasExtraNav from "../HorasExtraNav/HorasExtraNav";
import BolsaHorasChart from "./BolsaHorasChart";
import BolsaHorasTable from "./BolsaHorasTable";
import styles from "./EstadisticasContainer.module.scss";

// Registrar componentes de Chart.js
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function EstadisticasContainer() {
  const [period] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Datos de ejemplo - Bolsa de presupuesto por proceso
  // Meta mensual total: $40,000,000 distribuida proporcionalmente
  const budgetData = [
    {
      processName: "AT (Alta Tensión)",
      budgetAmount: 12_000_000, // 30%
      consumedAmount: 10_400_000,
      budgetHours: 600,
      consumedHours: 520,
    },
    {
      processName: "ST (Subestaciones)",
      budgetAmount: 10_000_000, // 25%
      consumedAmount: 7_600_000,
      budgetHours: 500,
      consumedHours: 380,
    },
    {
      processName: "Distribución",
      budgetAmount: 9_000_000, // 22.5%
      consumedAmount: 5_800_000,
      budgetHours: 450,
      consumedHours: 290,
    },
    {
      processName: "Comercial",
      budgetAmount: 5_000_000, // 12.5%
      consumedAmount: 3_600_000,
      budgetHours: 300,
      consumedHours: 180,
    },
    {
      processName: "Gerencia",
      budgetAmount: 2_500_000, // 6.25%
      consumedAmount: 2_400_000,
      budgetHours: 200,
      consumedHours: 120,
    },
    {
      processName: "Administrativo",
      budgetAmount: 1_500_000, // 3.75%
      consumedAmount: 1_200_000,
      budgetHours: 150,
      consumedHours: 90,
    },
  ];

  // Datos de ejemplo - Pie Chart
  const pieData = {
    labels: ["TSD", "TSN", "HEDD", "HEND", "RD", "RN"],
    datasets: [
      {
        label: "Horas por categoría",
        data: [450, 280, 120, 90, 60, 40],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(99, 102, 241, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(251, 146, 60, 0.8)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(99, 102, 241, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(251, 146, 60, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Datos de ejemplo - Line Chart
  const lineData = {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    datasets: [
      {
        label: "Horas extra semanales",
        data: [320, 410, 380, 450],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
      },
    ],
  };

  // Datos de ejemplo - Bar Chart
  const barData = {
    labels: ["AT", "ST", "Distribución", "Comercial", "Gerencia", "Administrativo"],
    datasets: [
      {
        label: "Horas por proceso",
        data: [520, 380, 290, 180, 120, 90],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <div>
      <HorasExtraNav />

      <div className={styles.header}>
        <h2 className={styles.title}>
          Estadísticas de tiempo suplementario — {period.month}/{period.year}
        </h2>
        <div className={styles.actions}>
          <Button type="button" variant="outline" size="sm">
            Cambiar periodo
          </Button>
          <Button type="button" variant="outline" size="sm">
            Exportar reporte
          </Button>
        </div>
      </div>

      <div className={styles.bolsaSection}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Bolsa de presupuesto — Meta vs Consumo</h3>
          <p className={styles.cardSubtitle}>
            Presupuesto mensual por defecto: <strong>$40,000,000</strong> distribuido entre
            procesos. Compara la meta contra el consumo real del periodo. Los valores en{" "}
            <strong>rojo</strong> indican procesos que han consumido más del 90% de su presupuesto.
          </p>
          <div className={styles.chartWrap}>
            <BolsaHorasChart data={budgetData} />
          </div>
          <BolsaHorasTable data={budgetData} />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Distribución por categoría</h3>
          <div className={styles.chartWrap}>
            <Pie data={pieData} options={chartOptions} />
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Evolución semanal</h3>
          <div className={styles.chartWrap}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Horas por proceso</h3>
          <div className={styles.chartWrap}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Resumen del periodo</h3>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total horas</span>
              <span className={styles.summaryValue}>1,040</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Registros</span>
              <span className={styles.summaryValue}>158</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Planillas</span>
              <span className={styles.summaryValue}>12</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Empleados únicos</span>
              <span className={styles.summaryValue}>87</span>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.footnote}>
        Las estadísticas se actualizan cada vez que se registra o aprueba una planilla. Los
        datos mostrados corresponden únicamente a registros aprobados del periodo seleccionado.
      </p>
    </div>
  );
}
