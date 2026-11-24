"use client";

import Link from "next/link";
import { ClipboardList, Flower2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FLUJOS_CARDS } from "./constants";
import styles from "./FlujosDashboard.module.scss";

const ICON_MAP = {
  Flower2,
  ClipboardList,
} as const;

export default function FlujosDashboard() {
  const { user } = useAuth();
  if (user && user.role !== "ADMIN") {
    return (
      <div className={styles.container}>
        <p className={styles.subtitle}>Esta sección solo está disponible para administrador.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Flujos</h2>
        <p className={styles.subtitle}>
          Operaciones con programación, visitas de campo y radicado propio.
        </p>
      </div>

      <div className={styles.grid}>
        {FLUJOS_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon] ?? ClipboardList;
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
