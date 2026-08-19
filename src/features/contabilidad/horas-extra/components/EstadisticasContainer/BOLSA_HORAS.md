# Bolsa de Presupuesto de Horas Extra - Meta vs Consumo

Esta visualización compara el presupuesto mensual en **pesos** de horas extra por proceso contra el consumo real.

**Presupuesto mensual por defecto: $40,000,000**

## Componentes

### BolsaHorasChart
Gráfica de barras agrupadas que muestra:
- **Barras grises**: Meta en millones de pesos (presupuesto asignado)
- **Barras azules**: Consumido en millones de pesos (valor real del periodo)

El tooltip muestra:
- Valor en pesos (formateado)
- Horas correspondientes
- Dinero disponible (meta - consumido)
- % de consumo

### BolsaHorasTable
Tabla detallada con:
- Meta ($), Consumido ($), Disponible ($)
- Meta (h), Consumido (h)
- % Consumo con colores:
  - **Verde** (Normal): < 75%
  - **Amarillo** (Alerta): 75% - 89%
  - **Rojo** (Crítico): ≥ 90%
- Fila de totales (debe sumar $40,000,000)

## Estructura de datos

```tsx
interface ProcessBudget {
  processName: string;      // Nombre del proceso
  budgetAmount: number;     // Meta mensual en pesos (COP)
  consumedAmount: number;   // Pesos consumidos en el periodo
  budgetHours: number;      // Horas estimadas de la meta
  consumedHours: number;    // Horas reales consumidas
}
```

## Distribución por defecto de los $40M

Propuesta de distribución proporcional según volumen operativo:

| Proceso | % | Presupuesto |
|---------|---|-------------|
| AT (Alta Tensión) | 30% | $12,000,000 |
| ST (Subestaciones) | 25% | $10,000,000 |
| Distribución | 22.5% | $9,000,000 |
| Comercial | 12.5% | $5,000,000 |
| Gerencia | 6.25% | $2,500,000 |
| Administrativo | 3.75% | $1,500,000 |
| **Total** | **100%** | **$40,000,000** |

## Conectar con backend

### 1. Crear endpoint en API

```ts
// api/src/overtime/overtime-stats.controller.ts
@Get('stats/budget/:year/:month')
async getMonthlyBudget(
  @Param('year', ParseIntPipe) year: number,
  @Param('month', ParseIntPipe) month: number,
) {
  // Lógica para obtener:
  // 1. Presupuesto en $ por proceso (desde tabla de configuración, defecto $40M)
  // 2. Suma de montos aprobados por proceso en el periodo
  // 3. Calcular horas correspondientes
  return processBudgets;
}
```

### 2. Actualizar cliente API

```ts
// web/src/features/contabilidad/horas-extra/api/overtimeApi.ts
export interface ProcessBudget {
  processName: string;
  budgetAmount: number;      // Pesos (COP)
  consumedAmount: number;    // Pesos (COP)
  budgetHours: number;       // Horas estimadas
  consumedHours: number;     // Horas reales
}

export async function fetchMonthlyBudget(
  year: number,
  month: number,
): Promise<ProcessBudget[]> {
  return request<ProcessBudget[]>(`/stats/budget/${year}/${month}`);
}
```

### 3. Usar en componente

```tsx
// EstadisticasContainer.tsx
const [budgetData, setBudgetData] = useState<ProcessBudget[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const data = await fetchMonthlyBudget(period.year, period.month);
      setBudgetData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  })();
}, [period.year, period.month]);
```

## Tabla de configuración sugerida

Crear en el backend una tabla `overtime_process_budget`:

```sql
CREATE TABLE overtime_process_budget (
  id SERIAL PRIMARY KEY,
  process_name VARCHAR(100) NOT NULL,
  monthly_budget_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,  -- En pesos COP
  year INT NOT NULL,
  month INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(process_name, year, month)
);

-- Insertar presupuesto por defecto de $40M distribuido
INSERT INTO overtime_process_budget 
  (process_name, monthly_budget_amount, year, month) 
VALUES
  ('AT (Alta Tensión)', 12000000, 2026, 8),
  ('ST (Subestaciones)', 10000000, 2026, 8),
  ('Distribución', 9000000, 2026, 8),
  ('Comercial', 5000000, 2026, 8),
  ('Gerencia', 2500000, 2026, 8),
  ('Administrativo', 1500000, 2026, 8);
```

O si el presupuesto es el mismo cada mes:

```sql
CREATE TABLE overtime_process_budget (
  id SERIAL PRIMARY KEY,
  process_name VARCHAR(100) NOT NULL UNIQUE,
  monthly_budget_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Cálculo del consumo

El consumo se obtiene sumando los montos aprobados por proceso:

```sql
SELECT 
  e.process_name,
  -- Suma de dinero (ya calculado por entry)
  SUM(COALESCE(e.amount_total, 0)) as consumed_amount,
  -- Suma de horas
  SUM(
    COALESCE(e.hours_rd, 0) +
    COALESCE(e.hours_rn, 0) +
    COALESCE(e.hours_tsd, 0) +
    COALESCE(e.hours_tsn, 0) +
    COALESCE(e.hours_hedd, 0) +
    COALESCE(e.hours_hend, 0) +
    COALESCE(e.hours_disponibilidad, 0)
  ) as consumed_hours
FROM overtime_entries e
JOIN overtime_periods p ON e.period_id = p.id
WHERE p.year = $1 
  AND p.month = $2
  AND e.status = 'APPROVED'
GROUP BY e.process_name;
```

## Panel de administración

Sería útil crear una vista para que Contabilidad configure las metas:
- `/dashboard/contabilidad/horas-extra/presupuesto`
- Formulario para establecer meta por proceso
- Opción de copiar metas del mes anterior
- Historial de cambios

## Alertas automáticas

Cuando un proceso alcance el 90% de consumo, enviar notificación:
- A coordinadores del proceso
- A Contabilidad/Admin
- Por correo o sistema de notificaciones interno
