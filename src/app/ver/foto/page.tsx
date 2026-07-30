"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { MediaImage } from "@/components/MediaImage";
import { API_URL } from "@/lib/api";
import styles from "./MediaViewPage.module.scss";

/**
 * Vista amplia de una evidencia.
 * Query:
 * - `key` (preferido): clave S3 `submissions/...`
 * - `url` (fallback): URL http original
 * - `label` (opcional): título
 */
export default function MediaViewPage() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key")?.trim() ?? "";
  const urlParam = searchParams.get("url")?.trim() ?? "";
  const label = searchParams.get("label")?.trim() || "Evidencia";

  const src = useMemo(() => {
    if (key.startsWith("submissions/") && !key.includes("..")) {
      return key;
    }
    if (urlParam.startsWith("http")) {
      return urlParam;
    }
    return null;
  }, [key, urlParam]);

  const openRaw = () => {
    if (!src) return;
    if (src.startsWith("submissions/")) {
      window.open(
        `${API_URL}/api/files/stream?key=${encodeURIComponent(src)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    window.open(src, "_blank", "noopener,noreferrer");
  };

  if (!src) {
    return (
      <div className={styles.error}>
        <p>No se indicó una foto válida.</p>
        <p className={styles.hint}>
          Use <code>?key=submissions/…</code> o <code>?url=https://…</code>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => window.close()}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.toolbar}>
        <h1 className={styles.title}>{label}</h1>
        <div className={styles.actions}>
          <Button type="button" size="sm" onClick={openRaw}>
            Abrir archivo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.close()}
          >
            Cerrar
          </Button>
        </div>
      </header>
      <main className={styles.stage}>
        <MediaImage src={src} alt={label} className={styles.image} />
      </main>
    </div>
  );
}
