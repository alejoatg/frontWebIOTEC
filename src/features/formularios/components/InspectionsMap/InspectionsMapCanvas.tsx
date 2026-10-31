"use client";

import dynamic from "next/dynamic";
import type { FormLocationPoint } from "../../types/formLocations";
import styles from "./InspectionsMapCanvas.module.scss";

export interface InspectionsMapCanvasProps {
  points: FormLocationPoint[];
  onSelect: (point: FormLocationPoint) => void;
  selectedId?: string | null;
}

const LeafletMap = dynamic(() => import("./InspectionsMapLeaflet"), {
  ssr: false,
  loading: () => <div className={styles.mapWrap} />,
});

export default function InspectionsMapCanvas(props: InspectionsMapCanvasProps) {
  return <LeafletMap {...props} />;
}
