"use client";

import { useState } from "react";
import styles from "./LocationMap.module.scss";

export interface LocationMapProps {
  lat: number;
  lng: number;
  /** Etiqueta del punto (ej. "Ubicación de la inspección"). */
  label?: string;
}

type ViewMode = "map" | "streetview";

/**
 * Mapa embebido de Google (Maps Embed API) con alternancia Mapa / Street View.
 * Requiere `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps Embed API habilitada en Google Cloud).
 */
export default function LocationMap({ lat, lng, label }: LocationMapProps) {
  const [mode, setMode] = useState<ViewMode>("map");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const coords = `${lat},${lng}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${coords}`;

  if (!apiKey) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.missingKey}>
          Configura <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para visualizar el mapa.
        </p>
        <a href={googleMapsUrl} target="_blank" rel="noreferrer" className={styles.link}>
          Ver coordenadas en Google Maps ({coords})
        </a>
      </div>
    );
  }

  const src =
    mode === "map"
      ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coords}&zoom=17&maptype=satellite`
      : `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${coords}&heading=0&pitch=0&fov=90`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === "map" ? styles.tabActive : styles.tab}
            onClick={() => setMode("map")}
          >
            Mapa
          </button>
          <button
            type="button"
            className={mode === "streetview" ? styles.tabActive : styles.tab}
            onClick={() => setMode("streetview")}
          >
            Street View
          </button>
        </div>
        <a href={googleMapsUrl} target="_blank" rel="noreferrer" className={styles.link}>
          Abrir en Google Maps ↗
        </a>
      </div>
      <div className={styles.frameBox}>
        <iframe
          key={mode}
          title={label ?? "Ubicación"}
          src={src}
          className={styles.iframe}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className={styles.coords}>{coords}</p>
    </div>
  );
}
