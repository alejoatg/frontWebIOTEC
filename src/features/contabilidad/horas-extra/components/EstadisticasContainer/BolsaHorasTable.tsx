import styles from "./BolsaHorasTable.module.scss";

interface ProcessBudget {
  processName: string;
  budgetAmount: number;
  consumedAmount: number;
  budgetHours: number;
  consumedHours: number;
}

interface BolsaHorasTableProps {
  data: ProcessBudget[];
}

function calcPercent(consumed: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.round((consumed / budget) * 100);
}

function statusClass(percent: number): string {
  if (percent >= 90) return styles.statusDanger;
  if (percent >= 75) return styles.statusWarning;
  return styles.statusOk;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BolsaHorasTable({ data }: BolsaHorasTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Proceso</th>
            <th className={styles.num}>Meta ($)</th>
            <th className={styles.num}>Consumido ($)</th>
            <th className={styles.num}>Disponible ($)</th>
            <th className={styles.num}>Meta (h)</th>
            <th className={styles.num}>Consumido (h)</th>
            <th className={styles.num}>% Consumo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const remainingAmount = row.budgetAmount - row.consumedAmount;
            const percent = calcPercent(row.consumedAmount, row.budgetAmount);
            return (
              <tr key={row.processName}>
                <td className={styles.processName}>{row.processName}</td>
                <td className={styles.num}>{formatMoney(row.budgetAmount)}</td>
                <td className={styles.num}>{formatMoney(row.consumedAmount)}</td>
                <td className={styles.num}>{formatMoney(remainingAmount)}</td>
                <td className={styles.num}>{row.budgetHours.toFixed(1)}</td>
                <td className={styles.num}>{row.consumedHours.toFixed(1)}</td>
                <td className={styles.num}>{percent}%</td>
                <td>
                  <span className={`${styles.badge} ${statusClass(percent)}`}>
                    {percent >= 90
                      ? "Crítico"
                      : percent >= 75
                        ? "Alerta"
                        : "Normal"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className={styles.totalLabel}>Total</td>
            <td className={styles.num}>
              {formatMoney(data.reduce((sum, d) => sum + d.budgetAmount, 0))}
            </td>
            <td className={styles.num}>
              {formatMoney(data.reduce((sum, d) => sum + d.consumedAmount, 0))}
            </td>
            <td className={styles.num}>
              {formatMoney(
                data.reduce((sum, d) => sum + (d.budgetAmount - d.consumedAmount), 0),
              )}
            </td>
            <td className={styles.num}>
              {data.reduce((sum, d) => sum + d.budgetHours, 0).toFixed(1)}
            </td>
            <td className={styles.num}>
              {data.reduce((sum, d) => sum + d.consumedHours, 0).toFixed(1)}
            </td>
            <td className={styles.num}>
              {calcPercent(
                data.reduce((sum, d) => sum + d.consumedAmount, 0),
                data.reduce((sum, d) => sum + d.budgetAmount, 0),
              )}
              %
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
