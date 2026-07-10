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
 * Mapa embebido de Google.
 * - Con `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Maps Embed API (mapa satélite + Street View).
 * - Sin key: iframe público de Google Maps (solo mapa; suficiente para ver el pin).
 */
export default function LocationMap({ lat, lng, label }: LocationMapProps) {
  const [mode, setMode] = useState<ViewMode>("map");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const coords = `${lat},${lng}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(coords)}`;

  const officialSrc =
    mode === "map"
      ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coords}&zoom=17&maptype=satellite`
      : `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${coords}&heading=0&pitch=0&fov=90`;

  // Fallback sin API key (endpoint público de embed).
  const legacySrc = `https://maps.google.com/maps?q=${encodeURIComponent(coords)}&z=17&t=k&output=embed`;

  const src = apiKey ? officialSrc : legacySrc;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {apiKey ? (
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
        ) : (
          <p className={styles.fallbackNote}>
            Mapa en modo básico (configura <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para
            Street View). Ver <code>web/docs/google-maps-setup.md</code>.
          </p>
        )}
        <a href={googleMapsUrl} target="_blank" rel="noreferrer" className={styles.link}>
          Abrir en Google Maps ↗
        </a>
      </div>
      <div className={styles.frameBox}>
        <iframe
          key={apiKey ? mode : "legacy"}
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
