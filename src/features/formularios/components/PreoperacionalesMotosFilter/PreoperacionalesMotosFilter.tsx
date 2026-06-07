"use client";

import { useState } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { PreoperacionalMotoFilter } from "../../types";
import {
  getCurrentMonthRange,
  getMaxEndDate,
  getTodayIsoDate,
  MAX_REPORT_RANGE_DAYS,
  validateDateRange,
} from "../../lib/dateRange";
import styles from "./PreoperacionalesMotosFilter.module.scss";

export interface PreoperacionalesMotosFilterProps {
  onSearch: (filter: PreoperacionalMotoFilter) => void;
  isLoading?: boolean;
}

export default function PreoperacionalesMotosFilter({
  onSearch,
  isLoading = false,
}: PreoperacionalesMotosFilterProps) {
  const monthDefault = getCurrentMonthRange();
  const [fechaInicio, setFechaInicio] = useState(monthDefault.fechaDesde);
  const [fechaFin, setFechaFin] = useState(monthDefault.fechaHasta);
  const [placa, setPlaca] = useState("");
  const [cedulaConductor, setCedulaConductor] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndSearch = () => {
    const newErrors: Record<string, string> = {};

    if (!fechaInicio) {
      newErrors.fechaInicio = "La fecha de inicio es obligatoria";
    }

    if (!fechaFin) {
      newErrors.fechaFin = "La fecha fin es obligatoria";
    }

    const rangeErrors = validateDateRange(fechaInicio, fechaFin, MAX_REPORT_RANGE_DAYS);
    Object.assign(newErrors, rangeErrors);
    if (rangeErrors.fechaHasta) newErrors.fechaFin = rangeErrors.fechaHasta;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSearch({
        fechaInicio,
        fechaFin,
        placa: placa.trim() || undefined,
        cedulaConductor: cedulaConductor.trim() || undefined,
        page: 1,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      validateAndSearch();
    }
  };

  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFechaInicio(value);
    if (!fechaFin || new Date(fechaFin) < new Date(value)) {
      setFechaFin(value);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterGrid}>
        <Input
          type="date"
          label="Fecha inicio *"
          value={fechaInicio}
          onChange={handleFechaInicioChange}
          onKeyDown={handleKeyDown}
          max={getTodayIsoDate()}
          error={errors.fechaInicio}
          disabled={isLoading}
        />

        <Input
          type="date"
          label="Fecha fin *"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          onKeyDown={handleKeyDown}
          min={fechaInicio}
          max={fechaInicio ? getMaxEndDate(fechaInicio) : getTodayIsoDate()}
          error={errors.fechaFin}
          disabled={isLoading || !fechaInicio}
        />

        <Input
          type="text"
          label="Placa"
          placeholder="Ej: ABC123"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        <Input
          type="text"
          label="Cédula conductor"
          placeholder="Ej: 1234567890"
          value={cedulaConductor}
          onChange={(e) => setCedulaConductor(e.target.value.replace(/\D/g, ""))}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
      </div>

      <div className={styles.actions}>
        <Button onClick={validateAndSearch} disabled={isLoading}>
          {isLoading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
    </div>
  );
}
