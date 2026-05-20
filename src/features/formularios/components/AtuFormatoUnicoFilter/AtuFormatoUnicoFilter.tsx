"use client";

import { useState } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { AtuFormatoUnicoFilter } from "../../types";
import styles from "./AtuFormatoUnicoFilter.module.scss";

export interface AtuFormatoUnicoFilterProps {
  onSearch: (filter: AtuFormatoUnicoFilter) => void;
  isLoading?: boolean;
}

const BRIGADAS = [
  "SUR_387",
  "SUR_388",
  "CENTRO_285",
  "CENTRO_288",
  "NORTE_187",
  "NORTE_188",
  "NORTE_189",
  "SUB_2210",
  "SUB_2",
];

const TIPOS_INSPECCION = [
  "Inspeccion",
  "Termografia",
  "Sistemas_de_puesta_a_tierra",
  "Evento",
  "Consigna",
];

export default function AtuFormatoUnicoFilter({
  onSearch,
  isLoading = false,
}: AtuFormatoUnicoFilterProps) {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [brigada, setBrigada] = useState("");
  const [tipoInspeccion, setTipoInspeccion] = useState("");
  const [ordenTrabajo, setOrdenTrabajo] = useState("");

  const handleSearch = () => {
    onSearch({
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      municipio: municipio.trim() || undefined,
      brigada: brigada || undefined,
      tipoInspeccion: tipoInspeccion || undefined,
      ordenTrabajo: ordenTrabajo.trim() || undefined,
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
        <Input
          type="date"
          label="Fecha desde"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Input
          type="date"
          label="Fecha hasta"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          onKeyDown={handleKeyDown}
          min={fechaDesde || undefined}
          disabled={isLoading}
        />
        <Input
          type="text"
          label="Municipio"
          placeholder="Ej: Popayan"
          value={municipio}
          onChange={(e) => setMunicipio(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brigada</label>
          <select
            value={brigada}
            onChange={(e) => setBrigada(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {BRIGADAS.map((b) => (
              <option key={b} value={b}>
                {b.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo inspección</label>
          <select
            value={tipoInspeccion}
            onChange={(e) => setTipoInspeccion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {TIPOS_INSPECCION.map((t) => (
              <option key={t} value={t}>
                {t === "Inspeccion" ? "Inspección" : t === "Termografia" ? "Termografía" : t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <Input
          type="text"
          label="Orden de trabajo"
          placeholder="Número de orden"
          value={ordenTrabajo}
          onChange={(e) => setOrdenTrabajo(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
      </div>
      <div className={styles.actions}>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Consultando..." : "Consultar"}
        </Button>
      </div>
    </div>
  );
}
