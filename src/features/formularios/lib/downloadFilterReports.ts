import JSZip from "jszip";
import type { FormReportConfig } from "../config/formReportTypes";
import { fetchAllFormReportPages, fetchFormReportById } from "../api/formReportsApi";
import { downloadBlob } from "./downloadBlob";
import {
  addSubmissionToFolder,
  generateZipBlob,
  toFileSlug,
} from "./downloadSubmissionReport";

/** Registros por ZIP: acota la memoria del navegador (PDF + fotos en RAM). */
export const BULK_CHUNK_SIZE = 15;
const PAUSE_BETWEEN_DOWNLOADS_MS = 1000;

export interface BulkProgress {
  /** Registro en proceso (1-based). */
  current: number;
  total: number;
  part: number;
  parts: number;
  message: string;
}

export interface BulkResult {
  total: number;
  processed: number;
  parts: number;
  failedRecords: number;
  cancelled: boolean;
}

export interface BulkOptions {
  chunkSize?: number;
  signal?: AbortSignal;
  onProgress?: (progress: BulkProgress) => void;
}

/** Ids de todos los registros del filtro (recorre las páginas del listado). */
export async function listFilterRecordIds(
  config: FormReportConfig,
  filter: Record<string, unknown>,
): Promise<string[]> {
  const rows = await fetchAllFormReportPages(config, filter);
  return rows
    .map((row) => (row.id != null ? String(row.id) : ""))
    .filter(Boolean);
}

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

interface IndexRow {
  folder: string;
  id: string;
  title: string;
  syncedAt: string;
  status: string;
}

function buildIndexCsv(rows: IndexRow[]): string {
  const header = ["Carpeta", "Id", "Registro", "Sincronizado", "Estado"];
  const lines = rows.map((r) =>
    [r.folder, r.id, r.title, r.syncedAt, r.status].map(csvCell).join(","),
  );
  return `\uFEFF${[header.map(csvCell).join(","), ...lines].join("\r\n")}\r\n`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Descarga, en varios ZIP de `chunkSize` registros, el reporte PDF + fotos + firmas
 * de cada registro. Cada ZIP incluye `indice.csv` y, si aplica, `errores.txt`.
 * Si se cancela, se entrega lo ya procesado en la parte en curso.
 */
export async function downloadFilterReports(
  config: FormReportConfig,
  ids: string[],
  { chunkSize = BULK_CHUNK_SIZE, signal, onProgress }: BulkOptions = {},
): Promise<BulkResult> {
  const total = ids.length;
  const parts = Math.max(1, Math.ceil(total / chunkSize));
  const partPad = String(parts).length;

  let processed = 0;
  let failedRecords = 0;
  let cancelled = false;
  let partsDelivered = 0;

  for (let part = 1; part <= parts && !cancelled; part += 1) {
    const zip = new JSZip();
    const indexRows: IndexRow[] = [];
    const errors: string[] = [];
    const slice = ids.slice((part - 1) * chunkSize, part * chunkSize);

    for (let i = 0; i < slice.length; i += 1) {
      if (signal?.aborted) {
        cancelled = true;
        break;
      }
      const id = slice[i];
      const globalIndex = (part - 1) * chunkSize + i + 1;
      const report = (message: string) =>
        onProgress?.({ current: globalIndex, total, part, parts, message });

      report("Consultando registro...");
      const row: IndexRow = {
        folder: "",
        id,
        title: "",
        syncedAt: "",
        status: "OK",
      };
      try {
        const record = await fetchFormReportById(config, id);
        row.title = config.detailTitle(record);
        row.syncedAt = String(record.syncedAt ?? "");
        row.folder = `${String(globalIndex).padStart(String(total).length, "0")}-${toFileSlug(
          row.title,
        ).slice(0, 50)}-${id.slice(0, 8)}`;

        const folder = zip.folder(row.folder);
        if (!folder) throw new Error("No se pudo crear la carpeta");

        const { failures } = await addSubmissionToFolder(folder, config, record, report);
        if (failures.length > 0) {
          row.status = `Con errores (${failures.length} imágenes)`;
          failedRecords += 1;
          errors.push(`[${row.folder}] ${failures.join("; ")}`);
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : "Error desconocido";
        row.status = `Falló: ${reason}`;
        failedRecords += 1;
        errors.push(`[${row.folder || id}] ${reason}`);
      }
      indexRows.push(row);
      processed += 1;
    }

    if (indexRows.length === 0) break;

    zip.file("indice.csv", buildIndexCsv(indexRows));
    if (errors.length > 0) {
      zip.file(
        "errores.txt",
        `Incidencias en ${errors.length} registro(s):\n\n${errors.join("\n")}\n`,
      );
    }

    onProgress?.({
      current: processed,
      total,
      part,
      parts,
      message: `Empaquetando parte ${part}/${parts}...`,
    });
    const name = `${config.excelFileName}-parte-${String(part).padStart(partPad, "0")}-de-${String(
      parts,
    ).padStart(partPad, "0")}.zip`;
    downloadBlob(await generateZipBlob(zip), name);
    partsDelivered += 1;

    if (part < parts && !cancelled) await sleep(PAUSE_BETWEEN_DOWNLOADS_MS);
  }

  return { total, processed, parts: partsDelivered, failedRecords, cancelled };
}
