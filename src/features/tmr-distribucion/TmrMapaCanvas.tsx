"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { CAUCA_CENTER } from "./geo-catalog";
import { circleRadius, heatColor, type MapMetric, type MapPoint } from "./mapa";
import styles from "./TmrMapa.module.scss";
import "leaflet/dist/leaflet.css";

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) {
      map.setView([CAUCA_CENTER.lat, CAUCA_CENTER.lng], 8);
      return;
    }
    const bounds = L.latLngBounds(points.map((item) => [item.lat, item.lng]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
  }, [map, points]);
  return null;
}

interface Props {
  points: MapPoint[];
  metric: MapMetric;
  selected: string | null;
  onSelect: (key: string) => void;
}

export default function TmrMapaCanvas({ points, metric, selected, onSelect }: Props) {
  return (
    <MapContainer
      className={styles.map}
      center={[CAUCA_CENTER.lat, CAUCA_CENTER.lng]}
      zoom={8}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {points.map((point) => {
        const value = metric === "jobs" ? point.jobs : metric === "ejec" ? point.ejecMedio : metric === "tmr" ? point.tmrUtenMedio : point.despMedio;
        const color = heatColor(value, metric);
        const active = selected === point.key;
        return (
          <CircleMarker
            key={point.key}
            center={[point.lat, point.lng]}
            radius={circleRadius(point) + (active ? 4 : 0)}
            pathOptions={{
              color: active ? "#0f172a" : "#ffffff",
              weight: active ? 2 : 1,
              fillColor: color,
              fillOpacity: 0.72,
            }}
            eventHandlers={{ click: () => onSelect(point.key) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{point.name}</strong>
              {point.subtitle && point.subtitle !== point.name ? <div>{point.subtitle}</div> : null}
              <div>{point.jobs} jobs</div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
