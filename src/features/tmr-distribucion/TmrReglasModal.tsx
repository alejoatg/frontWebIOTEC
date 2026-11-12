"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components";
import styles from "./TmrReglasModal.module.scss";

const PRIORITY = [
  {
    n: "1",
    tone: "fhl",
    title: "Fuera del horario laboral",
    fields: ["Start Time", "Job En-Route Time", "Municipality"],
    when: "Se evalúa primero. Basta con una de las dos condiciones.",
    items: [
      "Noche: Start es a las 21:00 o después en Popayán, Santander de Quilichao o Patía (El Bordo), o a las 16:00 o después en el resto de municipios, y En-Route es otro día calendario.",
      "Madrugada: Start es antes de las 7:00 y En-Route ya está en jornada (7:00 o después el mismo día, o cualquier hora del día siguiente).",
    ],
    effect: "El Start validado pasa a En-Route. El TMR CEO sigue contando desde Start; el TMR UTEN, desde En-Route.",
  },
  {
    n: "2",
    tone: "sobre",
    title: "Sobreasignación",
    fields: ["Crew", "Start Time", "Job Completed Time", "Job En-Route Time"],
    when: "Si no aplica fuera de horario. Gana a logística especial porque es más fácil de justificar.",
    items: [
      "La misma brigada tiene al menos otra orden cuyo Start cae en los 30 minutos posteriores a esta.",
      "Y el TMR frío (Start → Completado) es mayor a 8 horas.",
    ],
    effect:
      "El Start validado pasa a En-Route. Si también hay En-Route al día siguiente, se registran las dos causas: Sobreasignación (principal) y Pendiente de logística especial.",
  },
  {
    n: "3",
    tone: "cpl",
    title: "Pendiente de logística especial",
    fields: ["Start Time", "Job En-Route Time"],
    when: "Si no aplica fuera de horario ni sobreasignación.",
    items: [
      "En-Route es otro día calendario respecto de Start. No exige corte de 16:00 ni de 21:00.",
    ],
    effect: "El Start validado pasa a En-Route. El TMR CEO incluye la espera nocturna; el TMR UTEN cuenta desde que salieron.",
  },
  {
    n: "4",
    tone: "tmr",
    title: "Cumple TMR o No cumple el TMR",
    fields: ["Start Time", "Job Completed Time"],
    when: "Si no aplicó ninguna exclusión anterior.",
    items: [
      "TMR ≤ 8 h: Cumple TMR.",
      "TMR > 8 h: No cumple el TMR.",
      "Se mide Start → Completado (sin mover el Start validado).",
    ],
    effect: "El Start validado permanece en Start Time.",
  },
] as const;

interface Props {
  onClose: () => void;
}

export default function TmrReglasModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby="tmr-reglas-title"
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h3 id="tmr-reglas-title">Reglas de validación TMR</h3>
            <p>Campos del consolidado y orden de prioridad de la exclusión automática.</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.box}>
            <h4>Ámbito</h4>
            <ul>
              <li>
                Solo jobs de brigadas en <strong>BRIGADAS UTEN</strong> con <strong>Start Time</strong>.
              </li>
              <li>
                El reloj es el de pared del Excel (hora Colombia). No se convierte a otra zona.
              </li>
              <li>
                El TMR se calcula como diferencia de fechas en horas. El umbral de cumplimiento es{" "}
                <strong>8 horas</strong>.
              </li>
            </ul>
          </section>

          <section>
            <h4>Campos que usa el motor</h4>
            <table className={styles.fields}>
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Para qué</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Crew</td>
                  <td>Filtrar UTEN y detectar sobreasignación de la misma brigada</td>
                </tr>
                <tr>
                  <td>Start Time</td>
                  <td>Inicio del TMR, corte de jornada, madrugada y ventana de 30 min</td>
                </tr>
                <tr>
                  <td>Job En-Route Time</td>
                  <td>¿Otro día? Start validado en FHL, logística y sobreasignación</td>
                </tr>
                <tr>
                  <td>Job Completed Time</td>
                  <td>Fin del TMR (CEO y UTEN) y umbral de 8 h</td>
                </tr>
                <tr>
                  <td>Municipality</td>
                  <td>Corte nocturno 21:00 (Popayán, Santander, Patía) o 16:00 (resto)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h4>Orden de prioridad</h4>
            <p className={styles.lead}>
              La exclusión principal es una sola, en este orden. Si coinciden sobreasignación y
              logística especial, gana sobreasignación y se registran las dos causas. El analista
              puede cambiar la exclusión en el detalle de la orden.
            </p>
            <ol className={styles.priority}>
              {PRIORITY.map((rule) => (
                <li key={rule.n} className={styles[rule.tone]}>
                  <span className={styles.badge}>{rule.n}</span>
                  <span>{rule.title}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h4>Detalle de cada regla</h4>
            <div className={styles.cards}>
              {PRIORITY.map((rule) => (
                <article key={rule.n} className={styles.card}>
                  <div className={styles.cardHead}>
                    <span className={`${styles.badge} ${styles[rule.tone]}`}>{rule.n}</span>
                    <h5>{rule.title}</h5>
                  </div>
                  <p className={styles.when}>{rule.when}</p>
                  <p className={styles.fieldLine}>
                    Campos: {rule.fields.map((field) => (
                      <code key={field}>{field}</code>
                    ))}
                  </p>
                  <ul>
                    {rule.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className={styles.effect}>{rule.effect}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.box}>
            <h4>TMR CEO y TMR UTEN</h4>
            <ul>
              <li>
                <strong>TMR CEO (frío):</strong> Start Time → Job Completed Time. No se mueve.
              </li>
              <li>
                <strong>TMR UTEN:</strong> Start validado → Job Completed Time. El Start validado es
                En-Route si la exclusión es fuera de horario, logística especial o sobreasignación;
                si no, es el Start original.
              </li>
              <li>
                R{"<"}8 H / R{">"}8 H del resumen validado usa el TMR UTEN.
              </li>
            </ul>
          </section>
        </div>

        <footer className={styles.footer}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
