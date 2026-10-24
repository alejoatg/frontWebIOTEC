import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import JSZip from "jszip";
import { extractSubmissionKey, resolveMediaStreamUrl } from "@/lib/mediaUrl";
import type { FormReportConfig } from "../config/formReportTypes";
import { FormSubmissionSheet } from "../components/shared/FormSubmissionPrint";
import { collectEvidences, type EvidenceItem } from "./collectEvidences";
import { downloadBlob } from "./downloadBlob";
import { renderSheetToPdfBlob } from "./exportPdf";

const MEDIA_CONCURRENCY = 4;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type ReportProgress = (message: string) => void;

/** Nombre seguro para archivo: sin tildes, espacios ni caracteres especiales. */
export function toFileSlug(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "archivo";
}

/** Monta la hoja de informe fuera de pantalla, genera el PDF y la desmonta. */
async function buildReportPdf(
  config: FormReportConfig,
  record: Record<string, unknown>,
): Promise<Blob> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:absolute;left:-10000px;top:0;background:#fff;pointer-events:none;";
  document.body.appendChild(host);

  const root = createRoot(host);
  let sheet: HTMLElement | null = null;
  try {
    flushSync(() => {
      root.render(
        createElement(FormSubmissionSheet, {
          config,
          record,
          variant: "pdf",
          ref: (el: HTMLElement | null) => {
            sheet = el;
          },
        }),
      );
    });
    if (!sheet) throw new Error("No se pudo preparar el reporte");
    return await renderSheetToPdfBlob(sheet, {
      footerLabel: `${config.title} · ${config.detailTitle(record)}`,
    });
  } finally {
    root.unmount();
    host.remove();
  }
}

interface FetchedEvidence {
  item: EvidenceItem;
  blob: Blob | null;
  error?: string;
}

async function fetchEvidence(item: EvidenceItem): Promise<FetchedEvidence> {
  try {
    const key = extractSubmissionKey(item.url);
    const res = await fetch(resolveMediaStreamUrl(item.url), {
      credentials: key ? "include" : "omit",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { item, blob: await res.blob() };
  } catch (err) {
    return {
      item,
      blob: null,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

async function fetchAllEvidences(
  items: EvidenceItem[],
  onProgress?: ReportProgress,
): Promise<FetchedEvidence[]> {
  const results: FetchedEvidence[] = new Array(items.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fetchEvidence(items[index]);
      done += 1;
      onProgress?.(`Descargando imágenes ${done}/${items.length}...`);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MEDIA_CONCURRENCY, items.length) }, worker),
  );
  return results;
}

export interface AddSubmissionResult {
  /** Fotos/firmas que no se pudieron descargar. */
  failures: string[];
  mediaCount: number;
}

/**
 * Agrega a una carpeta del ZIP el `reporte.pdf` (mismo formato que Imprimir) y las
 * fotos y firmas del registro en `evidencias/`.
 */
export async function addSubmissionToFolder(
  folder: JSZip,
  config: FormReportConfig,
  record: Record<string, unknown>,
  onProgress?: ReportProgress,
): Promise<AddSubmissionResult> {
  const evidences = collectEvidences(record, config.evidenceFields);

  onProgress?.("Generando reporte PDF...");
  const [pdf, fetched] = await Promise.all([
    buildReportPdf(config, record),
    fetchAllEvidences(evidences, onProgress),
  ]);

  folder.file("reporte.pdf", pdf);

  const padding = String(fetched.length).length;
  const failures: string[] = [];
  fetched.forEach(({ item, blob, error }, index) => {
    if (!blob) {
      failures.push(`${item.label}: ${error ?? "no se pudo descargar"}`);
      return;
    }
    const extension = EXTENSION_BY_MIME[blob.type] ?? "jpg";
    const order = String(index + 1).padStart(padding, "0");
    folder.file(`evidencias/${order}-${toFileSlug(item.label)}.${extension}`, blob);
  });

  if (failures.length > 0) {
    folder.file(
      "errores.txt",
      `No se pudieron descargar ${failures.length} archivo(s):\n\n${failures.join("\n")}\n`,
    );
  }

  return { failures, mediaCount: fetched.length };
}

export function generateZipBlob(zip: JSZip): Promise<Blob> {
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 3 },
  });
}

/**
 * Descarga un ZIP con el reporte en PDF (mismo formato que Imprimir) y todas las
 * fotos y firmas del registro en la carpeta `evidencias/`.
 */
export async function downloadSubmissionReport(
  config: FormReportConfig,
  record: Record<string, unknown>,
  onProgress?: ReportProgress,
): Promise<void> {
  const folderName = `${config.excelFileName}-${String(record.id).slice(0, 8)}`;
  const zip = new JSZip();
  const folder = zip.folder(folderName);
  if (!folder) throw new Error("No se pudo crear el ZIP");

  const { failures, mediaCount } = await addSubmissionToFolder(
    folder,
    config,
    record,
    onProgress,
  );

  onProgress?.("Empaquetando ZIP...");
  downloadBlob(await generateZipBlob(zip), `${folderName}.zip`);

  if (failures.length > 0) {
    throw new Error(
      `El ZIP se descargó, pero ${failures.length} de ${mediaCount} imágenes no se pudieron obtener (ver errores.txt).`,
    );
  }
}
