"use client";

import { Card } from "@/components";
import { CatalogsListContainer } from "@/features/catalogs";
import styles from "./page.module.scss";

export default function CatalogosPage() {
  return (
    <div className={styles.page}>
      <Card title="Catálogos del sistema">
        <CatalogsListContainer />
      </Card>
    </div>
  );
}
