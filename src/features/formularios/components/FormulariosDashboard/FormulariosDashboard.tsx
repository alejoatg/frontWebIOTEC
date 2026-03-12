"use client";

import Link from "next/link";
import { Bike, FileText } from "lucide-react";
import { FORMULARIOS_CARDS } from "../../constants";
import styles from "./FormulariosDashboard.module.scss";

const ICON_MAP = {
  Bike,
  FileText,
} as const;

export default function FormulariosDashboard() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Formularios ODK</h2>
        <p className={styles.subtitle}>
          Consulta los registros de los formularios legacy de ODK Central
        </p>
      </div>

      <div className={styles.grid}>
        {FORMULARIOS_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon as keyof typeof ICON_MAP] ?? FileText;
          return (
            <Link
              key={card.id}
              href={card.path}
              className={styles.card}
              style={{ "--card-color": card.color } as React.CSSProperties}
            >
              <div className={styles.cardIcon}>
                <Icon size={32} />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDescription}>{card.description}</p>
              </div>
              <div className={styles.cardArrow}>→</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
