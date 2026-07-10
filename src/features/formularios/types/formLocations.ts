export type FormLocationFormId =
  | "atu-formato-unico"
  | "pghs-005-03-inspeccion-terreno"
  | "inspeccion-preoperacional-vehiculos"
  | "inspeccion-preoperacional-motocicletas";

export interface FormLocationPoint {
  id: string;
  formId: FormLocationFormId;
  formSlug: string;
  formTitle: string;
  color: string;
  label: string;
  fecha: string;
  lat: number;
  lng: number;
  submittedByName: string | null;
}

export interface FormLocationsResponse {
  data: FormLocationPoint[];
  total: number;
  forms: Array<{
    id: FormLocationFormId;
    slug: string;
    title: string;
    color: string;
  }>;
}

export const MAP_FORM_OPTIONS: Array<{
  id: FormLocationFormId;
  label: string;
  color: string;
}> = [
  { id: "atu-formato-unico", label: "ATU", color: "#d97706" },
  { id: "pghs-005-03-inspeccion-terreno", label: "PGHS", color: "#059669" },
  { id: "inspeccion-preoperacional-vehiculos", label: "Vehículos", color: "#2563eb" },
  { id: "inspeccion-preoperacional-motocicletas", label: "Motos", color: "#dc2626" },
];

/** Centro por defecto: Popayán, Cauca. */
export const DEFAULT_MAP_CENTER = { lat: 2.4448, lng: -76.6147 };
