"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import styles from "./LocationMap.module.scss";
import "leaflet/dist/leaflet.css";

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [map, lat, lng]);
  return null;
}

export default function LocationMapCanvas({
  lat,
  lng,
  satellite,
}: {
  lat: number;
  lng: number;
  satellite: boolean;
}) {
  return (
    <MapContainer
      className={styles.map}
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom
    >
      {satellite ? (
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}
      <Recenter lat={lat} lng={lng} />
      <CircleMarker
        center={[lat, lng]}
        radius={10}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          fillColor: "#0f766e",
          fillOpacity: 0.9,
        }}
      />
    </MapContainer>
  );
}
