"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchAtuFormatoUnicoById } from "@/features/formularios/api/atuFormatoUnicoApi";

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AtuFormatoUnicoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAtuFormatoUnicoById(id);
        if (!cancelled) setRecord(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "Registro no encontrado"}</p>
        <Link href="/dashboard/formularios/atu-formato-unico" className="text-blue-600 mt-2 inline-block">
          Volver al listado
        </Link>
      </div>
    );
  }

  const sections: { title: string; keys: string[] }[] = [
    { title: "Encabezado", keys: ["fecha", "tipoOrden", "ordenTrabajo", "numTrabajo", "brigada"] },
    { title: "Identificación", keys: ["municipio", "vereda", "linea", "lineaOtra", "nivelTension", "numeroEstructura", "numeroApoyo", "tipoEstructura", "seccionamiento", "estadoSeccionamiento"] },
    { title: "Tipo de inspección", keys: ["tipoInspeccion"] },
    { title: "Estado general", keys: ["estadoAisladores", "estadoEstructura", "estadoCruceteria", "requierePodas", "spt"] },
    { title: "Cierre", keys: ["observacionGeneral", "tipoFoto", "tipoFotoOtro"] },
  ];

  const firmaTecnicoUrl =
    typeof record.firmaTecnicoUrl === "string" ? record.firmaTecnicoUrl : undefined;
  const fotosActividad = Array.isArray(record.fotosActividadUrls)
    ? (record.fotosActividadUrls as string[])
    : [];
  const hasEvidencias = Boolean(firmaTecnicoUrl) || fotosActividad.length > 0;

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/dashboard/formularios/atu-formato-unico"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={20} />
        Volver al listado
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Detalle — Orden {String(record.ordenTrabajo || "—")}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Sincronizado: {formatDate(record.syncedAt as string)} · Técnico: {(record.submittedBy as { name?: string })?.name ?? "—"}
      </p>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h2 className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
              {section.title}
            </h2>
            <dl className="divide-y divide-gray-100">
              {section.keys.map((key) => {
                const value = record[key];
                if (value === undefined || value === null || value === "") return null;
                const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
                return (
                  <div key={key} className="px-4 py-2 flex justify-between gap-4">
                    <dt className="text-sm text-gray-500">{label}</dt>
                    <dd className="text-sm font-medium text-gray-900 text-right break-all">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>

      {hasEvidencias && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h2 className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
            Evidencias
          </h2>
          <div className="p-4 flex flex-wrap gap-4">
            {firmaTecnicoUrl ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">Firma técnico</p>
                <img
                  src={firmaTecnicoUrl}
                  alt="Firma"
                  className="max-h-24 border border-gray-200 rounded"
                />
              </div>
            ) : null}
            {fotosActividad.map((url, i) => (
                <div key={i}>
                  <p className="text-xs text-gray-500 mb-1">Foto {i + 1}</p>
                  <img
                    src={url}
                    alt={`Actividad ${i + 1}`}
                    className="max-h-32 border border-gray-200 rounded"
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
