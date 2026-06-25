import type { FormReportConfig } from "../config/formReportTypes";
import { humanizeFieldKey } from "./formatters";
import { resolveMediaStreamUrl } from "@/lib/mediaUrl";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportCell {
  text: string;
  /** Primera URL para hipervínculo en Excel (si aplica). */
  link?: string;
}

const SKIP_KEYS = new Set([
  "submittedBy",
  "submission",
  "metadata",
  "createdAt",
  "updatedAt",
]);

const META_EXPORT_KEYS = [
  "syncedAt",
  "startedAt",
  "completedAt",
  "localId",
  "displayName",
  "deviceId",
  "submittedByName",
  "submittedByEmail",
] as const;

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("http");
}

function linkLabel(fieldKey: string, index?: number): string {
  const base = humanizeFieldKey(fieldKey);
  return index != null ? `${base} ${index + 1}` : base;
}

function toViewableUrl(url: string): string {
  return resolveMediaStreamUrl(url);
}

function formatUrlEntry(url: string, label: string): ExportCell {
  const viewUrl = toViewableUrl(url);
  return { text: `${label}: ${viewUrl}`, link: viewUrl };
}

function formatValue(key: string, value: unknown): ExportCell {
  if (value === undefined || value === null || value === "") {
    return { text: "" };
  }

  if (isHttpUrl(value)) {
    return formatUrlEntry(value, linkLabel(key));
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return { text: "" };

    const allStrings = value.every((item) => typeof item === "string");
    if (allStrings) {
      const urls = value.filter(isHttpUrl);
      if (urls.length > 0) {
        const parts = urls.map((url, i) => formatUrlEntry(url, linkLabel(key, i)));
        return {
          text: parts.map((p) => p.text).join("\n"),
          link: parts[0]?.link,
        };
      }
      return { text: value.join(", ") };
    }

    const tagged = value as Array<{
      url?: string;
      uri?: string;
      tipo?: string;
      tipoOtro?: string;
      firma?: string;
      nombre?: string;
    }>;

    if (
      tagged.some(
        (item) =>
          isHttpUrl(item?.url) || isHttpUrl(item?.uri) || isHttpUrl(item?.firma),
      )
    ) {
      const parts: ExportCell[] = [];
      tagged.forEach((item, i) => {
        const url = item.url ?? item.uri ?? item.firma;
        if (!isHttpUrl(url)) return;
        const tipo =
          item.tipo === "other" && item.tipoOtro?.trim()
            ? item.tipoOtro.trim()
            : item.tipo ?? item.nombre ?? linkLabel(key, i);
        parts.push(formatUrlEntry(url, String(tipo)));
      });
      if (parts.length > 0) {
        return {
          text: parts.map((p) => p.text).join("\n"),
          link: parts[0]?.link,
        };
      }
    }

    const names = tagged
      .map((item) => item.nombre?.trim())
      .filter(Boolean)
      .join(", ");
    if (names) return { text: names };

    return { text: JSON.stringify(value) };
  }

  if (typeof value === "object") {
    return { text: JSON.stringify(value) };
  }

  if (typeof value === "boolean") {
    return { text: value ? "Sí" : "No" };
  }

  return { text: String(value) };
}

function detailPageUrl(slug: string, id: string): string {
  const path = `/dashboard/formularios/${slug}/${id}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/** Claves exportables definidas en la config (detalle + evidencias + metadatos). */
export function getConfigExportFieldKeys(config: FormReportConfig): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(key);
  };

  push("enlaceDetalleWeb");
  push("id");

  for (const section of config.detailSections) {
    for (const key of section.keys) {
      push(key);
    }
  }

  for (const field of config.evidenceFields) {
    push(field.key);
  }

  META_EXPORT_KEYS.forEach(push);

  return ordered;
}

function collectOrderedKeys(
  config: FormReportConfig,
  rows: Record<string, unknown>[],
): string[] {
  const ordered = [...getConfigExportFieldKeys(config)];
  const seen = new Set(ordered);

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (SKIP_KEYS.has(key) || seen.has(key)) continue;
      seen.add(key);
      ordered.push(key);
    }
  }

  return ordered;
}

/** Aplana un registro del API a celdas listas para Excel/CSV. */
export function flattenRecordForExport(
  row: Record<string, unknown>,
  config: FormReportConfig,
): Record<string, ExportCell> {
  const cells: Record<string, ExportCell> = {};

  const id = row.id != null ? String(row.id) : "";
  if (id) {
    const url = detailPageUrl(config.slug, id);
    cells.enlaceDetalleWeb = { text: url, link: url };
  }

  for (const [key, value] of Object.entries(row)) {
    if (SKIP_KEYS.has(key)) continue;
    cells[key] = formatValue(key, value);
  }

  const submittedBy = row.submittedBy as { name?: string; email?: string } | undefined;
  if (submittedBy?.name) {
    cells.submittedByName = { text: submittedBy.name };
  }
  if (submittedBy?.email) {
    cells.submittedByEmail = { text: submittedBy.email };
  }

  return cells;
}

export function buildExportColumns(
  config: FormReportConfig,
  rows: Record<string, unknown>[],
): ExportColumn[] {
  const keys = collectOrderedKeys(config, rows);
  const labelOverrides: Record<string, string> = {
    enlaceDetalleWeb: "Enlace detalle (web)",
    submittedByName: "Técnico",
    submittedByEmail: "Email técnico",
  };

  for (const field of config.evidenceFields) {
    labelOverrides[field.key] = field.label;
  }

  return keys.map((key) => ({
    key,
    label: labelOverrides[key] ?? humanizeFieldKey(key),
  }));
}

export function buildExportMatrix(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  config: FormReportConfig,
): ExportCell[][] {
  return rows.map((row) => {
    const flat = flattenRecordForExport(row, config);
    return columns.map((col) => flat[col.key] ?? { text: "" });
  });
}
