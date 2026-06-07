"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { FormReportConfig } from "../../../config/formReportTypes";
import DateRangeFilter, {
  useDefaultMonthRange,
  validateDateRangeFields,
} from "../DateRangeFilter";
import { getCurrentMonthRange, type DateRangeValue } from "../../../lib/dateRange";
import styles from "./FormReportFilter.module.scss";

export interface FormReportFilterProps {
  config: FormReportConfig;
  onSearch: (filter: Record<string, unknown>) => void;
  isLoading?: boolean;
  autoSearchOnMount?: boolean;
}

export default function FormReportFilter({
  config,
  onSearch,
  isLoading = false,
  autoSearchOnMount = true,
}: FormReportFilterProps) {
  const defaultRange = useDefaultMonthRange();
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultRange);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!autoSearchOnMount) return;
    const range = getCurrentMonthRange();
    setDateRange(range);
    onSearch({
      fechaDesde: range.fechaDesde,
      fechaHasta: range.fechaHasta,
      page: 1,
      pageSize: 50,
    });
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const dateErrors = validateDateRangeFields(dateRange);
    if (Object.keys(dateErrors).length > 0) {
      setErrors(dateErrors);
      return;
    }
    setErrors({});
    onSearch({
      fechaDesde: dateRange.fechaDesde,
      fechaHasta: dateRange.fechaHasta,
      ...extra,
      page: 1,
      pageSize: 50,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterGrid}>
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          errors={errors}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
        />
        {config.filterFields
          .filter((f) => f.type !== "dateRange")
          .map((field) => {
            if (field.type === "text") {
              return (
                <Input
                  key={field.key}
                  type="text"
                  label={field.label}
                  placeholder={field.placeholder}
                  value={extra[field.key] ?? ""}
                  onChange={(e) =>
                    setExtra((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
              );
            }
            if (field.type === "select") {
              return (
                <div key={field.key}>
                  <label className={styles.selectLabel}>{field.label}</label>
                  <select
                    value={extra[field.key] ?? ""}
                    onChange={(e) =>
                      setExtra((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className={styles.select}
                  >
                    <option value="">{field.emptyLabel ?? "Todos"}</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })}
      </div>
      <p className={styles.hint}>Rango máximo de consulta: 60 días. Por defecto: mes en curso.</p>
      <div className={styles.actions}>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
    </div>
  );
}
