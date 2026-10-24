import { CatalogDetailContainer } from "@/features/catalogs";
import AdminOnly from "@/features/dashboard/components/AdminOnly/AdminOnly";
import styles from "./page.module.scss";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function CatalogDetailPage({ params }: Props) {
  const { code } = await params;

  return (
    <AdminOnly title="Catálogo">
      <div className={styles.page}>
        <CatalogDetailContainer code={code} />
      </div>
    </AdminOnly>
  );
}
