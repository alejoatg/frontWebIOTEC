"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { FormLocationPoint } from "../../types/formLocations";
import { DEFAULT_MAP_CENTER } from "../../types/formLocations";
import styles from "./InspectionsMapCanvas.module.scss";
import "leaflet/dist/leaflet.css";

function FitPoints({ points }: { points: FormLocationPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
      return;
    }
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((item) => [item.lat, item.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
      return;
    }
    map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], 12);
  }, [map, points]);
  return null;
}

interface Props {
  points: FormLocationPoint[];
  onSelect: (point: FormLocationPoint) => void;
  selectedId?: string | null;
}

export default function InspectionsMapLeaflet({ points, onSelect, selectedId }: Props) {
  return (
    <div className={styles.mapWrap}>
      <MapContainer
        className={styles.map}
        center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
        zoom={12}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitPoints points={points} />
        {points.map((point) => {
          const active = selectedId === point.id;
          return (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              radius={active ? 11 : 8}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: point.color,
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onSelect(point) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <strong>{point.label}</strong>
                <div>{point.formTitle}</div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
