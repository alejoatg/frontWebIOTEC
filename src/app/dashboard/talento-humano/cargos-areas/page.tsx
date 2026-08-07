"use client";

import { Card } from "@/components";
import { CargosAreasContainer, TalentoHumanoNav } from "@/features/talento-humano";
import styles from "../page.module.scss";

export default function CargosAreasPage() {
  return (
    <div className={styles.page}>
      <TalentoHumanoNav />
      <Card title="Cargos, áreas y zonas">
        <CargosAreasContainer />
      </Card>
    </div>
  );
}
