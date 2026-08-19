import { Bar } from "react-chartjs-2";

interface ProcessBudget {
  processName: string;
  budgetAmount: number;
  consumedAmount: number;
  budgetHours: number;
  consumedHours: number;
}

interface BolsaHorasChartProps {
  data: ProcessBudget[];
}

function formatMoney(value: number): string {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export default function BolsaHorasChart({ data }: BolsaHorasChartProps) {
  const labels = data.map((d) => d.processName);
  const budgets = data.map((d) => d.budgetAmount / 1_000_000); // Convertir a millones para visualización
  const consumed = data.map((d) => d.consumedAmount / 1_000_000);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Meta (millones $)",
        data: budgets,
        backgroundColor: "rgba(203, 213, 225, 0.8)",
        borderColor: "rgba(148, 163, 184, 1)",
        borderWidth: 1,
      },
      {
        label: "Consumido (millones $)",
        data: consumed,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            const value = context.parsed.y;
            const actualValue = datasetIndex === 0 
              ? data[index].budgetAmount 
              : data[index].consumedAmount;
            return `${context.dataset.label}: ${formatMoney(actualValue)}`;
          },
          afterLabel: (context: any) => {
            const index = context.dataIndex;
            const budget = data[index].budgetAmount;
            const used = data[index].consumedAmount;
            const remaining = budget - used;
            const percent = budget > 0 ? Math.round((used / budget) * 100) : 0;
            const hours = context.datasetIndex === 0 
              ? data[index].budgetHours 
              : data[index].consumedHours;
            return [
              `Disponible: ${formatMoney(remaining)}`,
              `Horas: ${hours.toFixed(1)}`,
              `Consumo: ${percent}%`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Millones de pesos",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
