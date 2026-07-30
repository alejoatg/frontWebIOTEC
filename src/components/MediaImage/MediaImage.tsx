"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { extractSubmissionKey } from "@/lib/mediaUrl";
import styles from "./MediaImage.module.scss";

export interface MediaImageProps {
  /**
   * URL http almacenada en BD (S3) o clave `submissions/...`
   * (p. ej. vista `/ver/foto?key=...`).
   */
  src: string;
  alt: string;
  className?: string;
}

/**
 * Muestra fotos/firmas de submissions: descarga vía API con sesión del navegador
 * (cross-origin) y renderiza un blob local. Necesario porque el bucket S3 es privado
 * y la sesión web vive en el dominio de la API, no en el de Next.js.
 */
export default function MediaImage({ src, alt, className }: MediaImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setFailed(false);
      setBlobUrl(null);

      const isKey = src?.startsWith("submissions/") && !src.includes("..");
      const isHttp = src?.startsWith("http");
      if (!isKey && !isHttp) {
        setFailed(true);
        return;
      }

      const key = isKey ? src : extractSubmissionKey(src);
      const fetchUrl = key
        ? `${API_URL}/api/files/stream?key=${encodeURIComponent(key)}`
        : src;

      try {
        const res = await fetch(fetchUrl, {
          credentials: key ? "include" : "omit",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return <span className={styles.error}>No se pudo cargar la imagen</span>;
  }

  if (!blobUrl) {
    return <div className={`${styles.placeholder} ${className ?? ""}`} aria-hidden />;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
