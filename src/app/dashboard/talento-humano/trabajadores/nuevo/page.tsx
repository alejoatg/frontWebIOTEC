"use client";

import { Card } from "@/components";
import { TalentoHumanoNav, AgregarTrabajadorForm } from "@/features/talento-humano";
import styles from "../../page.module.scss";

export default function NuevoTrabajadorPage() {
  return (
    <div className={styles.page}>
      <TalentoHumanoNav />
      <Card title="Agregar trabajador">
        <AgregarTrabajadorForm />
      </Card>
    </div>
  );
}
