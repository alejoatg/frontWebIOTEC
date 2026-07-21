"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Button } from "@/components";
import {
  fetchBatchPrintData,
  type BatchRegisterPrintData,
} from "@/features/contabilidad/horas-extra/api/overtimeApi";
import TsBatchRegisterPrint from "@/features/contabilidad/horas-extra/components/TsBatchRegisterPrint/TsBatchRegisterPrint";

interface PageProps {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default function ImprimirSoporteCargaPage({ params, searchParams }: PageProps) {
  const { batchId } = use(params);
  const { print: printFlag } = use(searchParams);
  const autoPrint = printFlag === "1";

  const [data, setData] = useState<BatchRegisterPrintData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchBatchPrintData(batchId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el soporte");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

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
      <div style={{ padding: "2rem", textAlign: "center" }}>Cargando soporte de registro…</div>
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
          <strong>{data.batchCode}</strong> — {data.sourceLabel} ({data.entryCount} registros)
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
      <TsBatchRegisterPrint data={data} />
    </div>
  );
}
