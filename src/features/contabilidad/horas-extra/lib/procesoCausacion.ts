/**
 * Proceso donde causa el tiempo suplementario (digitación).
 *
 * Excepción fija en código: no usa catálogo API porque la lista es estable
 * y puede vincularse a topes/metas de horas extra por proceso.
 */

export const PROCESO_CAUSACION_OPTIONS = [
  { code: "alta_tension_centro", label: "Alta Tension Centro" },
  { code: "alta_tension_norte", label: "Alta Tension Norte" },
  { code: "alta_tension_sur", label: "Alta Tension Sur" },
  { code: "atencion_danos_centro", label: "Atencion Daños Centro" },
  { code: "atencion_danos_norte", label: "Atencion Daños Norte" },
  { code: "atencion_danos_sur", label: "Atencion Daños Sur" },
  { code: "lectura_uten", label: "Lectura UTEN" },
  { code: "lecturas_centro", label: "Lecturas Centro" },
  { code: "lecturas_norte", label: "Lecturas Norte" },
  { code: "lecturas_sur", label: "Lecturas Sur" },
  { code: "mantenimiento_centro", label: "Mantenimiento Centro" },
  { code: "mantenimiento_norte", label: "Mantenimiento Norte" },
  { code: "mantenimiento_sur", label: "Mantenimiento Sur" },
  { code: "mantenimiento_uten", label: "Mantenimiento UTEN" },
  { code: "podas", label: "Podas" },
  { code: "subestaciones", label: "Subestaciones" },
] as const;

export type ProcesoCausacionCode = (typeof PROCESO_CAUSACION_OPTIONS)[number]["code"];

export type ProcesoCausacionOption = (typeof PROCESO_CAUSACION_OPTIONS)[number];

/** Formato compatible con CatalogSelectField. */
export const PROCESO_CAUSACION_SELECT_OPTIONS = PROCESO_CAUSACION_OPTIONS.map(
  (item) => ({
    key: item.code,
    value: item.label,
  }),
);

export function isProcesoCausacionLabel(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return PROCESO_CAUSACION_OPTIONS.some((item) => item.label === trimmed);
}
