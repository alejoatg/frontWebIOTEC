import { CatalogDetailContainer } from "@/features/catalogs";
import styles from "./page.module.scss";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function CatalogDetailPage({ params }: Props) {
  const { code } = await params;

  return (
    <div className={styles.page}>
      <CatalogDetailContainer code={code} />
    </div>
  );
}
