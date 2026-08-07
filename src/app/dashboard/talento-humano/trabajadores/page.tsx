"use client";

import { Card } from "@/components";
import { TalentoHumanoNav, TrabajadoresListContainer } from "@/features/talento-humano";
import styles from "../page.module.scss";

export default function TrabajadoresPage() {
  return (
    <div className={styles.page}>
      <TalentoHumanoNav />
      <Card title="Listado de trabajadores">
        <TrabajadoresListContainer />
      </Card>
    </div>
  );
}
