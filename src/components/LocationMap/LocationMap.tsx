"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "./LocationMap.module.scss";

export interface LocationMapProps {
  lat: number;
  lng: number;
  /** Etiqueta del punto (ej. "Ubicación de la inspección"). */
  label?: string;
}

const LocationMapCanvas = dynamic(() => import("./LocationMapCanvas"), {
  ssr: false,
  loading: () => <div className={styles.map} />,
});

/**
 * Mapa de un punto GPS con OpenStreetMap (sin API key).
 * Satélite usa teselas públicas de Esri.
 */
export default function LocationMap({ lat, lng, label }: LocationMapProps) {
  const [satellite, setSatellite] = useState(false);
  const coords = `${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={!satellite ? styles.tabActive : styles.tab}
            onClick={() => setSatellite(false)}
          >
            Mapa
          </button>
          <button
            type="button"
            className={satellite ? styles.tabActive : styles.tab}
            onClick={() => setSatellite(true)}
          >
            Satélite
          </button>
        </div>
        <a href={osmUrl} target="_blank" rel="noreferrer" className={styles.link}>
          Abrir en OpenStreetMap ↗
        </a>
      </div>
      <div className={styles.frameBox} title={label ?? "Ubicación"}>
        <LocationMapCanvas lat={lat} lng={lng} satellite={satellite} />
      </div>
      <p className={styles.coords}>{coords}</p>
    </div>
  );
}
