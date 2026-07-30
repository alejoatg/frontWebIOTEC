import type {
  FormReportColumn,
  FormReportConfig,
  FormReportDetailSection,
} from "../config/formReportTypes";
import { humanizeFieldKey } from "./formatters";

const DETAIL_SKIP_KEYS = new Set([
  "id",
  "submittedBy",
  "submission",
  "metadata",
  "createdAt",
  "updatedAt",
  "syncedAt",
  "startedAt",
  "completedAt",
  "localId",
  "displayName",
  "deviceId",
  "files",
]);

/**
 * Columnas del listado: las prioritarias de `listColumns` + el resto de
 * campos definidos en `detailSections` de la plantilla.
 */
export function buildListColumns(config: FormReportConfig): FormReportColumn[] {
  const seen = new Set<string>();
  const columns: FormReportColumn[] = [];

  for (const col of config.listColumns) {
    if (seen.has(col.key)) continue;
    seen.add(col.key);
    columns.push(col);
  }

  for (const section of config.detailSections) {
    for (const key of section.keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      columns.push({ key, label: humanizeFieldKey(key) });
    }
  }

  return columns;
}

/**
 * Secciones de detalle: todas las keys de la plantilla (aunque vacías) +
 * campos adicionales presentes en el registro.
 */
export function buildDetailSectionsForRecord(
  config: FormReportConfig,
  record: Record<string, unknown>,
): FormReportDetailSection[] {
  const covered = new Set<string>();
  const sections: FormReportDetailSection[] = config.detailSections.map(
    (section) => {
      section.keys.forEach((key) => covered.add(key));
      return section;
    },
  );

  for (const field of config.evidenceFields) {
    covered.add(field.key);
  }
  if (config.locationField) {
    covered.add(config.locationField.latKey);
    covered.add(config.locationField.lngKey);
  }

  const extraKeys = Object.keys(record).filter((key) => {
    if (DETAIL_SKIP_KEYS.has(key) || covered.has(key)) return false;
    const value = record[key];
    if (value === undefined || value === null || value === "") return false;
    // Evitar volcar URLs de evidencias legacy ya mostradas en galería
    if (typeof value === "string" && value.startsWith("http")) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  if (extraKeys.length > 0) {
    sections.push({ title: "Otros datos", keys: extraKeys });
  }

  return sections;
}

export function hasFieldValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/** Secciones solo con campos con valor (impresión más compacta). */
export function buildPrintDetailSections(
  config: FormReportConfig,
  record: Record<string, unknown>,
): FormReportDetailSection[] {
  return buildDetailSectionsForRecord(config, record)
    .map((section) => ({
      ...section,
      keys: section.keys.filter((key) => hasFieldValue(record[key])),
    }))
    .filter((section) => section.keys.length > 0);
}
