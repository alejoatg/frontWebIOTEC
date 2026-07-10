"use client";

import { useEffect } from "react";
import { Input } from "@/components/Input";
import {
  getCurrentMonthRange,
  getMaxEndDate,
  getTodayIsoDate,
  validateDateRange,
  type DateRangeValue,
} from "../../../lib/dateRange";
import styles from "./DateRangeFilter.module.scss";

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Días máximos del rango (default 60). */
  maxDays?: number;
}

export function useDefaultMonthRange(): DateRangeValue {
  return getCurrentMonthRange();
}

export default function DateRangeFilter({
  value,
  onChange,
  errors = {},
  disabled = false,
  onKeyDown,
  maxDays,
}: DateRangeFilterProps) {
  const handleDesde = (fechaDesde: string) => {
    const next: DateRangeValue = { ...value, fechaDesde };
    if (!value.fechaHasta || new Date(value.fechaHasta) < new Date(fechaDesde)) {
      next.fechaHasta = fechaDesde;
    }
    onChange(next);
  };

  return (
    <>
      <Input
        type="date"
        label="Fecha inicio *"
        value={value.fechaDesde}
        onChange={(e) => handleDesde(e.target.value)}
        onKeyDown={onKeyDown}
        max={getTodayIsoDate()}
        error={errors.fechaDesde}
        disabled={disabled}
      />
      <Input
        type="date"
        label="Fecha fin *"
        value={value.fechaHasta}
        onChange={(e) => onChange({ ...value, fechaHasta: e.target.value })}
        onKeyDown={onKeyDown}
        min={value.fechaDesde}
        max={
          value.fechaDesde
            ? getMaxEndDate(value.fechaDesde, maxDays)
            : getTodayIsoDate()
        }
        error={errors.fechaFin ?? errors.fechaHasta}
        disabled={disabled || !value.fechaDesde}
      />
    </>
  );
}

export function DateRangeFilterInit({
  onReady,
}: {
  onReady: (range: DateRangeValue) => void;
}) {
  useEffect(() => {
    onReady(getCurrentMonthRange());
  }, [onReady]);
  return null;
}

export function validateDateRangeFields(value: DateRangeValue): Record<string, string> {
  const errs = validateDateRange(value.fechaDesde, value.fechaHasta);
  if (errs.fechaHasta) {
    return { ...errs, fechaFin: errs.fechaHasta };
  }
  return errs;
}
