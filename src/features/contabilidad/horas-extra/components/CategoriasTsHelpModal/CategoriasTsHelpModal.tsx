"use client";

import { useEffect } from "react";
import { Button } from "@/components";
import styles from "./CategoriasTsHelpModal.module.scss";

export type CategoriaTsCode =
  | "RD"
  | "RN"
  | "TSD"
  | "TSN"
  | "HEDD"
  | "HEND"
  | "DISPONIBILIDAD";

const CATEGORIAS: Array<{
  code: CategoriaTsCode;
  title: string;
  when: string;
  autofill: string;
  multiplier: string;
}> = [
  {
    code: "RD",
    title: "Recargo dominical / festivo",
    when: "Horas ordinarias trabajadas en domingo o festivo (no son horas extra completas).",
    autofill: "No se autocompleta: debe digitarse manualmente cuando aplique.",
    multiplier: "× 0,80 sobre el valor hora",
  },
  {
    code: "RN",
    title: "Recargo nocturno",
    when: "Trabajo en horario nocturno (21:00 a 6:00) dentro de la jornada habitual en día hábil.",
    autofill: "No se autocompleta: debe digitarse manualmente cuando aplique.",
    multiplier: "× 0,35 sobre el valor hora",
  },
  {
    code: "TSD",
    title: "Tiempo suplementario diurno",
    when: "Horas extra en día hábil, entre 6:00 y 21:00.",
    autofill: "Se propone al indicar Fecha + Inicio + Fin.",
    multiplier: "× 1,25 sobre el valor hora",
  },
  {
    code: "TSN",
    title: "Tiempo suplementario nocturno",
    when: "Horas extra en día hábil, entre 21:00 y 6:00.",
    autofill: "Se propone al indicar Fecha + Inicio + Fin.",
    multiplier: "× 1,75 sobre el valor hora",
  },
  {
    code: "HEDD",
    title: "TS dominical/festivo diurno",
    when: "Horas extra en domingo o festivo, entre 6:00 y 21:00.",
    autofill: "Se propone al indicar Fecha + Inicio + Fin.",
    multiplier: "× 2,05 sobre el valor hora",
  },
  {
    code: "HEND",
    title: "TS dominical/festivo nocturno",
    when: "Horas extra en domingo o festivo, entre 21:00 y 6:00.",
    autofill: "Se propone al indicar Fecha + Inicio + Fin.",
    multiplier: "× 2,55 sobre el valor hora",
  },
  {
    code: "DISPONIBILIDAD",
    title: "Disponibilidad",
    when: "Tiempo de disponibilidad en AT/subestaciones (no necesariamente trabajo efectivo).",
    autofill: "No se autocompleta: debe digitarse manualmente.",
    multiplier: "× 2,05 × 20% sobre el valor hora",
  },
];

interface CategoriasTsHelpModalProps {
  open: boolean;
  focusCode?: CategoriaTsCode | null;
  onClose: () => void;
}

export default function CategoriasTsHelpModal({
  open,
  focusCode,
  onClose,
}: CategoriasTsHelpModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !focusCode) return;
    const el = document.getElementById(`categoria-ts-${focusCode}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, focusCode]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-labelledby="categorias-ts-title">
        <header className={styles.header}>
          <div>
            <h2 id="categorias-ts-title" className={styles.title}>
              Categorías de tiempo suplementario
            </h2>
            <p className={styles.subtitle}>
              Guía para ubicar las horas en cada columna de la planilla UTEN.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </header>

        <div className={styles.body}>
          <section className={styles.rules}>
            <h3 className={styles.rulesTitle}>Reglas de autollenado</h3>
            <ul>
              <li>
                <strong>Diurno:</strong> 6:00 a 21:00 · <strong>Nocturno:</strong> 21:00 a 6:00
                (legislación colombiana).
              </li>
              <li>
                Si la fecha es <strong>domingo o festivo</strong>, las horas extra van en{" "}
                <strong>HEDD</strong> / <strong>HEND</strong> en lugar de TSD / TSN.
              </li>
              <li>
                Si el tramo cruza las 6:00, las 21:00 o la medianoche, se reparte en bloques de
                media hora.
              </li>
              <li>
                <strong>RD</strong>, <strong>RN</strong> y <strong>Disponibilidad</strong> no se
                calculan solas: complételas manualmente si corresponde.
              </li>
              <li>
                Puede corregir cualquier celda; use <strong>Autollenar</strong> en la fila para
                volver a calcular desde Fecha + Inicio + Fin.
              </li>
            </ul>
          </section>

          <div className={styles.list}>
            {CATEGORIAS.map((cat) => (
              <article
                key={cat.code}
                id={`categoria-ts-${cat.code}`}
                className={`${styles.card} ${focusCode === cat.code ? styles.cardFocus : ""}`}
              >
                <div className={styles.cardHead}>
                  <span className={styles.code}>{cat.code}</span>
                  <h3 className={styles.cardTitle}>{cat.title}</h3>
                </div>
                <p className={styles.when}>{cat.when}</p>
                <p className={styles.autofill}>{cat.autofill}</p>
                <p className={styles.multiplier}>{cat.multiplier}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function categoriaShortLabel(code: CategoriaTsCode): string {
  if (code === "DISPONIBILIDAD") return "Disp.";
  return code;
}
