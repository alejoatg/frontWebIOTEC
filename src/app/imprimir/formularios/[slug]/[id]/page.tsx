"use client";

import { use, useCallback, useEffect, useState } from "react";
import { getFormReportBySlug } from "@/features/formularios/config/formReportsRegistry";
import { fetchFormReportById } from "@/features/formularios/api/formReportsApi";
import FormSubmissionPrint from "@/features/formularios/components/shared/FormSubmissionPrint";
import type { FormReportConfig } from "@/features/formularios/config/formReportTypes";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default function ImprimirFormularioDetallePage({
  params,
  searchParams,
}: PageProps) {
  const { slug, id } = use(params);
  const { print: printFlag } = use(searchParams);
  const autoPrint = printFlag === "1";

  const config = getFormReportBySlug(slug) as FormReportConfig | undefined;

  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!config || !id) {
      setLoading(false);
      setError(config ? "Registro no encontrado" : "Formulario no configurado");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRecord(await fetchFormReportById(config, id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el registro");
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [config, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoPrint || loading || !record) return;
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, [autoPrint, loading, record]);

  if (!config) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c" }}>
        Formulario no configurado
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Cargando detalle para impresión…
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c" }}>
        {error ?? "Sin datos"}
      </div>
    );
  }

  return <FormSubmissionPrint config={config} record={record} />;
}
