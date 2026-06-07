"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFormReportBySlug } from "@/features/formularios/config/formReportsRegistry";
import { fetchFormReportById } from "@/features/formularios/api/formReportsApi";
import FormDetailReport from "@/features/formularios/components/shared/FormDetailReport";

export default function FormReportDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const config = getFormReportBySlug(slug);

  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchFormReportById(config, id);
        if (!cancelled) setRecord(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config, id]);

  if (!config) {
    return (
      <div className="p-6">
        <p className="text-red-600">Formulario no configurado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando informe...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "Registro no encontrado"}</p>
        <Link
          href={`/dashboard/formularios/${slug}`}
          className="text-blue-600 mt-2 inline-block"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link
        href={`/dashboard/formularios/${slug}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={20} />
        Volver al listado
      </Link>
      <FormDetailReport config={config} record={record} />
    </div>
  );
}
