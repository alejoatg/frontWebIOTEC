"use client";

import { useEffect, useState } from "react";
import { MediaImage } from "@/components/MediaImage";
import { fetchFlujo } from "./api";
import { FLUJO_STATUS_LABEL, siNoLabel, VISITA_ESTADO_LABEL } from "./status";
import type { FlujoAtencion, FlujoVisita } from "./types";
import styles from "./FlujoPrintView.module.scss";

function Field({ label, value }: { label: string; value: unknown }) {
  const text =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className={styles.fieldRow}>
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

function urlsOf(value: unknown): string[] {
  if (typeof value === "string" && value.startsWith("http")) return [value];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.startsWith("http"));
  }
  return [];
}

function Photos({ label, value }: { label: string; value: unknown }) {
  const urls = urlsOf(value);
  if (urls.length === 0) return null;
  return (
    <div className={styles.photos}>
      {urls.map((url, i) => (
        <MediaImage
          key={`${url}-${i}`}
          src={url}
          alt={`${label} ${i + 1}`}
          className={styles.photo}
        />
      ))}
    </div>
  );
}

function VisitaPrint({ visita }: { visita: FlujoVisita }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        Visita {visita.orden} · {VISITA_ESTADO_LABEL[visita.estado]} · {visita.fechaProgramada}
      </h2>
      <div>
        <Field label="Dirección inspección" value={visita.inspeccionDireccion} />
        <Field label="Diagnóstico" value={visita.diagnostico} />
        <Field label="¿Se realiza atención?" value={siNoLabel(visita.seRealizaAtencion)} />
        <Field label="Fecha reprogramada" value={visita.seProgramaFecha} />
        <Field label="Inicio desplazamiento" value={visita.horaInicioDesplazamiento} />
        <Field label="Arribo" value={visita.horaArribo} />
        <Field label="Fin del servicio" value={visita.horaFinServicio} />
        <Field label="Personal operativo" value={visita.personalOperativo} />
        <Field label="Equipos" value={visita.equipos} />
        <Field label="¿Autorización?" value={siNoLabel(visita.cuentaConAutorizacion)} />
        <Field label="¿Reporte APH?" value={siNoLabel(visita.reporteAph)} />
        <Field label="Ejecutado por" value={visita.executedBy?.name} />
      </div>
      <Photos label="Antes" value={visita.fotoAntesUrls} />
      <Photos label="Durante" value={visita.fotoDuranteUrls} />
      <Photos label="Después" value={visita.fotoDespuesUrls} />
      <Photos label="Destino" value={visita.fotoDestinoUrls} />
      <Photos label="Acta atención" value={visita.fotoActaAtencionUrls} />
      <Photos label="Acta apiario" value={visita.fotoActaApiarioUrls} />
      <Photos label="Autorización" value={visita.autorizacionFotoUrl} />
      <Photos label="Firma" value={visita.firmaSolicitanteUrl} />
    </section>
  );
}

export default function FlujoPrintView({
  id,
  autoPrint = false,
}: {
  id: string;
  autoPrint?: boolean;
}) {
  const [record, setRecord] = useState<FlujoAtencion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchFlujo(id);
        if (!cancelled) setRecord(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!autoPrint || loading || !record) return;
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, [autoPrint, loading, record]);

  if (loading) return <p style={{ padding: "2rem" }}>Cargando impresión…</p>;
  if (error || !record) {
    return <p style={{ padding: "2rem", color: "#b91c1c" }}>{error || "No encontrado"}</p>;
  }

  const prog = record.programacion;

  return (
    <article className={styles.sheet}>
      <header>
        <div className={styles.headerTop}>
          <img className={styles.logo} src="/images/logo-uten-print.png" alt="UTEN" />
          <p className={styles.orgName}>
            Unión de trabajadores de la industria energética nacional - UTEN · NIT: 900262482-5
          </p>
        </div>
        <h1 className={styles.title}>Atención de abejas</h1>
        <p className={styles.subtitle}>{record.radicado}</p>
        <div className={styles.meta}>
          <span>{FLUJO_STATUS_LABEL[record.status]}</span>
          <span>Fecha: {record.fecha}</span>
          <span>Creado por: {record.createdBy?.name ?? "—"}</span>
        </div>
      </header>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Programación</h2>
        <div>
          <Field label="Nombre" value={prog?.nombre} />
          <Field label="Cédula" value={prog?.cedula} />
          <Field label="Dirección" value={prog?.direccion} />
          <Field label="Barrio" value={prog?.barrio} />
          <Field label="Teléfono" value={prog?.telefono} />
          <Field label="Referencia" value={prog?.referencia} />
          <Field label="Color" value={prog?.color} />
          <Field label="Ubicación" value={prog?.ubicacion} />
          <Field label="Altura" value={prog?.altura} />
          <Field label="Tiempo" value={prog?.tiempo} />
          <Field label="¿Heridos?" value={siNoLabel(prog?.heridos)} />
          <Field label="Recepciona" value={prog?.recepciona} />
        </div>
      </section>
      {(record.visitas ?? []).map((visita) => (
        <VisitaPrint key={visita.id} visita={visita} />
      ))}
    </article>
  );
}
