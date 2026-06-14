import type { FormReportEvidenceField } from "../config/formReportTypes";

export interface EvidenceItem {
  label: string;
  url: string;
}

const TIPO_FOTO_ATU_LABELS: Record<string, string> = {
  Panoramica: "Panorámica",
  Bajante: "Bajante",
  Herrajeria: "Herrería",
  Estructura: "Estructura",
  Dps: "DPS",
  Hilo_De_Guarda: "Hilo de Guarda",
  Aislamientos: "Aislamientos",
  Numero_De_Apoyo: "Número de Apoyo",
  Foto_telurometro: "Foto Telurómetro",
  Foto_conexion_telurometro: "Foto Conexión del Telurómetro",
  Foto_ejecucion_actividad: "Foto de Ejecución de Actividad",
  other: "Otro",
};

function taggedPhotoLabel(tipo: string, tipoOtro?: string): string {
  if (tipo === "other" && tipoOtro?.trim()) return tipoOtro.trim();
  return TIPO_FOTO_ATU_LABELS[tipo] ?? tipo;
}

export function collectEvidences(
  record: Record<string, unknown>,
  fields: FormReportEvidenceField[],
): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  for (const field of fields) {
    const raw = record[field.key];
    if (!raw) continue;
    if (field.tagged && Array.isArray(raw)) {
      (raw as Array<{ url?: string; tipo?: string; tipoOtro?: string }>).forEach((item, i) => {
        const url = item?.url;
        if (typeof url === "string" && url.startsWith("http") && item.tipo) {
          items.push({
            label: `${taggedPhotoLabel(item.tipo, item.tipoOtro)} ${i + 1}`,
            url,
          });
        }
      });
      continue;
    }
    if (field.multiple && Array.isArray(raw)) {
      (raw as string[]).forEach((url, i) => {
        if (typeof url === "string" && url.startsWith("http")) {
          items.push({ label: `${field.label} ${i + 1}`, url });
        }
      });
    } else if (typeof raw === "string" && raw.startsWith("http")) {
      items.push({ label: field.label, url: raw });
    }
  }

  // Registros legacy ATU (tipo global + URLs sin tagged)
  const tagged = record.fotosActividadTagged;
  const legacyUrls = record.fotosActividadUrls;
  const legacyTipo = record.tipoFoto;
  const legacyTipoOtro = record.tipoFotoOtro;
  if (
    (!tagged || (Array.isArray(tagged) && tagged.length === 0)) &&
    Array.isArray(legacyUrls) &&
    legacyUrls.length > 0
  ) {
    const tipoLabel =
      legacyTipo === "other" && typeof legacyTipoOtro === "string"
        ? legacyTipoOtro
        : taggedPhotoLabel(String(legacyTipo ?? "Foto"));
    legacyUrls.forEach((url, i) => {
      if (typeof url === "string" && url.startsWith("http")) {
        items.push({ label: `${tipoLabel} ${i + 1}`, url });
      }
    });
  }

  // Registros legacy PGHS (una sola URL antes de galería múltiple)
  for (const [arrayKey, legacyKey, label] of [
    ["registroFotograficoAntesUrls", "registroFotograficoAntesUrl", "Registro fotográfico (antes)"],
    ["registroFotograficoDuranteUrls", "registroFotograficoDuranteUrl", "Registro fotográfico (durante)"],
  ] as const) {
    const arrayVal = record[arrayKey];
    const legacyVal = record[legacyKey];
    if (
      (!arrayVal || (Array.isArray(arrayVal) && arrayVal.length === 0)) &&
      typeof legacyVal === "string" &&
      legacyVal.startsWith("http")
    ) {
      items.push({ label, url: legacyVal });
    }
  }

  // Registros legacy preoperacional vehículos
  for (const [arrayKey, legacyKey, label] of [
    ["fotoNovedadUrls", "fotoNovedadUrl", "Fotos de novedad"],
  ] as const) {
    const arrayVal = record[arrayKey];
    const legacyVal = record[legacyKey];
    if (
      (!arrayVal || (Array.isArray(arrayVal) && arrayVal.length === 0)) &&
      typeof legacyVal === "string" &&
      legacyVal.startsWith("http")
    ) {
      items.push({ label, url: legacyVal });
    }
  }

  const firmaConductor = record.firmaConductorUrl;
  const fotoNombreConductor = record.fotoNombreConductorUrl;
  if (
    (!firmaConductor || (typeof firmaConductor === "string" && !firmaConductor.startsWith("http"))) &&
    typeof fotoNombreConductor === "string" &&
    fotoNombreConductor.startsWith("http")
  ) {
    items.push({ label: "Firma del conductor", url: fotoNombreConductor });
  }

  const files = record.files as Array<{ fieldKey?: string; s3Url?: string }> | undefined;
  if (Array.isArray(files)) {
    files.forEach((file, i) => {
      if (file.s3Url?.startsWith("http")) {
        items.push({
          label: file.fieldKey ? `Adjunto: ${file.fieldKey}` : `Adjunto ${i + 1}`,
          url: file.s3Url,
        });
      }
    });
  }

  return items;
}
