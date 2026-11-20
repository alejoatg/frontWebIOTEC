"use client";

import { use } from "react";
import { Card } from "@/components";
import { TalentoHumanoNav } from "@/features/talento-humano";
import AsignarSalarioForm from "@/features/talento-humano/components/AsignarSalarioForm";
import styles from "../../../page.module.scss";

export default function AsignarSalarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className={styles.page}>
      <TalentoHumanoNav />
      <Card title="Asignar salario">
        <AsignarSalarioForm employeeId={id} />
      </Card>
    </div>
  );
}
