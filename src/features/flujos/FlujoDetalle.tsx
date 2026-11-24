"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import LocationMap from "@/components/LocationMap/LocationMap";
import { fetchFlujo } from "./api";
import { FlujoEvidence } from "./FlujoEvidence";
import { FLUJO_STATUS_LABEL, siNoLabel, VISITA_ESTADO_LABEL } from "./status";
import type { FlujoAtencion, FlujoVisita } from "./types";
import styles from "./FlujoDetalle.module.scss";

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

function toCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function VisitaBlock({ visita }: { visita: FlujoVisita }) {
  const lat = toCoord(visita.lat);
  const lng = toCoord(visita.lng);
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        Visita {visita.orden} · {VISITA_ESTADO_LABEL[visita.estado]} · {visita.fechaProgramada}
      </h3>
      <div className={styles.fieldList}>
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
      {lat != null && lng != null && !(lat === 0 && lng === 0) ? (
        <div className={styles.mapWrap}>
          <LocationMap lat={lat} lng={lng} label="Ubicación de la inspección" />
        </div>
      ) : null}
      <FlujoEvidence label="Autorización" value={visita.autorizacionFotoUrl} />
      <FlujoEvidence label="Antes" value={visita.fotoAntesUrls} />
      <FlujoEvidence label="Durante" value={visita.fotoDuranteUrls} />
      <FlujoEvidence label="Después" value={visita.fotoDespuesUrls} />
      <FlujoEvidence label="Destino" value={visita.fotoDestinoUrls} />
      <FlujoEvidence label="Acta de atención" value={visita.fotoActaAtencionUrls} />
      <FlujoEvidence label="Acta de apiario" value={visita.fotoActaApiarioUrls} />
      <FlujoEvidence label="Firma del solicitante" value={visita.firmaSolicitanteUrl} signature />
    </section>
  );
}

export default function FlujoDetalle({ id }: { id: string }) {
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

  if (loading) return <p className={styles.loading}>Cargando informe...</p>;
  if (error || !record) {
    return (
      <div>
        <p className={styles.error}>{error || "Registro no encontrado"}</p>
        <Link href="/dashboard/flujos" className={styles.backLink}>
          Volver al listado
        </Link>
      </div>
    );
  }

  const prog = record.programacion;
  const openPrint = () => {
    window.open(`/imprimir/flujos/${record.id}?print=1`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.container}>
      <Link href="/dashboard/flujos" className={styles.backLink}>
        <ArrowLeft size={20} />
        Volver al listado
      </Link>
      <div className={styles.toolbar}>
        <Button onClick={openPrint}>Imprimir</Button>
      </div>
      <article className={styles.report}>
        <header className={styles.header}>
          <h1 className={styles.title}>Atención de abejas</h1>
          <p className={styles.subtitle}>{record.radicado}</p>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${styles[record.status]}`}>
              {FLUJO_STATUS_LABEL[record.status]}
            </span>
            <span>Fecha recepción: {record.fecha}</span>
            <span>Creado por: {record.createdBy?.name ?? "—"}</span>
          </div>
        </header>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Programación</h3>
          <div className={styles.fieldList}>
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
          <VisitaBlock key={visita.id} visita={visita} />
        ))}
      </article>
    </div>
  );
}
