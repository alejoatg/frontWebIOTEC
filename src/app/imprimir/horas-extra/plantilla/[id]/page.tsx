"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Button } from "@/components";
import {
  fetchPdfPlantillaPrintData,
  type TsPlantillaPrintData,
} from "@/features/contabilidad/horas-extra/api/overtimeApi";
import TsPgfiPlantillaPrint from "@/features/contabilidad/horas-extra/components/TsPgfiPlantillaPrint/TsPgfiPlantillaPrint";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default function ImprimirTsPlantillaPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { print: printFlag } = use(searchParams);
  const autoPrint = printFlag === "1";

  const [data, setData] = useState<TsPlantillaPrintData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchPdfPlantillaPrintData(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el formato");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoPrint || loading || !data) return;
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, [autoPrint, loading, data]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Cargando planilla PGFI-001-04…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c" }}>
        {error ?? "Sin datos"}
      </div>
    );
  }

  return (
    <div>
      <div
        className="ts-print-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: "0.875rem" }}>
          <strong>{data.plantillaCode}</strong> — {data.employeeFullName} (
          {data.employeeDocumentNumber})
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button type="button" size="sm" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.close()}>
            Cerrar
          </Button>
        </div>
      </div>
      <TsPgfiPlantillaPrint data={data} />
    </div>
  );
}
