# Estadísticas - Chart.js

Este componente usa **Chart.js** (v4) con **react-chartjs-2** para mostrar gráficas.

## Tipos de gráficas disponibles

### 1. Pie / Doughnut (Pastel / Dona)
```tsx
import { Pie, Doughnut } from "react-chartjs-2";

<Pie data={pieData} options={options} />
<Doughnut data={doughnutData} options={options} />
```

### 2. Line (Líneas)
```tsx
import { Line } from "react-chartjs-2";

<Line data={lineData} options={options} />
```

### 3. Bar (Barras)
```tsx
import { Bar } from "react-chartjs-2";

<Bar data={barData} options={options} />
```

### 4. Otras disponibles
- `Radar` - Gráfica de radar
- `Scatter` - Dispersión
- `Bubble` - Burbujas
- `PolarArea` - Área polar

## Estructura de datos

```tsx
const data = {
  labels: ["Enero", "Febrero", "Marzo"],
  datasets: [
    {
      label: "Ventas 2026",
      data: [65, 59, 80],
      backgroundColor: "rgba(59, 130, 246, 0.8)",
      borderColor: "rgba(59, 130, 246, 1)",
      borderWidth: 1,
    },
  ],
};
```

## Opciones comunes

```tsx
const options = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: "top" as const,
      display: true,
    },
    title: {
      display: true,
      text: "Título de la gráfica",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};
```

## Múltiples datasets

```tsx
const data = {
  labels: ["Enero", "Febrero", "Marzo"],
  datasets: [
    {
      label: "2025",
      data: [65, 59, 80],
      backgroundColor: "rgba(59, 130, 246, 0.8)",
    },
    {
      label: "2026",
      data: [75, 69, 90],
      backgroundColor: "rgba(16, 185, 129, 0.8)",
    },
  ],
};
```

## Registro de componentes

Siempre registrar los componentes necesarios al inicio:

```tsx
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

ChartJS.register(
  ArcElement,      // Para Pie/Doughnut
  CategoryScale,   // Para ejes de categorías
  LinearScale,     // Para ejes lineales
  PointElement,    // Para puntos en Line
  LineElement,     // Para líneas
  BarElement,      // Para barras
  Title,           // Plugin título
  Tooltip,         // Plugin tooltip
  Legend,          // Plugin leyenda
);
```

## Documentación oficial

- Chart.js: https://www.chartjs.org/docs/latest/
- react-chartjs-2: https://react-chartjs-2.js.org/

## Colores UTEN

```tsx
const UTEN_COLORS = {
  blue: "rgba(59, 130, 246, 0.8)",
  green: "rgba(16, 185, 129, 0.8)",
  purple: "rgba(139, 92, 246, 0.8)",
  pink: "rgba(236, 72, 153, 0.8)",
  orange: "rgba(251, 146, 60, 0.8)",
  red: "rgba(239, 68, 68, 0.8)",
};
```
