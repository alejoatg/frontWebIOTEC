"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Flag,
  MapPin,
  Navigation,
  Store,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components";
import { TMR_EXCLUSIONS, type TmrExclusion, type TmrRow } from "./api";
import { formatClock, formatSpan, formatTs, possibleExclusionReason } from "./jornada";
import styles from "./TmrOrdenDetalle.module.scss";

const TIMELINE = [
  { key: "createdAt", label: "Creado", icon: Flag },
  { key: "startTime", label: "Start", icon: Flag },
  { key: "assignedAt", label: "Asignación", icon: UserPlus },
  { key: "acknowledgedAt", label: "Aceptado", icon: CheckCircle2 },
  { key: "arrivedShopAt", label: "En taller", icon: Store },
  { key: "enRouteAt", label: "En ruta", icon: Navigation },
  { key: "arrivedSiteAt", label: "En sitio", icon: MapPin },
  { key: "completedAt", label: "Completado", icon: CheckCircle2 },
] as const;

interface Props {
  row: TmrRow;
  onClose: () => void;
  onOpenRelated?: (id: string) => void;
  onSave: (next: Pick<TmrRow, "exclusion" | "observacion" | "notaCeo">) => void;
}

export default function TmrOrdenDetalle({ row, onClose, onOpenRelated, onSave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [exclusion, setExclusion] = useState<TmrExclusion | "">(row.exclusion);
  const [observacion, setObservacion] = useState(row.observacion);
  const [notaCeo, setNotaCeo] = useState(row.notaCeo);
  const [saved, setSaved] = useState(false);
  const dirty =
    exclusion !== row.exclusion || observacion !== row.observacion || notaCeo !== row.notaCeo;
  const exclusionReason = possibleExclusionReason(row);

  useEffect(() => {
    setExclusion(row.exclusion);
    setObservacion(row.observacion);
    setNotaCeo(row.notaCeo);
    setSaved(false);
  }, [row.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  function handleSave() {
    onSave({
      exclusion: exclusion as TmrExclusion,
      observacion,
      notaCeo,
    });
    setSaved(true);
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h3>Detalle de la orden</h3>
            <p>
              {row.caseSerial || "Sin caso"}
              {row.jobSerial ? ` · job ${row.jobSerial}` : ""}
              {row.ticketSerial ? ` · ticket ${row.ticketSerial}` : ""}
            </p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className={styles.body}>
          <section>
            <h4>Identificación</h4>
            <dl className={styles.grid}>
              <div>
                <dt>Brigada</dt>
                <dd>{row.crew || "—"}</dd>
              </div>
              <div>
                <dt>Municipio</dt>
                <dd>{row.municipality || "—"}</dd>
              </div>
              <div>
                <dt>Núcleo</dt>
                <dd>{row.nucleo || "—"}</dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd>{row.ubicacion || "—"}</dd>
              </div>
              <div>
                <dt>Circuito</dt>
                <dd>{row.circuitCode || "—"}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{row.location || "—"}</dd>
              </div>
              <div>
                <dt>Tipo de trabajo</dt>
                <dd>{row.workType || "—"}</dd>
              </div>
              <div>
                <dt>Día (Start)</dt>
                <dd>{row.dia || "—"}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h4>Línea de tiempo</h4>
            <div className={styles.times}>
              {TIMELINE.map((item) => {
                const Icon = item.icon;
                const value = row[item.key] ?? null;
                return (
                  <div key={item.key} className={value ? styles.time : styles.timeEmpty}>
                    <Icon size={16} aria-hidden />
                    <span>{item.label}</span>
                    <strong>{formatClock(value)}</strong>
                    <small>{formatTs(value)}</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h4>Tiempos TMR</h4>
            <dl className={styles.kpis}>
              <div>
                <dt>Generación</dt>
                <dd>{formatSpan(row.tmrGen)}</dd>
              </div>
              <div>
                <dt>Asignación</dt>
                <dd>{formatSpan(row.tmrAsig)}</dd>
              </div>
              <div>
                <dt>Alistamiento</dt>
                <dd>{formatSpan(row.tmrAlist)}</dd>
              </div>
              <div>
                <dt>Desplazamiento</dt>
                <dd>{formatSpan(row.tmrDesp)}</dd>
              </div>
              <div>
                <dt>Servicio</dt>
                <dd>{formatSpan(row.tmrSer)}</dd>
              </div>
              <div>
                <dt>TMR CEO</dt>
                <dd>{formatSpan(row.tmrDuracion)}</dd>
              </div>
              <div>
                <dt>TMR UTEN</dt>
                <dd>{formatSpan(row.tmrDuracionUten)}</dd>
              </div>
              <div>
                <dt>Rango</dt>
                <dd>{row.rango2Uten || row.rangoUten || "—"}</dd>
              </div>
            </dl>
            <p className={styles.note}>
              Start validado: {formatTs(row.startValidado)}
              {row.startValidadoFuente === "enRoute" ? " (tomado de En ruta)" : " (Start original)"}
            </p>
            {exclusionReason ? (
              <p className={styles.reason}>
                <strong>Posible exclusión. </strong>
                {exclusionReason}
              </p>
            ) : null}
            {row.sobreRelacion ? (
              <div className={styles.related}>
                <h4>Orden relacionada (30 min)</h4>
                <p>
                  Job {row.sobreRelacion.jobSerial}
                  {row.sobreRelacion.caseSerial ? ` · caso ${row.sobreRelacion.caseSerial}` : ""}
                  {row.sobreRelacion.municipality ? ` · ${row.sobreRelacion.municipality}` : ""}
                </p>
                <p>
                  Start {formatTs(row.sobreRelacion.startTime)} (+{row.sobreRelacion.minutosDespues}{" "}
                  min). TMR de esta orden {formatSpan(row.tmrDuracion)}; la otra{" "}
                  {formatSpan(row.sobreRelacion.tmrDuracion)}.
                </p>
                {onOpenRelated ? (
                  <button
                    type="button"
                    className={styles.relatedLink}
                    onClick={() => onOpenRelated(row.sobreRelacion!.id)}
                  >
                    Ver esa orden
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>

          <section>
            <h4>Lectura del motor</h4>
            <ul className={styles.flags}>
              <li>Sobreasignación: {row.sobreAsignacion ? "sí" : "no"}</li>
              <li>Start después del corte de tarde: {row.afterCutoff ? "sí" : "no"}</li>
              <li>En ruta al día siguiente: {row.nextDayEnRoute ? "sí" : "no"}</li>
              <li>Municipio con corte 21:00: {row.lateOk ? "sí" : "no"}</li>
              <li>Exclusión automática: {row.exclusionAuto || "—"}</li>
              <li>
                Causas registradas:{" "}
                {(row.causas ?? []).length ? (row.causas ?? []).join(" · ") : "—"}
              </li>
            </ul>
          </section>

          {(row.cause || row.caseDescription || row.ticketDescription || row.jobComment) && (
            <section>
              <h4>Daño y comentarios</h4>
              <p>
                <strong>Causa. </strong>
                {row.cause || "—"}
                {row.deviceCause ? ` · equipo ${row.deviceCause}` : ""}
                {row.weatherCause ? ` · clima ${row.weatherCause}` : ""}
              </p>
              {row.caseDescription ? <p>{row.caseDescription}</p> : null}
              {row.ticketDescription ? <p>{row.ticketDescription}</p> : null}
              {row.jobComment ? (
                <p>
                  <strong>Comentario del job. </strong>
                  {row.jobComment}
                </p>
              ) : null}
            </section>
          )}

          <section className={styles.edit}>
            <h4>Análisis del conciliador</h4>
            <label>
              Exclusión
              <select
                value={exclusion}
                onChange={(e) => setExclusion(e.target.value as TmrExclusion)}
              >
                {TMR_EXCLUSIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            {row.exclusion !== row.exclusionAuto ? (
              <p className={styles.note}>Automática: {row.exclusionAuto || "—"}</p>
            ) : null}
            <label>
              Observación
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={3}
                placeholder="Motivo de la exclusión, espera de logística, evidencia…"
              />
            </label>
            <label>
              Nota CEO
              <textarea
                value={notaCeo}
                onChange={(e) => setNotaCeo(e.target.value)}
                rows={3}
                placeholder="Nota para el cierre o el informe a gerencia…"
              />
            </label>
            {saved && !dirty ? <p className={styles.saved}>Guardado en esta sesión.</p> : null}
          </section>
        </div>

        <footer className={styles.footer}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!dirty}>
            Guardar análisis
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
