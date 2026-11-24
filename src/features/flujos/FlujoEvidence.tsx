"use client";

import { MediaImage } from "@/components/MediaImage";
import { mediaViewPageUrl } from "@/lib/mediaViewUrl";
import styles from "./FlujoDetalle.module.scss";

function asUrls(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.startsWith("http"));
  }
  return [];
}

export function FlujoEvidence({
  label,
  value,
  signature = false,
}: {
  label: string;
  value: unknown;
  signature?: boolean;
}) {
  const urls = asUrls(value);
  if (urls.length === 0) return null;
  return (
    <div className={styles.evidenceGrid}>
      {urls.map((url, i) => {
        const viewUrl = mediaViewPageUrl(url, { label: `${label} ${i + 1}` });
        return (
          <figure key={`${url}-${i}`} className={styles.evidenceItem}>
            <figcaption>
              {label}
              {urls.length > 1 ? ` ${i + 1}` : ""}
            </figcaption>
            <MediaImage
              src={url}
              alt={`${label} ${i + 1}`}
              className={signature ? styles.signatureImg : styles.photoImg}
            />
            {viewUrl ? (
              <a href={viewUrl} target="_blank" rel="noreferrer" className={styles.evidenceLink}>
                Ver amplia
              </a>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
