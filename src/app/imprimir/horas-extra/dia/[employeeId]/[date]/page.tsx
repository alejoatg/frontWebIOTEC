"use client";

import { use, useCallback, useEffect, useState } from "react";
import { fetchDayPrintData, type TsDayPrintData } from "@/features/contabilidad/horas-extra/api/overtimeApi";
import TsPgfiDayPrintView from "@/features/contabilidad/horas-extra/components/TsPgfiDayPrintView/TsPgfiDayPrintView";

interface PageProps {
  params: Promise<{ employeeId: string; date: string }>;
}

export default function ImprimirTsDiaPage({ params }: PageProps) {
  const { employeeId, date } = use(params);
  const [data, setData] = useState<TsDayPrintData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDayPrintData(employeeId, date);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el formato");
    } finally {
      setLoading(false);
    }
  }, [employeeId, date]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Cargando formato PGFI-001-04…</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c" }}>
        {error ?? "Sin datos"}
      </div>
    );
  }

  return <TsPgfiDayPrintView data={data} />;
}
