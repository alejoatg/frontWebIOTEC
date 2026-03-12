"use client";

import { useState } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { PreoperacionalMotoFilter } from "../../types";
import styles from "./PreoperacionalesMotosFilter.module.scss";

export interface PreoperacionalesMotosFilterProps {
  onSearch: (filter: PreoperacionalMotoFilter) => void;
  isLoading?: boolean;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getMaxEndDate(startDate: string): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  const maxEnd = new Date(start);
  maxEnd.setDate(maxEnd.getDate() + 29);
  return maxEnd.toISOString().split("T")[0];
}

export default function PreoperacionalesMotosFilter({
  onSearch,
  isLoading = false,
}: PreoperacionalesMotosFilterProps) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
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

    if (fechaInicio && fechaFin) {
      const start = new Date(fechaInicio);
      const end = new Date(fechaFin);

      if (start > end) {
        newErrors.fechaFin = "La fecha fin no puede ser anterior a la fecha inicio";
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 30) {
        newErrors.fechaFin = "El rango máximo es de 30 días";
      }
    }

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
          max={getTodayDate()}
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
          max={fechaInicio ? getMaxEndDate(fechaInicio) : getTodayDate()}
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
