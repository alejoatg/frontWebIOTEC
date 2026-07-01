"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components";
import { fetchPeriod } from "../../api/overtimeApi";
import type { OvertimePeriodDetail } from "../../api/overtimeApi";
import styles from "./PeriodSelector.module.scss";

export interface PeriodSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function PeriodSelector({ year, month, onChange }: PeriodSelectorProps) {
  const [detail, setDetail] = useState<OvertimePeriodDetail | null>(null);

  const load = useCallback(async () => {
    const d = await fetchPeriod(year, month);
    setDetail(d);
  }, [year, month]);

  useEffect(() => {
    load().catch(() => setDetail(null));
  }, [load]);

  return (
    <div className={styles.row}>
      <label>
        Año{" "}
        <input
          type="number"
          className={styles.input}
          value={year}
          onChange={(e) => onChange(Number(e.target.value), month)}
        />
      </label>
      <label>
        Mes{" "}
        <input
          type="number"
          min={1}
          max={12}
          className={styles.input}
          value={month}
          onChange={(e) => onChange(year, Number(e.target.value))}
        />
      </label>
      <Button type="button" variant="outline" size="sm" onClick={() => load()}>
        Actualizar
      </Button>
      {detail && (
        <span className={styles.badge} data-status={detail.status}>
          {detail.periodCode} — {detail.status === "OPEN" ? "Abierto" : "Cerrado"}
          {detail.entryCounts && (
            <> · PENDING: {detail.entryCounts.PENDING ?? 0} · APPROVED: {detail.entryCounts.APPROVED ?? 0}</>
          )}
        </span>
      )}
    </div>
  );
}
