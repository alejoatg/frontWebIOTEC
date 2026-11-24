"use client";

import Link from "next/link";
import { AlertTriangle, Bike, FileText, Zap, Map } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FORM_REPORTS } from "../../config/formReportsRegistry";
import { FORMULARIOS_CARDS } from "../../constants";
import {
  isExternoRole,
  isFormReportVisibleToRole,
} from "../../lib/externoAccess";
import styles from "./FormulariosDashboard.module.scss";

const ICON_MAP = {
  AlertTriangle,
  Bike,
  FileText,
  Zap,
  Map,
} as const;

export default function FormulariosDashboard() {
  const { user } = useAuth();
  const isExterno = isExternoRole(user?.role);
  const cards = isExterno
    ? FORMULARIOS_CARDS.filter((card) => {
        const form = FORM_REPORTS.find((item) => item.id === card.id);
        return isFormReportVisibleToRole(form, "EXTERNO");
      })
    : FORMULARIOS_CARDS;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{isExterno ? "Formularios" : "Formularios ODK"}</h2>
        <p className={styles.subtitle}>
          {isExterno
            ? "Consulta los envíos de los formatos autorizados."
            : "Consulta los registros de los formularios legacy de ODK Central"}
        </p>
      </div>

      {cards.length === 0 ? (
        <p className={styles.subtitle}>No hay formularios autorizados por ahora.</p>
      ) : (
      <div className={styles.grid}>
        {cards.map((card) => {
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
      )}
    </div>
  );
}
