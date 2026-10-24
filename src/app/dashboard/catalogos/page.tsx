"use client";

import { Card } from "@/components";
import { CatalogsListContainer } from "@/features/catalogs";
import AdminOnly from "@/features/dashboard/components/AdminOnly/AdminOnly";
import styles from "./page.module.scss";

export default function CatalogosPage() {
  return (
    <AdminOnly title="Catálogos del sistema">
      <div className={styles.page}>
        <Card title="Catálogos del sistema">
          <CatalogsListContainer />
        </Card>
      </div>
    </AdminOnly>
  );
}
