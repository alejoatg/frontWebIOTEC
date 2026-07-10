"use client";

import { useEffect, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { FormLocationPoint } from "../../types/formLocations";
import { DEFAULT_MAP_CENTER } from "../../types/formLocations";
import styles from "./InspectionsMapCanvas.module.scss";

export interface InspectionsMapCanvasProps {
  points: FormLocationPoint[];
  onSelect: (point: FormLocationPoint) => void;
  selectedId?: string | null;
}

function ClusteredMarkers({
  points,
  onSelect,
  selectedId,
}: InspectionsMapCanvasProps) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!map || typeof google === "undefined") return;

    const clusterer = new MarkerClusterer({ map });
    const markers: google.maps.Marker[] = [];

    for (const p of points) {
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        title: `${p.label} — ${p.formTitle}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: selectedId === p.id ? 10 : 8,
          fillColor: p.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => onSelectRef.current(p));
      markers.push(marker);
    }

    clusterer.addMarkers(markers);

    if (points.length === 1) {
      map.setCenter({ lat: points[0].lat, lng: points[0].lng });
      map.setZoom(15);
    } else if (points.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 48);
      google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const z = map.getZoom();
        if (z != null && z > 16) map.setZoom(16);
      });
    }

    return () => {
      clusterer.clearMarkers();
      clusterer.setMap(null);
      markers.forEach((m) => m.setMap(null));
    };
  }, [map, points, selectedId]);

  return null;
}

export default function InspectionsMapCanvas({
  points,
  onSelect,
  selectedId,
}: InspectionsMapCanvasProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={styles.missingKey}>
        <p>
          Configura <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para ver el mapa
          de inspecciones.
        </p>
        <p className={styles.hint}>
          Habilita <strong>Maps JavaScript API</strong> (además de Maps Embed API)
          en Google Cloud. Ver <code>web/docs/google-maps-setup.md</code>.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.mapWrap}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={DEFAULT_MAP_CENTER}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className={styles.map}
        >
          <ClusteredMarkers
            points={points}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        </Map>
      </APIProvider>
    </div>
  );
}
