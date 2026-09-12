"use client";

import { use } from "react";
import { Card } from "@/components";
import { TalentoHumanoNav, AgregarTrabajadorForm } from "@/features/talento-humano";
import styles from "../../../page.module.scss";

export default function EditarTrabajadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className={styles.page}>
      <TalentoHumanoNav />
      <Card title="Editar trabajador">
        <AgregarTrabajadorForm employeeId={id} />
      </Card>
    </div>
  );
}
